import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  SubmitSkillDto,
  SkillTypeName,
  SKILL_TYPE_MAP,
  AUTO_SCORED_SKILLS,
  ContentJson,
  QuestionEntry,
  GetSkillsQueryDto,
} from './dto/practice.dto';



@Injectable()
export class PracticeService {
  constructor(private readonly prisma: PrismaService) {}

  // ══════════════════════════════════════════════════════════════════════════
  // 1. CREATE TEST SESSION
  // ══════════════════════════════════════════════════════════════════════════

  async startTest(practiceTestId: string, userId: string) {
    const practiceTest = await this.prisma.practiceTest.findUnique({
      where: { id: practiceTestId },
      include: { practiceTestSkills: true },
    });
    if (!practiceTest) {
      throw new NotFoundException(`PracticeTest '${practiceTestId}' not found`);
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`User '${userId}' not found`);
    }

    const existing = await this.prisma.test.findFirst({
      where: { userId, practiceTestId, status: 'IN_PROGRESS' },
    });
    if (existing) {
      throw new ConflictException(
        `User already has an in-progress test (testId: ${existing.id})`,
      );
    }

    const test = await this.prisma.test.create({
      data: { userId, practiceTestId, status: 'IN_PROGRESS' },
      select: {
        id: true,
        status: true,
        startedAt: true,
        practiceTest: { select: { title: true } },
      },
    });

