import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUrl, MaxLength } from 'class-validator';

// ──────────────────────────────────────────────────────────
// REQUEST DTOs
// ──────────────────────────────────────────────────────────

export class UpdateUserProfileDto {
  @ApiPropertyOptional({ example: 'Nguyen Van A' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  fullName?: string;

  @ApiPropertyOptional({ example: 'https://cdn.example.com/avatar.jpg' })
  @IsOptional()
  @IsString()
  avatarUrl?: string;
}

// ──────────────────────────────────────────────────────────
// RESPONSE DTOs  (match frontend interfaces 1-to-1)
// ──────────────────────────────────────────────────────────

export class UserProfileDto {
  @ApiProperty() userId: string;
  @ApiProperty() email: string;
  @ApiPropertyOptional() fullName?: string;
  @ApiPropertyOptional() avatarUrl?: string;
  @ApiProperty() isPro: boolean;
  @ApiProperty() totalCredits: number;
  @ApiProperty() usedCredits: number;
  @ApiProperty() createdAt: string;
}

export class UserStatsDto {
  @ApiProperty() testsCompleted: number;
  @ApiProperty() avgBandScore: number;
  @ApiProperty() studyStreak: number;
  @ApiProperty() totalStudyTime: number; // minutes
}

export class UserActivityDto {
  @ApiProperty() id: string;
  @ApiProperty() title: string;
  @ApiProperty({ enum: ['Reading', 'Listening', 'Writing', 'Speaking'] })
  skill: 'Reading' | 'Listening' | 'Writing' | 'Speaking';
  @ApiProperty() score: number | string;
  @ApiProperty() date: string;
  @ApiProperty({ enum: ['COMPLETED', 'IN_PROGRESS', 'FAILED'] })
  status: 'COMPLETED' | 'IN_PROGRESS' | 'FAILED';
}

export class ProfileResponseDto {
  @ApiProperty({ type: UserProfileDto }) user: UserProfileDto;
  @ApiProperty({ type: UserStatsDto }) stats: UserStatsDto;
  @ApiProperty({ type: [UserActivityDto] }) recentActivities: UserActivityDto[];
}
export class SkillAttemptResultDto {
  @ApiProperty({ example: 'uuid' })
  attemptId: string;

  @ApiProperty({ example: 'Reading' })
  skill: string;

  @ApiProperty({ example: 7.5, nullable: true })
  bandScore: number | null;

  @ApiProperty({ example: 32, nullable: true })
  score: number | null;

  @ApiProperty({ example: 40, nullable: true })
  maxScore: number | null;

  @ApiProperty({ example: 1200, nullable: true })
  timeSpentSec: number | null;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z', nullable: true })
  submittedAt: string | null;
}

export class TestResultDto {
  @ApiProperty({ example: 'uuid' })
  testId: string;

  @ApiProperty({ example: 'IELTS Practice Test 3' })
  title: string;

  @ApiProperty({ enum: ['IN_PROGRESS', 'COMPLETED', 'ABANDONED'] })
  status: string;

  @ApiProperty({ example: 7.0, nullable: true })
  totalScore: number | null;

  @ApiProperty({ example: 9.0, nullable: true })
  maxScore: number | null;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  startedAt: string;

  @ApiProperty({ example: '2024-01-01T01:00:00.000Z', nullable: true })
  completedAt: string | null;

  @ApiProperty({ type: [SkillAttemptResultDto] })
  skillAttempts: SkillAttemptResultDto[];
}

export class TestResultsResponseDto {
  @ApiProperty({ type: [TestResultDto] })
  tests: TestResultDto[];

  @ApiProperty({ example: 12 })
  total: number;
}
export class TestAnswerDetailDto {
  @ApiProperty({ example: 'uuid' })
  answerId: string;

  @ApiProperty({ example: 'q1' })
  questionId: string;

  @ApiProperty({ example: 'B', nullable: true })
  userAnswer: string | null;

  @ApiProperty({ example: 'C', nullable: true })
  correctAnswer: string | null;

  @ApiProperty({ example: false, nullable: true })
  isCorrect: boolean | null;

  @ApiProperty({ example: 45, nullable: true })
  timeSpentSec: number | null;
}

export class TestAttemptDetailDto {
  @ApiProperty({ example: 'uuid' })
  attemptId: string;

  @ApiProperty({ example: 'Reading' })
  skill: string;

  @ApiProperty({ example: 7.5, nullable: true })
  bandScore: number | null;

  @ApiProperty({ example: 32, nullable: true })
  score: number | null;

  @ApiProperty({ example: 40, nullable: true })
  maxScore: number | null;

  @ApiProperty({ example: 1200, nullable: true })
  timeSpentSec: number | null;

  @ApiProperty({ example: '2024-01-01T01:00:00.000Z', nullable: true })
  submittedAt: string | null;

  @ApiPropertyOptional()
  writingEvaluation?: any;

  @ApiProperty({ type: [TestAnswerDetailDto] })
  answers: TestAnswerDetailDto[];
}
export interface ExplanationItem {
  questionId:    string;
  userAnswer:    string | null;
  correctAnswer: string;
  explanation:   string;
  tip:           string;
}