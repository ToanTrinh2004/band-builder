import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { YoutubeTranscriptService } from '../youtube/youtube-transcript.service';
import {
  Prisma,
  PronunciationTopic,
  PronunciationVocab,
  PronunciationSentence,
} from '@prisma/client';
import { CreatePronunciationTopicDto } from './dto/practice-general.dto';

interface ScrapedSentence {
  text: string;
  startTime: number;
  endTime: number;
  orderIndex: number;
}

@Injectable()
export class PracticeGeneralService {
  private readonly logger = new Logger(PracticeGeneralService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly youtubeTranscriptService: YoutubeTranscriptService,
  ) { }

  // ── Pronunciation ──────────────────────────────────────────────────────────

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

  /**
   * Creates a pronunciation topic and automatically scrapes sentences if videoUrl is supplied.
   */
  async createPronunciationTopic(
    data: CreatePronunciationTopicDto,
  ): Promise<
    PronunciationTopic & {
      vocabs: PronunciationVocab[];
      sentences: PronunciationSentence[];
    }
  > {
    let sentences: ScrapedSentence[] = [];
    if (data.videoUrl) {
      try {
        sentences = await this.youtubeTranscriptService.fetchTranscriptByUrl(data.videoUrl);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : String(error)

        this.logger.warn(
          `Could not automatically fetch YouTube transcript: ${message}`
        )
      }
    }

    return this.prisma.pronunciationTopic.create({
      data: {
        title: data.title,
        paragraph: data.paragraph,
        videoUrl: data.videoUrl,
        audioUrl: data.audioUrl,
        vocabs: data.vocabs ? {
          createMany: {
            data: data.vocabs,
          },
        } : undefined,
        sentences: sentences.length > 0 ? {
          createMany: {
            data: sentences,
          },
        } : undefined,
      },
      include: {
        vocabs: true,
        sentences: true,
      },
    });
  }
}
