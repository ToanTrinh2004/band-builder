import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import {
  CreateGrammarSectionDto,
  UpdateGrammarSectionDto,
  CreateGrammarMistakeDto,
  UpdateGrammarMistakeDto,
} from './dto/grammar-admin.dto';

@Injectable()
export class GrammarAdminService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── Sections ─────────────────────────────────────────────────────────────────

  async createSection(dto: CreateGrammarSectionDto) {
    if (!dto) {
      throw new BadRequestException('Request body is missing or empty');
    }

    return this.prisma.grammarSection.create({
      data: {
        category: dto.category,
        subCategory: dto.subCategory,
        title: dto.title,
        ruleSummary: dto.ruleSummary,
        content: dto.content as Prisma.InputJsonValue,
        orderIndex: dto.orderIndex ?? 0,
      },
    });
  }

  async updateSection(id: string, dto: UpdateGrammarSectionDto) {
    if (!dto) {
      throw new BadRequestException('Request body is missing or empty');
    }

    try {
      return await this.prisma.grammarSection.update({
        where: { id },
        data: {
          category: dto.category,
          subCategory: dto.subCategory,
          title: dto.title,
          ruleSummary: dto.ruleSummary,
          content: dto.content !== undefined ? (dto.content as Prisma.InputJsonValue) : undefined,
          orderIndex: dto.orderIndex !== undefined ? dto.orderIndex : undefined,
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new NotFoundException(`Grammar section with ID ${id} not found`);
      }
      throw error;
    }
  }

  async deleteSection(id: string) {
    try {
      await this.prisma.grammarSection.delete({
        where: { id },
      });
      return { success: true, message: `Grammar section with ID ${id} deleted successfully` };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new NotFoundException(`Grammar section with ID ${id} not found`);
      }
      throw error;
    }
  }

  // ─── Mistakes ─────────────────────────────────────────────────────────────────

  async createMistake(dto: CreateGrammarMistakeDto) {
    if (!dto) {
      throw new BadRequestException('Request body is missing or empty');
    }

    return this.prisma.grammarMistake.create({
      data: {
        category: dto.category,
        incorrect: dto.incorrect,
        correct: dto.correct,
        note: dto.note,
        orderIndex: dto.orderIndex ?? 0,
      },
    });
  }

  async updateMistake(id: string, dto: UpdateGrammarMistakeDto) {
    if (!dto) {
      throw new BadRequestException('Request body is missing or empty');
    }

    try {
      return await this.prisma.grammarMistake.update({
        where: { id },
        data: {
          category: dto.category,
          incorrect: dto.incorrect,
          correct: dto.correct,
          note: dto.note,
          orderIndex: dto.orderIndex !== undefined ? dto.orderIndex : undefined,
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new NotFoundException(`Grammar mistake with ID ${id} not found`);
      }
      throw error;
    }
  }

  async deleteMistake(id: string) {
    try {
      await this.prisma.grammarMistake.delete({
        where: { id },
      });
      return { success: true, message: `Grammar mistake with ID ${id} deleted successfully` };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new NotFoundException(`Grammar mistake with ID ${id} not found`);
      }
      throw error;
    }
  }
}
