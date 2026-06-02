import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  PronunciationTopic,
  PronunciationVocab,
  PronunciationSentence,
} from '@prisma/client';

@Injectable()
export class PracticePronunciationService {
  private readonly logger = new Logger(PracticePronunciationService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Fetches all pronunciation topics along with count of core vocabularies.
   */
  async getPronunciationTopics(): Promise<
    { id: string; title: string; vocabCount: number }[]
  > {
    const topics = await this.prisma.pronunciationTopic.findMany({
      include: {
        _count: {
          select: { vocabs: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return topics.map((t) => ({
      id: t.id,
      title: t.title,
      vocabCount: t._count.vocabs,
    }));
  }

  /**
   * Fetches pronunciation topic detail including keys vocabularies and interactive sentences.
   */
  async getPronunciationTopicDetail(
    id: string,
  ): Promise<
    PronunciationTopic & {
      vocabs: PronunciationVocab[];
      sentences: PronunciationSentence[];
    }
  > {
    const topic = await this.prisma.pronunciationTopic.findUnique({
      where: { id },
      include: {
        vocabs: true,
        sentences: {
          orderBy: { orderIndex: 'asc' },
        },
      },
    });

    if (!topic) {
      throw new NotFoundException(`Pronunciation topic with ID ${id} not found`);
    }

    return topic;
  }
}