    return {
      testId: test.id,
      status: test.status,
      startedAt: test.startedAt,
      practiceTest: test.practiceTest.title,
    };
  }

  // ══════════════════════════════════════════════════════════════════════════
  // 2. START SKILL ATTEMPT
  // ══════════════════════════════════════════════════════════════════════════

  async startSkillAttempt(testId: string, skillType: SkillTypeName, userId: string) {
    const skillTypeId = this.resolveSkillTypeId(skillType);

    const test = await this.prisma.test.findUnique({
      where: { id: testId },
      include: {
        practiceTest: {
          include: {
            practiceTestSkills: { include: { skillTest: true } },
          },
        },
      },
    });
    if (!test) throw new NotFoundException(`Test '${testId}' not found`);
    if (test.userId !== userId) throw new UnauthorizedException('This test does not belong to you');
    if (test.status !== 'IN_PROGRESS') {
      throw new BadRequestException(`Test is already ${test.status}`);
    }

    const practiceTestSkill = test.practiceTest.practiceTestSkills.find(
      (pts) => pts.skillTest.skillTypeId === skillTypeId,
    );
    if (!practiceTestSkill) {
      throw new NotFoundException(`No '${skillType}' skill found in this practice test`);
    }

    const skillTestId = practiceTestSkill.skillTestId;

    const existingAttempt = await this.prisma.testSkillAttempt.findUnique({
      where: { testId_skillTestId: { testId, skillTestId } },
    });
    if (existingAttempt) {
      if (existingAttempt.submittedAt) {
        throw new ConflictException(`'${skillType}' has already been submitted for this test`);
      }
      return {
        message: 'Skill attempt already started',
        attemptId: existingAttempt.id,
        skillType,
        startedAt: existingAttempt.createdAt,
      };
    }

    await this.prisma.skillTest.update({
      where: { id: skillTestId },
      data: { numberOfVisits: { increment: 1 } },
    });

    const attempt = await this.prisma.testSkillAttempt.create({
      data: { testId, skillTestId },
      select: { id: true, createdAt: true },
    });

    return {
      message: 'Skill attempt started',
      attemptId: attempt.id,
      skillType,
      skillTestId,
      startedAt: attempt.createdAt,
    };
  }

  // ══════════════════════════════════════════════════════════════════════════
  // 3. SUBMIT SKILL ANSWERS
  // ══════════════════════════════════════════════════════════════════════════

  async submitSkill(testId: string, skillType: SkillTypeName, dto: SubmitSkillDto, userId: string) {
    const skillTypeId = this.resolveSkillTypeId(skillType);

    const test = await this.prisma.test.findUnique({
      where: { id: testId },
      include: {
        practiceTest: {
          include: {
            practiceTestSkills: {
              include: {
                skillTest: { include: { skillContent: true } },
              },
            },
          },
        },
      },
    });
    if (!test) throw new NotFoundException(`Test '${testId}' not found`);
    if (test.userId !== userId) throw new UnauthorizedException('This test does not belong to you');
    if (test.status !== 'IN_PROGRESS') {
      throw new BadRequestException(`Test is already ${test.status}`);
    }

    const practiceTestSkill = test.practiceTest.practiceTestSkills.find(
      (pts) => pts.skillTest.skillTypeId === skillTypeId,
    );
    if (!practiceTestSkill) {
      throw new NotFoundException(`No '${skillType}' skill in this practice test`);
    }

    const { skillTest } = practiceTestSkill;

    const attempt = await this.prisma.testSkillAttempt.findUnique({
      where: { testId_skillTestId: { testId, skillTestId: skillTest.id } },
    });
    if (!attempt) {
      throw new BadRequestException(
        `Start the '${skillType}' attempt first: POST /practice/${testId}/skills/${skillType}/start`,
      );
    }
    if (attempt.submittedAt) {
      throw new ConflictException(`'${skillType}' has already been submitted`);
    }

    const isAutoScored = AUTO_SCORED_SKILLS.includes(skillType);
    const correctAnswerMap = isAutoScored
      ? this.extractCorrectAnswers(skillTest.skillContent.contentJson as ContentJson)
      : new Map<string, string>();

    let correctCount = 0;
    const totalGradeable = correctAnswerMap.size;

    const answerRows = dto.answers.map((a) => {
      const correct = correctAnswerMap.get(a.questionId) ?? null;
      const isCorrect = isAutoScored && correct !== null
        ? this.checkAnswer(a.userAnswer ?? '', correct)
        : null;

      if (isCorrect) correctCount++;

      return {
        attemptId: attempt.id,
        questionId: a.questionId,
        userAnswer: a.userAnswer ?? null,
        correctAnswer: correct,
        isCorrect,
        timeSpentSec: null as number | null,
      };
    });

    const score     = isAutoScored ? correctCount : null;
    const maxScore  = isAutoScored ? totalGradeable : null;
    const bandScore = isAutoScored && maxScore
      ? this.ieltsListeningReadingBand(correctCount, maxScore)
      : null;

    await this.prisma.$transaction(async (tx) => {
      await tx.testAnswer.createMany({ data: answerRows, skipDuplicates: true });
      await tx.testSkillAttempt.update({
        where: { id: attempt.id },
        data: { score, maxScore, bandScore, timeSpentSec: dto.timeSpentSec, submittedAt: new Date() },
      });
    });

    await this.maybeCompleteTest(testId);

    return {
      message: `${skillType} submitted successfully`,
      skillType,
      score,
      maxScore,
      bandScore,
      timeSpentSec: dto.timeSpentSec,
      correctCount: isAutoScored ? correctCount : undefined,
      totalQuestions: isAutoScored ? totalGradeable : undefined,
    };
  }

  // ══════════════════════════════════════════════════════════════════════════
  // PRIVATE HELPERS
  // ══════════════════════════════════════════════════════════════════════════

  private resolveSkillTypeId(skillType: SkillTypeName): number {
    const id = SKILL_TYPE_MAP[skillType];
    if (!id) {
      throw new BadRequestException(
        `Invalid skill type '${skillType}'. Must be one of: listening, reading, writing, speaking`,
      );
    }
    return id;
  }

  private extractCorrectAnswers(content: ContentJson): Map<string, string> {
    const map = new Map<string, string>();
    const blocks = [
      ...(content.sections?.flatMap((s) => s.question_blocks) ?? []),
      ...(content.passages?.flatMap((p) => p.question_blocks) ?? []),
    ];
    for (const block of blocks) {
      if (block.questions) {
        for (const q of block.questions) {
          if (q.id && q.answer !== undefined) {
            map.set(q.id, q.answer);
          }
        }
      }
    }
    return map;
  }

  private checkAnswer(userAnswer: string, correctAnswer: string): boolean {
    const normalise = (s: string) => s.trim().toLowerCase();
    const user = normalise(userAnswer);
    const accepted = correctAnswer.split('/').map(normalise);
    return accepted.some((a) => a === user);
  }

  private ieltsListeningReadingBand(correct: number, max: number): number {
    const pct = correct / max;
    if (pct >= 0.97) return 9.0;
    if (pct >= 0.93) return 8.5;
    if (pct >= 0.87) return 8.0;
    if (pct >= 0.80) return 7.5;
    if (pct >= 0.72) return 7.0;
    if (pct >= 0.63) return 6.5;
    if (pct >= 0.54) return 6.0;
    if (pct >= 0.45) return 5.5;
    if (pct >= 0.37) return 5.0;
    if (pct >= 0.29) return 4.5;
    if (pct >= 0.22) return 4.0;
    return 3.5;
  }

  private async maybeCompleteTest(testId: string) {
    const test = await this.prisma.test.findUnique({
      where: { id: testId },
      include: {
        practiceTest: { include: { practiceTestSkills: true } },
        skillAttempts: true,
      },
    });
    if (!test || test.status !== 'IN_PROGRESS') return;

    const totalSkills = test.practiceTest.practiceTestSkills.length;
    const submittedAttempts = test.skillAttempts.filter((a) => a.submittedAt);
    if (submittedAttempts.length < totalSkills) return;

    const totalScore = submittedAttempts.reduce((sum, a) => sum + (a.score ?? 0), 0);
    const maxScore   = submittedAttempts.reduce((sum, a) => sum + (a.maxScore ?? 0), 0);

    await this.prisma.test.update({
      where: { id: testId },
      data: { status: 'COMPLETED', totalScore, maxScore, completedAt: new Date() },
    });
  }

  // ══════════════════════════════════════════════════════════════════════════
