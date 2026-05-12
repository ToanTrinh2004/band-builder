import {
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TestStatus } from '@prisma/client';
import {
  UpdateUserProfileDto,
  UserProfileDto,
  UserStatsDto,
  UserActivityDto,
  ProfileResponseDto,
} from './dto/user.dto';

// How many recent activity rows to return
const RECENT_ACTIVITY_LIMIT = 10;

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ──────────────────────────────────────────────────────────
  // GET /user/profile  →  ProfileResponseDTO
  // ──────────────────────────────────────────────────────────
  async getProfile(userId: string): Promise<ProfileResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { userCredit: true },
    });

    if (!user) throw new NotFoundException('User not found');

    const [stats, recentActivities] = await Promise.all([
      this.buildStats(userId),
      this.buildRecentActivities(userId),
    ]);

    return {
      user: this.mapUserProfile(user, user.userCredit),
      stats,
      recentActivities,
    };
  }

  // ──────────────────────────────────────────────────────────
  // PATCH /user/profile  →  UserProfileDTO
  // ──────────────────────────────────────────────────────────
  async updateProfile(
    userId: string,
    dto: UpdateUserProfileDto,
  ): Promise<UserProfileDto> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { userCredit: true },
    });

    if (!user) throw new NotFoundException('User not found');

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(dto.fullName !== undefined && { name: dto.fullName }),
        ...(dto.avatarUrl !== undefined && { avatarUrl: dto.avatarUrl }),
      },
      include: { userCredit: true },
    });

    return this.mapUserProfile(updated, updated.userCredit);
  }

  // ──────────────────────────────────────────────────────────
  // PRIVATE HELPERS
  // ──────────────────────────────────────────────────────────

  /**
   * Map Prisma User + UserCredit → UserProfileDTO.
   *
   * isPro: true when the user has a positive credit balance.
   * (Replace with your own business logic — e.g. a separate
   *  subscription flag — when that field exists in the schema.)
   *
   * totalCredits  = current balance + all credits ever spent
   * usedCredits   = sum of SPEND transactions (negative amounts stored positive here)
   */
  private mapUserProfile(
    user: {
      id: string;
      email: string;
      name: string | null;
      avatarUrl: string | null;
      createdAt: Date;
    },
    credit: { balance: number } | null,
  ): UserProfileDto {
    const balance = credit?.balance ?? 0;

    return {
      userId: user.id,
      email: user.email,
      fullName: user.name ?? undefined,
      avatarUrl: user.avatarUrl ?? undefined,
      isPro: balance > 0,
      totalCredits: balance,   // "total available" credits
      usedCredits: 0,          // filled in buildStats for full profile calls
      createdAt: user.createdAt.toISOString(),
    };
  }

  /**
   * Aggregate stats from Test + TestSkillAttempt tables.
   *
   * testsCompleted  — tests with status COMPLETED
   * avgBandScore    — mean of bandScore across all skill attempts
   * studyStreak     — consecutive days with at least one completed test (up to today)
   * totalStudyTime  — sum of timeSpentSec across all attempts → minutes
   */
  private async buildStats(userId: string): Promise<UserStatsDto> {
    // 1. Completed tests count
    const testsCompleted = await this.prisma.test.count({
      where: { userId, status: TestStatus.COMPLETED },
    });

    // 2. Average band score across all skill attempts for this user
    const bandAgg = await this.prisma.testSkillAttempt.aggregate({
      where: {
        test: { userId },
        bandScore: { not: null },
      },
      _avg: { bandScore: true },
      _sum: { timeSpentSec: true },
    });

    const avgBandScore = bandAgg._avg.bandScore
      ? Math.round(bandAgg._avg.bandScore * 10) / 10
      : 0;

    const totalStudyTime = Math.round((bandAgg._sum.timeSpentSec ?? 0) / 60);

    // 3. Study streak — consecutive calendar days with a completed test
    const studyStreak = await this.calcStudyStreak(userId);

    return { testsCompleted, avgBandScore, studyStreak, totalStudyTime };
  }

  /**
   * Returns the N most recent test skill attempts as activity rows.
   *
   * title  — PracticeTest.title  (e.g. "IELTS Practice Test 3")
   * skill  — SkillType.name      (e.g. "Reading")
   * score  — bandScore if present, else raw score, else "N/A"
   * status — mapped from Test.status
   */
  private async buildRecentActivities(
    userId: string,
  ): Promise<UserActivityDto[]> {
    const attempts = await this.prisma.testSkillAttempt.findMany({
      where: { test: { userId } },
      orderBy: { createdAt: 'desc' },
      take: RECENT_ACTIVITY_LIMIT,
      include: {
        test: {
          include: { practiceTest: true },
        },
        skillTest: {
          include: { skillType: true },
        },
      },
    });

    return attempts.map((attempt) => {
      const skillName = attempt.skillTest.skillType.name as UserActivityDto['skill'];
      const testStatus = attempt.test.status;

      // score: prefer bandScore → raw score → "N/A"
      let score: number | string = 'N/A';
      if (attempt.bandScore != null) score = attempt.bandScore;
      else if (attempt.score != null) score = attempt.score;

      // Map TestStatus enum → frontend status literal
      const statusMap: Record<string, UserActivityDto['status']> = {
        COMPLETED: 'COMPLETED',
        IN_PROGRESS: 'IN_PROGRESS',
        ABANDONED: 'FAILED',
      };

      return {
        id: attempt.id,
        title: attempt.test.practiceTest.title,
        skill: skillName,
        score,
        date: (attempt.submittedAt ?? attempt.createdAt).toISOString(),
        status: statusMap[testStatus] ?? 'FAILED',
      };
    });
  }

  /**
   * Calculates the current consecutive-day study streak.
   * A "day" is a UTC calendar day on which the user completed at least one test.
   */
  private async calcStudyStreak(userId: string): Promise<number> {
    // Fetch distinct completion dates (UTC day granularity)
    const completedTests = await this.prisma.test.findMany({
      where: { userId, status: TestStatus.COMPLETED, completedAt: { not: null } },
      select: { completedAt: true },
      orderBy: { completedAt: 'desc' },
    });

    if (!completedTests.length) return 0;

    // Normalise to UTC date strings "YYYY-MM-DD" and deduplicate
    const uniqueDays = [
      ...new Set(
        completedTests.map((t) =>
          t.completedAt!.toISOString().slice(0, 10),
        ),
      ),
    ].sort((a, b) => (a > b ? -1 : 1)); // descending

    const todayStr = new Date().toISOString().slice(0, 10);

    // Streak must include today or yesterday to be "active"
    const mostRecent = uniqueDays[0];
    const diffDays = this.daysBetween(mostRecent, todayStr);
    if (diffDays > 1) return 0; // streak broken

    let streak = 1;
    for (let i = 1; i < uniqueDays.length; i++) {
      const diff = this.daysBetween(uniqueDays[i], uniqueDays[i - 1]);
      if (diff === 1) streak++;
      else break;
    }

    return streak;
  }

  /** Returns the absolute difference in calendar days between two "YYYY-MM-DD" strings */
  private daysBetween(a: string, b: string): number {
    const msPerDay = 86_400_000;
    return Math.round(
      Math.abs(new Date(b).getTime() - new Date(a).getTime()) / msPerDay,
    );
  }
}