import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { WritingTaskType, WritingSampleTopic, WritingSampleEssay } from '@prisma/client';

@Injectable()
export class WritingSampleService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Fetches all writing sample topics, filtered optionally by task type, along with essay counts.
   */
  async getTopics(
    taskType?: WritingTaskType,
  ): Promise<(WritingSampleTopic & { essayCount: number })[]> {
    const topics = await this.prisma.writingSampleTopic.findMany({
      where: taskType ? { taskType } : {},
      include: {
        _count: {
          select: { essays: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return topics.map((t) => ({
      ...t,
      essayCount: t._count.essays,
    }));
  }

  /**
   * Fetches details of a single writing sample topic, including all associated essays ordered by band score.
   */
  async getTopicDetail(
    id: string,
  ): Promise<WritingSampleTopic & { essays: WritingSampleEssay[] }> {
    const topic = await this.prisma.writingSampleTopic.findUnique({
      where: { id },
      include: {
        essays: {
          orderBy: { bandScore: 'desc' },
        },
      },
    });

    if (!topic) {
      throw new NotFoundException(`Writing sample topic with ID ${id} not found`);
    }

    return topic;
  }
}