// 4. GET PRACTICE TEST PREVIEW (before starting)
// ══════════════════════════════════════════════════════════════════════════

async getPracticeTestPreview(practiceTestId: string) {
  const practiceTest = await this.prisma.practiceTest.findUnique({
    where: { id: practiceTestId },
    include: {
      practiceTestSkills: {
        include: {
          skillTest: {
            include: { skillContent: true, skillType: true },
          },
        },
      },
    },
  });
  if (!practiceTest) {
    throw new NotFoundException(`PracticeTest '${practiceTestId}' not found`);
  }

  return {
    practiceTestId: practiceTest.id,
    title: practiceTest.title,
    skills: practiceTest.practiceTestSkills.map(({ skillTest }) => ({
      skillTestId: skillTest.id,
      skillType: skillTest.skillType.name,
      audioUrl: skillTest.skillContent.audioUrl ?? null,
      source: skillTest.skillContent.source,
      createdAt: skillTest.skillContent.createdAt,
      content: this.stripAnswers(skillTest.skillContent.contentJson as ContentJson),
    })),
  };
}

// ══════════════════════════════════════════════════════════════════════════
// 5. GET IN-PROGRESS TEST CONTENT (all skills)
// ══════════════════════════════════════════════════════════════════════════

async getTestContent(testId: string, userId: string) {
  const test = await this.prisma.test.findUnique({
    where: { id: testId },
    include: {
      practiceTest: {
        include: {
          practiceTestSkills: {
            include: {
              skillTest: {
                include: { skillContent: true, skillType: true },
              },
            },
          },
        },
      },
      skillAttempts: true,
    },
  });
  if (!test) throw new NotFoundException(`Test '${testId}' not found`);
  if (test.userId !== userId) throw new UnauthorizedException('This test does not belong to you');

  return {
    testId: test.id,
    status: test.status,
    startedAt: test.startedAt,
    practiceTestId: test.practiceTestId,
    title: test.practiceTest.title,
    skills: test.practiceTest.practiceTestSkills.map(({ skillTest }) => {
      const attempt = test.skillAttempts.find((a) => a.skillTestId === skillTest.id);
      return {
        skillTestId: skillTest.id,
        skillType: skillTest.skillType.name,
        audioUrl: skillTest.skillContent.audioUrl ?? null,
        source: skillTest.skillContent.source,
        attemptId: attempt?.id ?? null,
        attemptStatus: attempt
          ? attempt.submittedAt ? 'SUBMITTED' : 'IN_PROGRESS'
          : 'NOT_STARTED',
        content: this.stripAnswers(skillTest.skillContent.contentJson as ContentJson),
      };
    }),
  };
}

