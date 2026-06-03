import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { GrammarSectionResponseDto, GrammarMistakeResponseDto } from './dto/grammar.dto';

@Injectable()
export class GrammarService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * List grammar sections, optionally filtered by category and/or subCategory. Ordered by orderIndex.
   */
  async getSections(category?: string, subCategory?: string): Promise<GrammarSectionResponseDto[]> {
    const where: any = {};
    if (category) where.category = category;
    if (subCategory) where.subCategory = subCategory;

    return this.prisma.grammarSection.findMany({
      where,
      orderBy: { orderIndex: 'asc' },
    });
  }

  /**
   * List mistakes, optionally filtered by category. Ordered by orderIndex.
   */
  async getMistakes(category?: string): Promise<GrammarMistakeResponseDto[]> {
    const where: any = {};
    if (category) where.category = category;

    return this.prisma.grammarMistake.findMany({
      where,
      orderBy: { orderIndex: 'asc' },
    });
  }
}
