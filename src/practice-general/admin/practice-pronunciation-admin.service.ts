import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { YoutubeTranscriptService, ScrapedSentence } from '../youtube/youtube-transcript.service';
import { Prisma } from '@prisma/client';
import {
  CreatePronunciationTopicAdminDto,
  UpdatePronunciationTopicAdminDto,
  CreatePronunciationVocabAdminDto,
  UpdatePronunciationVocabAdminDto,
  CreatePronunciationSentenceAdminDto,
  UpdatePronunciationSentenceAdminDto,
} from './dto/practice-pronunciation-admin.dto';

@Injectable()
export class PracticePronunciationAdminService {
  private readonly logger = new Logger(PracticePronunciationAdminService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly youtubeTranscriptService: YoutubeTranscriptService,
  ) { }

  // ── Pronunciation Topics CRUD ──────────────────────────────────────────────

  async createTopic(dto: CreatePronunciationTopicAdminDto) {
    if (!dto) {
      throw new BadRequestException('Request body is missing or empty');
    }

    let sentences: ScrapedSentence[] = [];
    if (dto.videoUrl) {
      try {
        sentences = await this.youtubeTranscriptService.fetchTranscriptByUrl(dto.videoUrl);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        this.logger.warn(`Could not automatically fetch YouTube transcript: ${message}`);
      }
    }

    return this.prisma.pronunciationTopic.create({
      data: {
        title: dto.title,
        paragraph: dto.paragraph,
        videoUrl: dto.videoUrl ?? null,
        audioUrl: dto.audioUrl ?? null,
        vocabs: dto.vocabs ? {
          createMany: {
            data: dto.vocabs,
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

  async updateTopic(id: string, dto: UpdatePronunciationTopicAdminDto) {
    if (!dto) {
      throw new BadRequestException('Request body is missing or empty');
    }

    // Lấy thông tin topic hiện tại để so sánh videoUrl
    const existing = await this.prisma.pronunciationTopic.findUnique({
      where: { id },
      select: { videoUrl: true },
    });
    if (!existing) {
      throw new NotFoundException(`Pronunciation topic with ID ${id} not found`);
    }

    let sentences: ScrapedSentence[] = [];
    let shouldUpdateSentences = false;

    // Nếu videoUrl thay đổi, tiến hành dọn phụ đề cũ và cào phụ đề mới từ YouTube
    if (dto.videoUrl !== undefined && dto.videoUrl !== existing.videoUrl) {
      shouldUpdateSentences = true;

      // Xóa toàn bộ các câu thoại cũ gắn với topic
      await this.prisma.pronunciationSentence.deleteMany({
        where: { topicId: id },
      });

      if (dto.videoUrl) {
        try {
          sentences = await this.youtubeTranscriptService.fetchTranscriptByUrl(dto.videoUrl);
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          this.logger.warn(`Could not automatically fetch YouTube transcript during topic update: ${message}`);
        }
      }
    }

    return this.prisma.pronunciationTopic.update({
      where: { id },
      data: {
        title: dto.title,
        paragraph: dto.paragraph,
        videoUrl: dto.videoUrl !== undefined ? dto.videoUrl : undefined,
        audioUrl: dto.audioUrl !== undefined ? dto.audioUrl : undefined,
        sentences: shouldUpdateSentences && sentences.length > 0 ? {
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

  async deleteTopic(id: string) {
    try {
      await this.prisma.pronunciationTopic.delete({
        where: { id },
      });

      return {
        success: true,
        message: `Pronunciation topic with ID ${id} deleted successfully along with all associated resources`,
      };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new NotFoundException(`Pronunciation topic with ID ${id} not found`);
      }
      throw error;
    }
  }

  // ── Pronunciation Vocabs CRUD ──────────────────────────────────────────────

  async createVocab(topicId: string, dto: CreatePronunciationVocabAdminDto) {
    if (!dto) {
      throw new BadRequestException('Request body is missing or empty');
    }

    const topic = await this.prisma.pronunciationTopic.findUnique({
      where: { id: topicId },
      select: { id: true },
    });
    if (!topic) {
      throw new NotFoundException(`Pronunciation topic with ID ${topicId} not found`);
    }

    return this.prisma.pronunciationVocab.create({
      data: {
        topicId,
        word: dto.word,
        ipa: dto.ipa,
        meaning: dto.meaning,
        audioUrl: dto.audioUrl ?? null,
        example: dto.example,
        exampleTranslation: dto.exampleTranslation,
      },
    });
  }

  async updateVocab(id: string, dto: UpdatePronunciationVocabAdminDto) {
    if (!dto) {
      throw new BadRequestException('Request body is missing or empty');
    }

    try {
      return await this.prisma.pronunciationVocab.update({
        where: { id },
        data: {
          word: dto.word,
          ipa: dto.ipa,
          meaning: dto.meaning,
          audioUrl: dto.audioUrl !== undefined ? dto.audioUrl : undefined,
          example: dto.example,
          exampleTranslation: dto.exampleTranslation,
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new NotFoundException(`Pronunciation vocabulary with ID ${id} not found`);
      }
      throw error;
    }
  }

  async deleteVocab(id: string) {
    try {
      await this.prisma.pronunciationVocab.delete({
        where: { id },
      });

      return {
        success: true,
        message: `Pronunciation vocabulary with ID ${id} deleted successfully`,
      };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new NotFoundException(`Pronunciation vocabulary with ID ${id} not found`);
      }
      throw error;
    }
  }

  // ── Pronunciation Sentences CRUD ───────────────────────────────────────────

  async createSentence(topicId: string, dto: CreatePronunciationSentenceAdminDto) {
    if (!dto) {
      throw new BadRequestException('Request body is missing or empty');
    }

    const topic = await this.prisma.pronunciationTopic.findUnique({
      where: { id: topicId },
      select: { id: true },
    });
    if (!topic) {
      throw new NotFoundException(`Pronunciation topic with ID ${topicId} not found`);
    }

    return this.prisma.pronunciationSentence.create({
      data: {
        topicId,
        text: dto.text,
        startTime: dto.startTime,
        endTime: dto.endTime,
        orderIndex: dto.orderIndex,
      },
    });
  }

  async updateSentence(id: string, dto: UpdatePronunciationSentenceAdminDto) {
    if (!dto) {
      throw new BadRequestException('Request body is missing or empty');
    }

    try {
      return await this.prisma.pronunciationSentence.update({
        where: { id },
        data: {
          text: dto.text,
          startTime: dto.startTime,
          endTime: dto.endTime,
          orderIndex: dto.orderIndex,
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new NotFoundException(`Pronunciation sentence with ID ${id} not found`);
      }
      throw error;
    }
  }

  async deleteSentence(id: string) {
    try {
      await this.prisma.pronunciationSentence.delete({
        where: { id },
      });

      return {
        success: true,
        message: `Pronunciation sentence with ID ${id} deleted successfully`,
      };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new NotFoundException(`Pronunciation sentence with ID ${id} not found`);
      }
      throw error;
    }
  }
}
