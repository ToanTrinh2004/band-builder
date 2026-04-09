import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  UnauthorizedException,
  InternalServerErrorException,
  HttpException,
} from '@nestjs/common';
import { Anthropic } from '@anthropic-ai/sdk';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  SubmitSkillDto,
  SkillTypeName,
  SKILL_TYPE_MAP,
  AUTO_SCORED_SKILLS,
  ContentJson,
  QuestionEntry,
  GetSkillsQueryDto,
  PaginationQueryDto,
} from './dto/practice.dto';
import { IELTSScore } from './types/writing.type';
import { IELTS_SYSTEM_PROMPT } from './types/writing.promt'; 

@Injectable()
export class PracticeService {
  constructor(private readonly prisma: PrismaService) {}

  // ================================================================
  // TEST SESSION
  // ================================================================

  async startTest(practiceTestId: string, userId: string) {
    try {
      return await this.prisma.$transaction(async (tx) => {
        const practiceTest = await tx.practiceTest.findUnique({
          where: { id: practiceTestId },
        });
        if (!practiceTest) throw new NotFoundException(`PracticeTest not found`);

        const user = await tx.user.findUnique({ where: { id: userId } });
        if (!user) throw new NotFoundException(`User not found`);

        const existing = await tx.test.findFirst({
          where: { userId, practiceTestId, status: 'IN_PROGRESS' },
        });
        if (existing) {
          throw new ConflictException(
            `You already have an in-progress test (testId: ${existing.id})`,
          );
        }

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
          testId:       test.id,
          status:       test.status,
          startedAt:    test.startedAt,
          practiceTest: test.practiceTest.title,
        };
      });
    } catch (error) {
      if (error instanceof HttpException) throw error;
      if ((error as any)?.code === 'P2002') {
        throw new ConflictException('You already have an in-progress test');
      }
      throw new InternalServerErrorException('Failed to start test');
    }
  }

  // ================================================================
  // SKILL ATTEMPTS
  // ================================================================

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

    if (!test) throw new NotFoundException(`Test not found`);
    if (test.userId !== userId) throw new UnauthorizedException('This test does not belong to you');
    if (test.status !== 'IN_PROGRESS') throw new BadRequestException(`Test is already ${test.status}`);

    const matchedSkill = test.practiceTest.practiceTestSkills.find(
      (pts) => pts.skillTest.skillTypeId === skillTypeId,
    );
    if (!matchedSkill) throw new NotFoundException(`No '${skillType}' skill found in this test`);

    const { skillTestId } = matchedSkill;

    const existingAttempt = await this.prisma.testSkillAttempt.findUnique({
      where: { testId_skillTestId: { testId, skillTestId } },
    });

    if (existingAttempt) {
      if (existingAttempt.submittedAt) {
        throw new ConflictException(`'${skillType}' has already been submitted`);
      }
      // already started but not submitted — return it as-is (idempotent)
      return {
        message:   'Skill attempt already started',
        attemptId: existingAttempt.id,
        skillType,
        startedAt: existingAttempt.createdAt,
      };
    }

    try {
      const attempt = await this.prisma.$transaction(async (tx) => {
        await tx.skillTest.update({
          where: { id: skillTestId },
          data:  { numberOfVisits: { increment: 1 } },
        });

        return tx.testSkillAttempt.create({
          data:   { testId, skillTestId },
          select: { id: true, createdAt: true },
        });
      });

      return {
        message:        'Skill attempt started',
        attemptId:      attempt.id,
        skillType,
        skillTestId,
        skillContentId: matchedSkill.skillTest.skillContentId,
        startedAt:      attempt.createdAt,
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      if ((error as any)?.code === 'P2002') {
        throw new ConflictException(`'${skillType}' skill attempt already exists`);
      }
      throw new InternalServerErrorException('Failed to start skill attempt');
    }
  }

  async submitSkill(testId: string, skillType: SkillTypeName, dto: SubmitSkillDto, userId: string) {
    // writing has its own Claude-based flow
    if (skillType === 'writing') return this.submitWriting(testId, dto, userId);

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

    if (!test) throw new NotFoundException(`Test not found`);
    if (test.userId !== userId) throw new UnauthorizedException('This test does not belong to you');
    if (test.status !== 'IN_PROGRESS') throw new BadRequestException(`Test is already ${test.status}`);

    const matchedSkill = test.practiceTest.practiceTestSkills.find(
      (pts) => pts.skillTest.skillTypeId === skillTypeId,
    );
    if (!matchedSkill) throw new NotFoundException(`No '${skillType}' skill in this test`);

    const { skillTest } = matchedSkill;

    const attempt = await this.prisma.testSkillAttempt.findUnique({
      where: { testId_skillTestId: { testId, skillTestId: skillTest.id } },
    });
    if (!attempt) {
      throw new BadRequestException(
        `Start the '${skillType}' attempt first: POST /practice/tests/${testId}/skills/${skillType}/start`,
      );
    }
    if (attempt.submittedAt) throw new ConflictException(`'${skillType}' has already been submitted`);

    const uniqueIds = new Set(dto.answers.map((a) => a.questionId));
    if (uniqueIds.size !== dto.answers.length) {
      throw new BadRequestException('Duplicate questionIds in answers');
    }

    const isAutoScored    = AUTO_SCORED_SKILLS.includes(skillType);
    const correctAnswerMap = isAutoScored
      ? this.extractCorrectAnswers(skillTest.skillContent.contentJson as ContentJson)
      : new Map<string, string>();

    let correctCount = 0;
    const totalGradeable = correctAnswerMap.size;

    const answerRows = dto.answers.map((a) => {
      const correct   = correctAnswerMap.get(a.questionId) ?? null;
      const isCorrect = isAutoScored && correct !== null
        ? this.checkAnswer(a.userAnswer ?? '', correct)
        : null;

      if (isCorrect) correctCount++;

      return {
        attemptId:     attempt.id,
        questionId:    a.questionId,
        userAnswer:    a.userAnswer ?? null,
        correctAnswer: correct,
        isCorrect,
        timeSpentSec:  null as number | null,
      };
    });

    const score     = isAutoScored ? correctCount : null;
    const maxScore  = isAutoScored ? totalGradeable : null;
    const bandScore = isAutoScored && maxScore
      ? this.ieltsListeningReadingBand(correctCount, maxScore)
      : null;

    try {
      await this.prisma.$transaction(async (tx) => {
        const result = await tx.testAnswer.createMany({ data: answerRows, skipDuplicates: true });
        if (result.count !== answerRows.length) {
          throw new ConflictException('Some answers were already submitted');
        }

        await tx.testSkillAttempt.update({
          where: { id: attempt.id },
          data: {
            score,
            maxScore,
            bandScore,
            timeSpentSec: dto.timeSpentSec,
            submittedAt:  new Date(),
          },
        });

        await this.maybeCompleteTest(testId, tx);
      });
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException('Failed to submit skill');
    }

    return {
      message:        `${skillType} submitted successfully`,
      skillType,
      score,
      maxScore,
      bandScore,
      timeSpentSec:   dto.timeSpentSec,
      correctCount:   isAutoScored ? correctCount : undefined,
      totalQuestions: isAutoScored ? totalGradeable : undefined,
    };
  }

  // ================================================================
  // WRITING — Claude AI evaluation
  // ================================================================

  async submitWriting(testId: string, dto: SubmitSkillDto, userId: string) {
    console.log('Submitting writing skill with answers:', dto.answers);
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

    if (!test) throw new NotFoundException('Test not found');
    if (test.userId !== userId) throw new UnauthorizedException('This test does not belong to you');
    if (test.status !== 'IN_PROGRESS') throw new BadRequestException(`Test is already ${test.status}`);

    const writingSkill = test.practiceTest.practiceTestSkills.find(
      (pts) => pts.skillTest.skillTypeId === SKILL_TYPE_MAP['writing'],
    );
    if (!writingSkill) throw new NotFoundException('No writing skill found in this test');

    const attempt = await this.prisma.testSkillAttempt.findUnique({
      where: { testId_skillTestId: { testId, skillTestId: writingSkill.skillTest.id } },
    });
    if (!attempt) {
      throw new BadRequestException(
        `Start the writing attempt first: POST /practice/tests/${testId}/skills/writing/start`,
      );
    }
    if (attempt.submittedAt) throw new ConflictException('Writing has already been submitted');

    // pull essays from submitted answers
    const task1Essay = dto.answers.find((a) => a.questionId === 'task1')?.userAnswer?.trim();
    const task2Essay = dto.answers.find((a) => a.questionId === 'task2')?.userAnswer?.trim();

    if (!task1Essay) throw new BadRequestException('Task 1 essay is missing (questionId: "task1")');
    if (!task2Essay) throw new BadRequestException('Task 2 essay is missing (questionId: "task2")');

    const wordCount  = (text: string) => text.split(/\s+/).filter(Boolean).length;
    const task1Words = wordCount(task1Essay);
    const task2Words = wordCount(task2Essay);

    if (task1Words < 100) throw new BadRequestException(`Task 1 too short — ${task1Words} words, need at least 100`);
    if (task2Words < 200) throw new BadRequestException(`Task 2 too short — ${task2Words} words, need at least 200`);

    // pull question prompts from stored content if available
    const content      = writingSkill.skillTest.skillContent.contentJson as any;
    const task1Question = content?.task1?.question ?? '';
    const task2Question = content?.task2?.question ?? '';

    // evaluate both tasks in parallel — no reason to wait for one before the other
    let task1Score: IELTSScore;
    let task2Score: IELTSScore;
    try {
      [task1Score, task2Score] = await Promise.all([
        this.evaluateWithClaude('task1', task1Question, task1Essay),
        this.evaluateWithClaude('task2', task2Question, task2Essay),
      ]);
    } catch {
      throw new InternalServerErrorException('Claude evaluation failed — please try again');
    }

    // Task 1 = 1/3, Task 2 = 2/3 of the final band (official IELTS weighting)
    const overallBand =
      Math.round((task1Score.overall_band / 3 + (task2Score.overall_band * 2) / 3) * 2) / 2;

    // shorthand so the create block below stays readable
    const t1 = task1Score.criteria;
    const t2 = task2Score.criteria;

    try {
      await this.prisma.$transaction(async (tx) => {
        // store raw essays so nothing is lost
        await tx.testAnswer.createMany({
          data: [
            { attemptId: attempt.id, questionId: 'task1', userAnswer: task1Essay, isCorrect: null, correctAnswer: null },
            { attemptId: attempt.id, questionId: 'task2', userAnswer: task2Essay, isCorrect: null, correctAnswer: null },
          ],
          skipDuplicates: true,
        });

        // store full Claude breakdown
        await tx.writingEvaluation.create({
          data: {
            attemptId:   attempt.id,
            overallBand,

            // Task 1
            task1Band:                         task1Score.overall_band,
            task1TaskAchievement:              t1.task_achievement!.score,
            task1TaskAchievementRationale:     t1.task_achievement!.rationale,
            task1TaskAchievementExamples:      t1.task_achievement!.examples,
            task1TaskAchievementSuggestions:   t1.task_achievement!.suggestions,
            task1CoherenceCohesion:            t1.coherence_and_cohesion.score,
            task1CoherenceCohesionRationale:   t1.coherence_and_cohesion.rationale,
            task1CoherenceCohesionExamples:    t1.coherence_and_cohesion.examples,
            task1CoherenceCohesionSuggestions: t1.coherence_and_cohesion.suggestions,
            task1LexicalResource:              t1.lexical_resource.score,
            task1LexicalResourceRationale:     t1.lexical_resource.rationale,
            task1LexicalResourceExamples:      t1.lexical_resource.examples,
            task1LexicalResourceSuggestions:   t1.lexical_resource.suggestions,
            task1GrammaticalRange:              t1.grammatical_range_and_accuracy.score,
            task1GrammaticalRangeRationale:     t1.grammatical_range_and_accuracy.rationale,
            task1GrammaticalRangeExamples:      t1.grammatical_range_and_accuracy.examples,
            task1GrammaticalRangeSuggestions:   t1.grammatical_range_and_accuracy.suggestions,
            task1ImageFeedback:                task1Score.image_feedback ?? Prisma.JsonNull,
            task1OverallFeedback:              task1Score.overall_feedback,
            task1KeyStrengths:                 task1Score.key_strengths,
            task1KeyWeaknesses:                task1Score.key_weaknesses,
            task1PriorityImprovements:         task1Score.priority_improvements,
            task1Essay,
            task1WordCount:                    task1Words,

            // Task 2
            task2Band:                         task2Score.overall_band,
            task2TaskResponse:                 t2.task_response!.score,
            task2TaskResponseRationale:        t2.task_response!.rationale,
            task2TaskResponseExamples:         t2.task_response!.examples,
            task2TaskResponseSuggestions:      t2.task_response!.suggestions,
            task2CoherenceCohesion:            t2.coherence_and_cohesion.score,
            task2CoherenceCohesionRationale:   t2.coherence_and_cohesion.rationale,
            task2CoherenceCohesionExamples:    t2.coherence_and_cohesion.examples,
            task2CoherenceCohesionSuggestions: t2.coherence_and_cohesion.suggestions,
            task2LexicalResource:              t2.lexical_resource.score,
            task2LexicalResourceRationale:     t2.lexical_resource.rationale,
            task2LexicalResourceExamples:      t2.lexical_resource.examples,
            task2LexicalResourceSuggestions:   t2.lexical_resource.suggestions,
            task2GrammaticalRange:              t2.grammatical_range_and_accuracy.score,
            task2GrammaticalRangeRationale:     t2.grammatical_range_and_accuracy.rationale,
            task2GrammaticalRangeExamples:      t2.grammatical_range_and_accuracy.examples,
            task2GrammaticalRangeSuggestions:   t2.grammatical_range_and_accuracy.suggestions,
            task2OverallFeedback:              task2Score.overall_feedback,
            task2KeyStrengths:                 task2Score.key_strengths,
            task2KeyWeaknesses:                task2Score.key_weaknesses,
            task2PriorityImprovements:         task2Score.priority_improvements,
            task2Essay,
            task2WordCount:                    task2Words,
          },
        });

        // mirror band score to the attempt so history queries stay uniform
        await tx.testSkillAttempt.update({
          where: { id: attempt.id },
          data: {
            bandScore:    overallBand,
            timeSpentSec: dto.timeSpentSec,
            submittedAt:  new Date(),
          },
        });

        await this.maybeCompleteTest(testId, tx);
      });
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException('Failed to save writing results');
    }

    return {
      status:     'success',
      task_type:  'writing',
      word_count: { task1: task1Words, task2: task2Words },
      scored_at:  new Date().toISOString(),
      result: {
        overall_band: overallBand,
        task1: {
          band:                  task1Score.overall_band,
          criteria:              task1Score.criteria,
          ...(task1Score.image_feedback && { image_feedback: task1Score.image_feedback }),
          overall_feedback:      task1Score.overall_feedback,
          key_strengths:         task1Score.key_strengths,
          key_weaknesses:        task1Score.key_weaknesses,
          priority_improvements: task1Score.priority_improvements,
        },
        task2: {
          band:                  task2Score.overall_band,
          criteria:              task2Score.criteria,
          overall_feedback:      task2Score.overall_feedback,
          key_strengths:         task2Score.key_strengths,
          key_weaknesses:        task2Score.key_weaknesses,
          priority_improvements: task2Score.priority_improvements,
        },
      },
    };
  }
  // SPEAKING HINT AND SAMLPE RESPONSE
  async getSpeakingHint(skillContentId: string, questionId: string) {
    const skillContent = await this.prisma.skillContent.findUnique({
      where: { id: skillContentId },
      select: { contentJson: true },
    });
    if (!skillContent) throw new NotFoundException('Skill content not found');
   
    const content = skillContent.contentJson as any;
    const hint    = this.extractHint(content, questionId);
    if (!hint) throw new NotFoundException(`No hint found for questionId: ${questionId}`);
   
    return {
      questionId,
      skillContentId,
      hints:            hint.hints,
      grammar_features: hint.grammar_features ?? null,
    };
  }
   
  async getSpeakingSample(
    skillContentId: string,
    questionId:     string,
    band:           number,
    userId:         string,
  ) {
    // 1. validate band
    if (![5, 6, 7, 8, 9].includes(band)) {
      throw new BadRequestException('Band must be one of: 5, 6, 7, 8, 9');
    }
   
    // 2. check sample exists
    const sample = await this.prisma.speakingSample.findUnique({
      where: {
        skillContentId_questionId_band: { skillContentId, questionId, band },
      },
    });
    if (!sample) {
      throw new NotFoundException(`No sample found for questionId: ${questionId}, band: ${band}`);
    }
   
    // 3. check if user already has access — no charge if so
    const existingAccess = await this.prisma.speakingSampleAccess.findUnique({
      where: { userId_sampleId: { userId, sampleId: sample.id } },
    });
    if (existingAccess) {
      return this.formatSampleResponse(sample, { charged: false });
    }
   
    // 4. deduct 1 credit atomically
    const userCredit = await this.prisma.userCredit.findUnique({ where: { userId } });
    if (!userCredit || userCredit.balance < 1) {
      throw new BadRequestException(
        'Insufficient credits. Please purchase more credits to view sample answers.',
      );
    }
   
    // 5. deduct + create access + log transaction — all in one transaction
    try {
      await this.prisma.$transaction(async (tx) => {
        // re-check balance inside transaction to prevent race conditions
        const credit = await tx.userCredit.findUnique({ where: { userId } });
        if (!credit || credit.balance < 1) {
          throw new BadRequestException(
            'Insufficient credits. Please purchase more credits to view sample answers.',
          );
        }
   
        const transaction = await tx.creditTransaction.create({
          data: {
            userId,
            type:         'SPEND',
            amount:       -1,
            balanceBefore: credit.balance,
            balanceAfter:  credit.balance - 1,
            description:  `Sample answer: ${questionId} band ${band}`,
            referenceId:  sample.id,
            status:       'COMPLETED',
          },
        });
   
        await tx.userCredit.update({
          where: { userId },
          data:  { balance: { decrement: 1 } },
        });
   
        await tx.speakingSampleAccess.create({
          data: {
            userId,
            sampleId:      sample.id,
            transactionId: transaction.id,
          },
        });
      });
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException('Failed to process credit deduction');
    }
   
    return this.formatSampleResponse(sample, { charged: true });
  }

  // ================================================================
  // CONTENT — public browsing
  // ================================================================

  async getAllPracticeTests(page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [practiceTests, total] = await this.prisma.$transaction([
      this.prisma.practiceTest.findMany({
        skip,
        take: limit,
        select: { id: true, title: true },
      }),
      this.prisma.practiceTest.count(),
    ]);

    return {
      data: practiceTests.map((pt) => ({ practiceTestId: pt.id, title: pt.title })),
      meta: this.buildMeta(total, page, limit),
    };
  }

  async getAllSkills(query: GetSkillsQueryDto) {
    const { skillType, page = 1, limit = 20 } = query;
    const skip  = (page - 1) * limit;
    const where = skillType ? { skillType: { name: skillType } } : {};

    const [skillTests, total] = await this.prisma.$transaction([
      this.prisma.skillTest.findMany({
        where,
        take: limit,
        skip,
        select: {
          skillContentId: true,
          numberOfVisits: true,
          skillType:          { select: { name: true } },
          practiceTestSkills: {
            select: {
              practiceTestId: true,
              practiceTest:   { select: { title: true } },
            },
          },
        },
      }),
      this.prisma.skillTest.count({ where }),
    ]);

    return {
      data: skillTests.map((st) => ({
        skillType:      st.skillType.name,
        skillContentId: st.skillContentId,
        numberOfVisits: st.numberOfVisits,
        practiceTests:  st.practiceTestSkills.map((pts) => ({
          practiceTestId: pts.practiceTestId,
          title:          pts.practiceTest.title,
        })),
      })),
      meta: this.buildMeta(total, page, limit),
    };
  }

  async getPracticeTestPreview(practiceTestId: string) {
    const practiceTest = await this.prisma.practiceTest.findUnique({
      where: { id: practiceTestId },
      include: {
        practiceTestSkills: {
          include: {
            skillTest: { include: { skillContent: true, skillType: true } },
          },
        },
      },
    });
    if (!practiceTest) throw new NotFoundException(`PracticeTest not found`);

    return {
      practiceTestId: practiceTest.id,
      title:          practiceTest.title,
      skills:         practiceTest.practiceTestSkills.map(({ skillTest }) => ({
        skillTestId:    skillTest.id,
        skillType:      skillTest.skillType.name,
        audioUrl:       skillTest.skillContent.audioUrl ?? null,
        source:         skillTest.skillContent.source,
        createdAt:      skillTest.skillContent.createdAt,
        content:        this.stripAnswers(skillTest.skillContent.contentJson as ContentJson),
      })),
    };
  }

  async getSkillContent(skillContentId: string) {
    const skillContent = await this.prisma.skillContent.findUnique({
      where: { id: skillContentId },
      select: {
        id:        true,
        audioUrl:  true,
        source:    true,
        createdAt: true,
        contentJson: true,
        skillType:   { select: { name: true } },
        skillTests:  { select: { id: true } },
      },
    });
    if (!skillContent) throw new NotFoundException(`SkillContent not found`);

    return {
      skillContentId: skillContent.id,
      skillType:      skillContent.skillType.name,
      audioUrl:       skillContent.audioUrl ?? null,
      source:         skillContent.source,
      createdAt:      skillContent.createdAt,
      content:        this.stripAnswers(skillContent.contentJson as ContentJson),
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
                skillTest: { include: { skillContent: true, skillType: true } },
              },
            },
          },
        },
        skillAttempts: true,
      },
    });
    if (!test) throw new NotFoundException(`Test not found`);
    if (test.userId !== userId) throw new UnauthorizedException('This test does not belong to you');

    return {
      testId:         test.id,
      status:         test.status,
      startedAt:      test.startedAt,
      practiceTestId: test.practiceTestId,
      title:          test.practiceTest.title,
      skills:         test.practiceTest.practiceTestSkills.map(({ skillTest }) => {
        const attempt = test.skillAttempts.find((a) => a.skillTestId === skillTest.id);
        return {
          skillTestId:   skillTest.id,
          skillType:     skillTest.skillType.name,
          audioUrl:      skillTest.skillContent.audioUrl ?? null,
          source:        skillTest.skillContent.source,
          attemptId:     attempt?.id ?? null,
          attemptStatus: !attempt ? 'NOT_STARTED' : attempt.submittedAt ? 'SUBMITTED' : 'IN_PROGRESS',
          content:       this.stripAnswers(skillTest.skillContent.contentJson as ContentJson),
        };
      }),
    };
  }

  // ================================================================
  // PRIVATE HELPERS
  // ================================================================

  private async evaluateWithClaude(
    task:     'task1' | 'task2',
    question: string,
    essay:    string,
  ): Promise<IELTSScore> {
    const anthropic = new Anthropic({ apiKey: process.env.CLAUDE_API_KEY });

    const response = await anthropic.messages.create({
      model:      'claude-sonnet-4-6',
      max_tokens: 2048,
      system: [
        {
          type:          'text',
          text:          IELTS_SYSTEM_PROMPT,
          cache_control: { type: 'ephemeral' }, // rubric cached — saves ~65% input cost
        },
      ],
      messages: [
        {
          role:    'user',
          content: `Task Type: IELTS Writing ${task === 'task1' ? 'Task 1' : 'Task 2'}

Question:
${question || 'Not provided'}

Student Essay:
${essay}

Return the JSON score object only.`,
        },
      ],
    });

    const raw = response.content
      .filter((b) => b.type === 'text')
      .map((b: any) => b.text)
      .join('');

    return JSON.parse(raw.replace(/```json|```/g, '').trim()) as IELTSScore;
  }

  private async maybeCompleteTest(
    testId: string,
    tx: Prisma.TransactionClient | typeof this.prisma = this.prisma,
  ) {
    const test = await tx.test.findUnique({
      where:   { id: testId },
      include: {
        practiceTest:  { include: { practiceTestSkills: true } },
        skillAttempts: true,
      },
    });

    if (!test || test.status !== 'IN_PROGRESS') return;

    const totalSkills       = test.practiceTest.practiceTestSkills.length;
    const submittedAttempts = test.skillAttempts.filter((a) => a.submittedAt);

    if (submittedAttempts.length < totalSkills) return;

    const totalScore = submittedAttempts.reduce((sum, a) => sum + (a.score ?? 0), 0);
    const maxScore   = submittedAttempts.reduce((sum, a) => sum + (a.maxScore ?? 0), 0);

    await tx.test.update({
      where: { id: testId },
      data:  { status: 'COMPLETED', totalScore, maxScore, completedAt: new Date() },
    });
  }

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
    const map    = new Map<string, string>();
    const blocks = [
      ...(content.sections?.flatMap((s) => s.question_blocks) ?? []),
      ...(content.passages?.flatMap((p) => p.question_blocks) ?? []),
    ];

    for (const block of blocks) {
      for (const q of block.questions ?? []) {
        if (q.id && q.answer !== undefined) map.set(q.id, q.answer);
      }
    }

    return map;
  }

  private checkAnswer(userAnswer: string, correctAnswer: string): boolean {
    const normalise = (s: string) => s.trim().toLowerCase();
    return correctAnswer.split('/').map(normalise).some((a) => a === normalise(userAnswer));
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

  private buildMeta(total: number, page: number, limit: number) {
    const totalPages = Math.ceil(total / limit);
    return {
      total,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    };
  }

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
          answers:   undefined,
          questions: block.questions ? strip(block.questions) : undefined,
        })),
      })),
    };
  }
  private extractHint(content: any, questionId: string): { hints: string[]; grammar_features?: any } | null {
    // Part 1 — search inside topics
    if (content.parts) {
      for (const part of content.parts) {
        // Part 1 questions inside topics
        if (part.topics) {
          for (const topic of part.topics) {
            const q = topic.questions?.find((q: any) => q.id === questionId);
            if (q) return { hints: q.hints, grammar_features: q.grammar_features };
          }
        }
        // Part 2 cue card
        if (part.cue_card?.id === questionId) {
          return { hints: part.cue_card.hints, grammar_features: part.cue_card.grammar_features };
        }
        // Part 2 follow-up questions
        if (part.followup_questions) {
          const q = part.followup_questions.find((q: any) => q.id === questionId);
          if (q) return { hints: q.hints, grammar_features: q.grammar_features };
        }
        // Part 3 questions
        if (part.questions) {
          const q = part.questions.find((q: any) => q.id === questionId);
          if (q) return { hints: q.hints, grammar_features: q.grammar_features ?? null };
        }
      }
    }
    return null;
  }
   
  private formatSampleResponse(sample: any, meta: { charged: boolean }) {
    return {
      sampleId:            sample.id,
      questionId:          sample.questionId,
      band:                sample.band,
      answerText:          sample.answerText,
      tip:                 sample.tip,
      vocabularyHighlights: sample.vocabularyHighlights,
      charged:             meta.charged,  // lets frontend know if credit was spent
    };
  }
}