// ══════════════════════════════════════════════════════════════════════════
// 6. GET SINGLE SKILL CONTENT
// ══════════════════════════════════════════════════════════════════════════


// Get all practice tests ( title only for listing page)
async getAllPracticeTests(page: number = 1, limit: number = 20) {
  const skip = (page - 1) * limit;

  const [practiceTests, total] = await this.prisma.$transaction([
    this.prisma.practiceTest.findMany({
      skip,
      take: limit,
      select: {
        id: true,
        title: true,
      },
    }),
    this.prisma.practiceTest.count(),
  ]);

  return {
    data: practiceTests.map((pt) => ({
      practiceTestId: pt.id,
      title: pt.title,
    })),
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page < Math.ceil(total / limit),
      hasPrevPage: page > 1,
    },
  };
}
// Get all skills (title only for listing page)
async getAllSkills(query: GetSkillsQueryDto) {
  // default to page 1, limit 20 if not provided
  const { skillType, page = 1, limit = 20 } = query;
  const skip = (page - 1) * limit;
  // map skillType name to id for filtering
  const where = skillType
    ? { skillType: { name: skillType } }
    : {};

  const [skillTests, total] = await this.prisma.$transaction([
    this.prisma.skillTest.findMany({
      where,
      take: limit,
      skip,
      select: {
        skillContentId: true,
        numberOfVisits: true,
        skillType: { // join to get skill type name
          select: { name: true },
        },
        practiceTestSkills: {
          select: {  // joint table to find which practice tests this skill belongs to
            practiceTestId: true,
            practiceTest: { // get practice test title for listing page
              select: { title: true },
            },
          },
        },
      },
    }),
    this.prisma.skillTest.count({ where }),
  ]);

  return {
    data: skillTests.map((st) => ({
      skillType: st.skillType.name,
      skillContentId: st.skillContentId,
      numberOfVisits: st.numberOfVisits,
      practiceTests: st.practiceTestSkills.map((pts) => ({
        practiceTestId: pts.practiceTestId,
        title: pts.practiceTest.title,
      })),
    })),
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page < Math.ceil(total / limit),
      hasPrevPage: page > 1,
    },
  };
}
// get single content skill preview not start attempt
async getSkillContent(skillContentId: string) {
  const skillContent = await this.prisma.skillContent.findUnique({
    where: { id: skillContentId },
    select: {
      id: true,
      audioUrl: true,
      source: true,
      createdAt: true,
      contentJson: true,
      skillType: { select: { name: true } },
      skillTests: { select: { id: true } },  // ← get skillTest id
    },
  });

  if (!skillContent) {
    throw new NotFoundException(`SkillContent '${skillContentId}' not found`);
  }

  // increment numberOfVisits on all skillTests that use this content
  await this.prisma.skillTest.updateMany({
    where: { skillContentId },
    data: { numberOfVisits: { increment: 1 } },
  });

  return {
    skillContentId: skillContent.id,
    skillType: skillContent.skillType.name,
    audioUrl: skillContent.audioUrl ?? null,
    source: skillContent.source,
    createdAt: skillContent.createdAt,
    content: this.stripAnswers(skillContent.contentJson as ContentJson),
  };
}
private resolveSkillTypeName(skillTypeId: number): SkillTypeName {
  return Object.entries(SKILL_TYPE_MAP).find(
    ([, id]) => id === skillTypeId,
  )?.[0] as SkillTypeName;
}
// ── strip correct answers before sending to client ────────────────────────

private stripAnswers(content: ContentJson): ContentJson {
  const strip = (questions: QuestionEntry[]) =>
    questions.map(({ answer: _answer, ...rest }) => rest);

  return {
    sections: content.sections?.map((section) => ({
      ...section,
      question_blocks: section.question_blocks.map((block) => ({
        ...block,
        questions: block.questions ? strip(block.questions) : undefined,
      })),
    })),
    passages: content.passages?.map((passage) => ({
      ...passage,
      question_blocks: passage.question_blocks.map((block) => ({
        ...block,
        answers: undefined,           // drop top-level answer keys too
        questions: block.questions ? strip(block.questions) : undefined,
      })),
    })),
  };
}
}