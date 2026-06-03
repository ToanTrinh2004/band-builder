import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import {
  CreateVocabTopicDto,
  UpdateVocabTopicDto,
  CreateVocabWordDto,
  UpdateVocabWordDto,
} from './dto/vocab-admin.dto';

@Injectable()
export class VocabAdminService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── Topics ──────────────────────────────────────────────────────────────────

  async createTopic(dto: CreateVocabTopicDto) {
    if (!dto) {
      throw new BadRequestException('Request body is missing or empty');
    }

    return this.prisma.vocabTopic.create({
      data: {
        name: dto.name,
        type: dto.type,
        bandLevel: dto.bandLevel ?? null,
      },
    });
  }

  async updateTopic(id: string, dto: UpdateVocabTopicDto) {
    if (!dto) {
      throw new BadRequestException('Request body is missing or empty');
    }

    try {
      return await this.prisma.vocabTopic.update({
        where: { id },
        data: {
          name: dto.name,
          type: dto.type,
          bandLevel: dto.bandLevel !== undefined ? dto.bandLevel : undefined,
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new NotFoundException(`Vocab topic with ID ${id} not found`);
      }
      throw error;
    }
  }

  async deleteTopic(id: string) {
    try {
      await this.prisma.vocabTopic.delete({
        where: { id },
      });
      return { success: true, message: `Vocab topic with ID ${id} and all its words deleted successfully` };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new NotFoundException(`Vocab topic with ID ${id} not found`);
      }
      throw error;
    }
  }

  // ─── Words ───────────────────────────────────────────────────────────────────

  async createWord(topicId: string, dto: CreateVocabWordDto) {
    if (!dto) {
      throw new BadRequestException('Request body is missing or empty');
    }

    const topic = await this.prisma.vocabTopic.findUnique({
      where: { id: topicId },
      select: { id: true },
    });
    if (!topic) {
      throw new NotFoundException(`Vocab topic with ID ${topicId} not found`);
    }

    return this.prisma.vocabWord.create({
      data: {
        topicId,
        word: dto.word,
        meaning: dto.meaning,
        pronunciation: dto.pronunciation ?? null,
        example: dto.example ?? null,
        synonyms: dto.synonyms ?? [],
      },
    });
  }

  async updateWord(id: string, dto: UpdateVocabWordDto) {
    if (!dto) {
      throw new BadRequestException('Request body is missing or empty');
    }

    try {
      return await this.prisma.vocabWord.update({
        where: { id },
        data: {
          word: dto.word,
          meaning: dto.meaning,
          pronunciation: dto.pronunciation !== undefined ? dto.pronunciation : undefined,
          example: dto.example !== undefined ? dto.example : undefined,
          synonyms: dto.synonyms !== undefined ? dto.synonyms : undefined,
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new NotFoundException(`Vocab word with ID ${id} not found`);
      }
      throw error;
    }
  }

  async deleteWord(id: string) {
    try {
      await this.prisma.vocabWord.delete({
        where: { id },
      });
      return { success: true, message: `Vocab word with ID ${id} deleted successfully` };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new NotFoundException(`Vocab word with ID ${id} not found`);
      }
      throw error;
    }
  }
}
