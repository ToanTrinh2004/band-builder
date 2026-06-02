import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateWritingSampleTopicDto,
  UpdateWritingSampleTopicDto,
  CreateWritingSampleEssayDto,
  UpdateWritingSampleEssayDto,
} from './dto/writing-sample-admin.dto';

@Injectable()
export class WritingSampleAdminService {
  constructor(private readonly prisma: PrismaService) {}

  // ── Topics CRUD ────────────────────────────────────────────────────────────

  async createTopic(dto: CreateWritingSampleTopicDto) {
    if (!dto) {
      throw new BadRequestException('Request body is missing or empty');
    }

    return this.prisma.writingSampleTopic.create({
      data: {
        taskType: dto.taskType,
        category: dto.category,
        prompt: dto.prompt,
        imageUrl: dto.imageUrl ?? null,
      },
    });
  }

  async updateTopic(id: string, dto: UpdateWritingSampleTopicDto) {
    if (!dto) {
      throw new BadRequestException('Request body is missing or empty');
    }

    // Check if topic exists
    const existing = await this.prisma.writingSampleTopic.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException(`Writing sample topic with ID ${id} not found`);
    }

    return this.prisma.writingSampleTopic.update({
      where: { id },
      data: {
        taskType: dto.taskType,
        category: dto.category,
        prompt: dto.prompt,
        imageUrl: dto.imageUrl !== undefined ? dto.imageUrl : undefined,
      },
    });
  }

  async deleteTopic(id: string) {
    const existing = await this.prisma.writingSampleTopic.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException(`Writing sample topic with ID ${id} not found`);
    }

    await this.prisma.writingSampleTopic.delete({
      where: { id },
    });

    return { success: true, message: `Writing sample topic with ID ${id} deleted successfully` };
  }

  // ── Essays CRUD ───────────────────────────────────────────────────────────

  async createEssay(topicId: string, dto: CreateWritingSampleEssayDto) {
    if (!dto) {
      throw new BadRequestException('Request body is missing or empty');
    }

    // Check if topic exists
    const topic = await this.prisma.writingSampleTopic.findUnique({
      where: { id: topicId },
    });
    if (!topic) {
      throw new NotFoundException(`Writing sample topic with ID ${topicId} not found`);
    }

    return this.prisma.writingSampleEssay.create({
      data: {
        topicId,
        bandScore: dto.bandScore,
        essayText: dto.essayText,
        essayTranslation: dto.essayTranslation,
        analysis: dto.analysis ?? null,
      },
    });
  }

  async updateEssay(id: string, dto: UpdateWritingSampleEssayDto) {
    if (!dto) {
      throw new BadRequestException('Request body is missing or empty');
    }

    const existing = await this.prisma.writingSampleEssay.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException(`Writing sample essay with ID ${id} not found`);
    }

    return this.prisma.writingSampleEssay.update({
      where: { id },
      data: {
        bandScore: dto.bandScore,
        essayText: dto.essayText,
        essayTranslation: dto.essayTranslation,
        analysis: dto.analysis !== undefined ? dto.analysis : undefined,
      },
    });
  }

  async deleteEssay(id: string) {
    const existing = await this.prisma.writingSampleEssay.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException(`Writing sample essay with ID ${id} not found`);
    }

    await this.prisma.writingSampleEssay.delete({
      where: { id },
    });

    return { success: true, message: `Writing sample essay with ID ${id} deleted successfully` };
  }
}
