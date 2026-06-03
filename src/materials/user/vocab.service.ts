import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { VocabType } from '@prisma/client';
import { VocabTopicDetailResponseDto, VocabTopicListItemResponseDto } from './dto/vocab.dto';

@Injectable()
export class VocabService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * List topics, optionally filtered by type. Returns word count.
   */
  async getTopics(type?: VocabType): Promise<VocabTopicListItemResponseDto[]> {
    const topics = await this.prisma.vocabTopic.findMany({
      where: type ? { type } : {},
      include: {
        _count: {
          select: { words: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    return topics.map((t) => ({
      id: t.id,
      name: t.name,
      type: t.type,
      bandLevel: t.bandLevel,
      wordCount: t._count.words,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
    }));
  }

  /**
   * Get topic detail with words list.
   */
  async getTopicDetail(id: string): Promise<VocabTopicDetailResponseDto> {
    const topic = await this.prisma.vocabTopic.findUnique({
      where: { id },
      include: {
        words: {
          orderBy: { word: 'asc' },
        },
      },
    });

    if (!topic) {
      throw new NotFoundException(`Vocab topic with ID ${id} not found`);
    }

    return topic;
  }
}
