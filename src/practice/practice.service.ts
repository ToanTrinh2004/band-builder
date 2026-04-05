import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  UnauthorizedException,
  InternalServerErrorException,
  HttpException,
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
import { Prisma } from '@prisma/client';


@Injectable()
export class PracticeService {
  constructor(private readonly prisma: PrismaService) {}

  // CREATE TEST SESSION
  async startTest(practiceTestId: string, userId: string) {
    try {
      return await this.prisma.$transaction(async (tx) => {
        // check practice test exists
        const practiceTest = await tx.practiceTest.findUnique({
          where: { id: practiceTestId },
        });
        if (!practiceTest) {
          throw new NotFoundException(`PracticeTest '${practiceTestId}' not found`);
        }
  
        // check user exists
        const user = await tx.user.findUnique({ where: { id: userId } });
        if (!user) {
          throw new NotFoundException(`User '${userId}' not found`);
        }
  
        // check if user already has an in-progress test for this practice test
        const existing = await tx.test.findFirst({
          where: { userId, practiceTestId, status: 'IN_PROGRESS' },
        });
        if (existing) {
          throw new ConflictException(
            `User already has an in-progress test (testId: ${existing.id})`,
          );
        }
        // create the test
        const test = await tx.test.create({
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
      });
    } catch (error) {
      // re-throw NestJS HTTP exceptions as-is
      if (error instanceof HttpException) {
        throw error;
      }
      // P2002 = unique constraint violation (race condition fallback)
      if (typeof error === 'object' && error !== null && 'code' in error && (error as any).code === 'P2002') {
        throw new ConflictException('User already has an in-progress test');
      }
      throw new InternalServerErrorException('Failed to start test');
    }
  }

  
  async startSkillAttempt(testId: string, skillType: SkillTypeName, userId: string) {
    // convert skill type name to id for querying (ex: listening => 1)
    const skillTypeId = this.resolveSkillTypeId(skillType);
  
    // fetch test with full nested data needed for validation
    // includes practiceTestSkills to verify skill type exists in this test
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
  
    // validate test exists
    if (!test) throw new NotFoundException(`Test '${testId}' not found`);
    // validate test belongs to the requesting user
    if (test.userId !== userId) throw new UnauthorizedException('This test does not belong to you');
    // validate test is still in progress (not completed or cancelled)
    if (test.status !== 'IN_PROGRESS') {
      throw new BadRequestException(`Test is already ${test.status}`);
    }
  
    // find the matching skill in this practice test by skillTypeId
    // (pure JS — no extra DB query, uses already-loaded include data)
    const practiceTestSkill = test.practiceTest.practiceTestSkills.find(
      (pts) => pts.skillTest.skillTypeId === skillTypeId,
    );
    // if skill type not found in this practice test, throw 404
    if (!practiceTestSkill) {
      throw new NotFoundException(`No '${skillType}' skill found in this practice test`);
    }
  
    // extract skillTestId to use in attempt lookup and creation
    const skillTestId = practiceTestSkill.skillTestId;
  
    // check if an attempt already exists for this test + skill combination
    const existingAttempt = await this.prisma.testSkillAttempt.findUnique({
      where: { testId_skillTestId: { testId, skillTestId } },
    });
  
    if (existingAttempt) {
      // if already submitted, block re-attempt
      if (existingAttempt.submittedAt) {
        throw new ConflictException(`'${skillType}' has already been submitted for this test`);
      }
      // if started but not submitted, return existing attempt (idempotent)
      return {
        message: 'Skill attempt already started',
        attemptId: existingAttempt.id,
        skillType,
        startedAt: existingAttempt.createdAt,
      };
    }
  
    try {
      // wrap both writes in a transaction so they succeed or fail together
      // prevents visit count incrementing without an attempt being created
      const attempt = await this.prisma.$transaction(async (tx) => {
        // increment visit count on the skill test for analytics
        await tx.skillTest.update({
          where: { id: skillTestId },
          data: { numberOfVisits: { increment: 1 } },
        });
  
        // create the new skill attempt record
        return tx.testSkillAttempt.create({
          data: { testId, skillTestId },
          select: { id: true, createdAt: true },
        });
      });
  
      // return clean response shape to the controller
      return {
        message: 'Skill attempt started',
        attemptId: attempt.id,
        skillType,
        skillTestId,
        skillContentId: practiceTestSkill.skillTest.skillContentId,
        startedAt: attempt.createdAt,
      };
    } catch (error) {
      // re-throw NestJS HTTP exceptions so they aren't swallowed as 500
      if (error instanceof HttpException) throw error;
      // P2002 = unique constraint violation (race condition between findUnique and create)
      if (typeof error === 'object' && error !== null && 'code' in error && (error as any).code === 'P2002') {
        throw new ConflictException(`'${skillType}' skill attempt already exists`);
      }
      // catch-all for unexpected DB or runtime errors
      throw new InternalServerErrorException('Failed to start skill attempt');
    }
  }

  // listening and reading are auto-scored based on correct answers in content JSON
  async submitSkill(testId: string, skillType: SkillTypeName, dto: SubmitSkillDto, userId: string) {
    // convert skill type name to id for querying (ex: listening => 1)
    const skillTypeId = this.resolveSkillTypeId(skillType);
  
    // fetch test with full nested data needed for validation and scoring
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
  
    // validate test exists, belongs to user, and is still in progress
    if (!test) throw new NotFoundException(`Test '${testId}' not found`);
    if (test.userId !== userId) throw new UnauthorizedException('This test does not belong to you');
    if (test.status !== 'IN_PROGRESS') {
      throw new BadRequestException(`Test is already ${test.status}`);
    }
  
    // find matching skill type in this practice test (pure JS, no extra DB query)
    const practiceTestSkill = test.practiceTest.practiceTestSkills.find(
      (pts) => pts.skillTest.skillTypeId === skillTypeId,
    );
    if (!practiceTestSkill) {
      throw new NotFoundException(`No '${skillType}' skill in this practice test`);
    }
  
    const { skillTest } = practiceTestSkill;
  
    // validate attempt exists and has not been submitted yet
    const attempt = await this.prisma.testSkillAttempt.findUnique({
      where: { testId_skillTestId: { testId, skillTestId: skillTest.id } },
    });
    if (!attempt) {
      throw new BadRequestException(
        `Start the '${skillType}' attempt first: POST /practice/tests/${testId}/skills/${skillType}/start`,
      );
    }
    if (attempt.submittedAt) {
      throw new ConflictException(`'${skillType}' has already been submitted`);
    }
  
    // validate no duplicate questionIds in submitted answers
    const uniqueQuestionIds = new Set(dto.answers.map((a) => a.questionId));
    if (uniqueQuestionIds.size !== dto.answers.length) {
      throw new BadRequestException('Duplicate questionIds in answers');
    }
  
    // build correct answer map only for auto-scored skills (listening, reading)
    const isAutoScored = AUTO_SCORED_SKILLS.includes(skillType);
    const correctAnswerMap = isAutoScored
      ? this.extractCorrectAnswers(skillTest.skillContent.contentJson as ContentJson)
      : new Map<string, string>();
  
    let correctCount = 0;
    const totalGradeable = correctAnswerMap.size;
  
    // map each submitted answer to a DB row, checking correctness for auto-scored skills
    const answerRows = dto.answers.map((a) => {
      const correct = correctAnswerMap.get(a.questionId) ?? null;
      const isCorrect =
        isAutoScored && correct !== null
          ? this.checkAnswer(a.userAnswer ?? '', correct)
          : null;
  
      if (isCorrect) correctCount++;
  
      return {
        attemptId: attempt.id,
        questionId: a.questionId,
        userAnswer: a.userAnswer ?? null,
        correctAnswer: correct,
        isCorrect,
        timeSpentSec: null as number | null, // per-question time not tracked yet
      };
    });
  
    // calculate scores — null for manual skills (writing, speaking)
    const score     = isAutoScored ? correctCount : null;
    const maxScore  = isAutoScored ? totalGradeable : null;
    const bandScore =
      isAutoScored && maxScore
        ? this.ieltsListeningReadingBand(correctCount, maxScore)
        : null;
  
    try {
      await this.prisma.$transaction(async (tx) => {
        // save all answers atomically
        const result = await tx.testAnswer.createMany({ data: answerRows, skipDuplicates: true });
        // ensure all answers were saved — skipDuplicates can silently skip rows
        if (result.count !== answerRows.length) {
          throw new ConflictException('Some answers were already submitted');
        }
  
        // mark attempt as submitted with score data
        await tx.testSkillAttempt.update({
          where: { id: attempt.id },
          data: {
            score,
            maxScore,
            bandScore,
            timeSpentSec: dto.timeSpentSec,
            submittedAt: new Date(),
          },
        });
  
        // check if all skills are submitted and complete the test if so
        // inside transaction to keep test status consistent with attempt state
        await this.maybeCompleteTest(testId, tx);
      });
    } catch (error) {
      // re-throw NestJS HTTP exceptions so they aren't swallowed as 500
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException('Failed to submit skill');
    }
  
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
  // submit writing skill
 
  

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

  private async maybeCompleteTest(
    testId: string,
    // accept tx so it can run inside caller's transaction
    // defaults to this.prisma when called standalone
    tx: Prisma.TransactionClient | typeof this.prisma = this.prisma,
  ) {
    // re-fetch test with all skill attempts and expected skills count
    const test = await tx.test.findUnique({
      where: { id: testId },
      include: {
        practiceTest: { include: { practiceTestSkills: true } },
        skillAttempts: true,
      },
    });
  
    // skip if test not found or already completed/cancelled
    if (!test || test.status !== 'IN_PROGRESS') return;
  
    const totalSkills = test.practiceTest.practiceTestSkills.length;
  
    // only count attempts that have been actually submitted
    const submittedAttempts = test.skillAttempts.filter((a) => a.submittedAt);
  
    // not all skills submitted yet — do nothing
    if (submittedAttempts.length < totalSkills) return;
  
    // aggregate scores across all submitted skill attempts
    // skills without auto-scoring (writing/speaking) contribute 0 until manually graded
    const totalScore = submittedAttempts.reduce((sum, a) => sum + (a.score ?? 0), 0);
    const maxScore   = submittedAttempts.reduce((sum, a) => sum + (a.maxScore ?? 0), 0);
  
    // all skills submitted — mark test as completed
    await tx.test.update({
      where: { id: testId },
      data: {
        status: 'COMPLETED',
        totalScore,
        maxScore,
        completedAt: new Date(),
      },
    });
  }

//  GET PRACTICE TEST PREVIEW (before starting)

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


  return {
    skillContentId: skillContent.id,
    skillType: skillContent.skillType.name,
    audioUrl: skillContent.audioUrl ?? null,
    source: skillContent.source,
    createdAt: skillContent.createdAt,
    content: this.stripAnswers(skillContent.contentJson as ContentJson),
  };
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