import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePracticeTestDto, UpdatePracticeTestDto, CreateSkillTestDto, UpdateSkillTestDto } from './dto/admin-practice.dto';

@Injectable()
export class AdminPracticeService {
  constructor(private readonly prisma: PrismaService) {}

  async createTest(dto: CreatePracticeTestDto) {
    return this.prisma.practiceTest.create({
      data: { title: dto.title },
    });
  }

  async getAllTests(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [data, total] = await this.prisma.$transaction([
      this.prisma.practiceTest.findMany({
        skip,
        take: limit,
        include: {
          practiceTestSkills: {
            include: {
              skillTest: {
                include: {
                  skillType: true,
                },
              },
            },
          },
        },
        orderBy: {
          title: 'asc',
        },
      }),
      this.prisma.practiceTest.count(),
    ]);

    return {
      data: data.map(pt => ({
        id: pt.id,
        title: pt.title,
        skills: pt.practiceTestSkills.map(pts => ({
          skillTestId: pts.skillTestId,
          skillContentId: pts.skillTest.skillContentId,
          skillType: pts.skillTest.skillType.name,
        })),
      })),
      meta: {
        totalItems: total,
        itemCount: data.length,
        itemsPerPage: limit,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
      },
    };
  }

  async getTestById(id: string) {
    const test = await this.prisma.practiceTest.findUnique({
      where: { id },
      include: {
        practiceTestSkills: {
          include: {
            skillTest: {
              include: {
                skillContent: true,
                skillType: true,
              },
            },
          },
        },
      },
    });

    if (!test) {
      throw new NotFoundException(`Practice test với ID ${id} không tồn tại`);
    }

    return {
      id: test.id,
      title: test.title,
      skills: test.practiceTestSkills.map(pts => ({
        skillTestId: pts.skillTest.id,
        skillContentId: pts.skillTest.skillContentId,
        skillType: pts.skillTest.skillType.name,
        skillTypeId: pts.skillTest.skillTypeId,
        audioUrl: pts.skillTest.skillContent.audioUrl,
        source: pts.skillTest.skillContent.source,
        createdAt: pts.skillTest.skillContent.createdAt,
        contentJson: pts.skillTest.skillContent.contentJson,
      })),
    };
  }

  async updateTest(id: string, dto: UpdatePracticeTestDto) {
    const test = await this.prisma.practiceTest.findUnique({ where: { id } });
    if (!test) {
      throw new NotFoundException(`Practice test với ID ${id} không tồn tại`);
    }

    return this.prisma.practiceTest.update({
      where: { id },
      data: { title: dto.title },
    });
  }

  async deleteTest(id: string) {
    const test = await this.prisma.practiceTest.findUnique({
      where: { id },
      include: {
        tests: { take: 1 },
      },
    });

    if (!test) {
      throw new NotFoundException(`Practice test với ID ${id} không tồn tại`);
    }

    if (test.tests.length > 0) {
      throw new BadRequestException('Không thể xóa đề thi này vì đã có học viên thực hiện làm bài.');
    }

    return this.prisma.$transaction(async (tx) => {
      const ptsList = await tx.practiceTestSkill.findMany({
        where: { practiceTestId: id },
      });

      for (const pts of ptsList) {
        await tx.practiceTestSkill.delete({
          where: { id: pts.id },
        });

        const otherUses = await tx.practiceTestSkill.count({
          where: { skillTestId: pts.skillTestId },
        });

        if (otherUses === 0) {
          const skillTest = await tx.skillTest.findUnique({
            where: { id: pts.skillTestId },
            include: {
              skillAttempts: { take: 1 },
            },
          });

          if (skillTest && skillTest.skillAttempts.length === 0) {
            await tx.skillTest.delete({
              where: { id: pts.skillTestId },
            });

            await tx.skillContent.delete({
              where: { id: skillTest.skillContentId },
            });
          }
        }
      }

      return tx.practiceTest.delete({
        where: { id },
      });
    });
  }

  async addSkillToTest(practiceTestId: string, dto: CreateSkillTestDto) {
    const test = await this.prisma.practiceTest.findUnique({
      where: { id: practiceTestId },
      include: {
        practiceTestSkills: {
          include: {
            skillTest: true,
          },
        },
      },
    });

    if (!test) {
      throw new NotFoundException(`Practice test với ID ${practiceTestId} không tồn tại`);
    }

    const hasSkillType = test.practiceTestSkills.some(
      pts => pts.skillTest.skillTypeId === dto.skillTypeId
    );

    if (hasSkillType) {
      throw new ConflictException(`Đề thi này đã chứa phần thi của kỹ năng có ID ${dto.skillTypeId}`);
    }

    return this.prisma.$transaction(async (tx) => {
      const skillContent = await tx.skillContent.create({
        data: {
          skillTypeId: dto.skillTypeId,
          contentJson: dto.contentJson,
          audioUrl: dto.audioUrl,
          source: dto.source,
        },
      });

      const skillTest = await tx.skillTest.create({
        data: {
          skillContentId: skillContent.id,
          skillTypeId: dto.skillTypeId,
        },
      });

      await tx.practiceTestSkill.create({
        data: {
          practiceTestId,
          skillTestId: skillTest.id,
        },
      });

      return {
        skillTestId: skillTest.id,
        skillContentId: skillContent.id,
        skillTypeId: dto.skillTypeId,
      };
    });
  }

  async updateSkill(skillContentId: string, dto: UpdateSkillTestDto) {
    const skillContent = await this.prisma.skillContent.findUnique({
      where: { id: skillContentId },
    });

    if (!skillContent) {
      throw new NotFoundException(`Nội dung kỹ năng với ID ${skillContentId} không tồn tại`);
    }

    return this.prisma.skillContent.update({
      where: { id: skillContentId },
      data: {
        contentJson: dto.contentJson !== undefined ? dto.contentJson : undefined,
        audioUrl: dto.audioUrl !== undefined ? dto.audioUrl : undefined,
        source: dto.source !== undefined ? dto.source : undefined,
      },
    });
  }

  async deleteSkillFromTest(practiceTestId: string, skillTestId: string) {
    const pts = await this.prisma.practiceTestSkill.findUnique({
      where: {
        practiceTestId_skillTestId: { practiceTestId, skillTestId },
      },
      include: {
        skillTest: true,
      },
    });

    if (!pts) {
      throw new NotFoundException(`Kỹ năng này không liên kết với đề thi được chỉ định`);
    }

    const attemptsCount = await this.prisma.testSkillAttempt.count({
      where: { skillTestId },
    });

    if (attemptsCount > 0) {
      throw new BadRequestException('Không thể xóa phần thi này vì đã có học viên thực hiện làm bài.');
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.practiceTestSkill.delete({
        where: { id: pts.id },
      });

      const otherUses = await tx.practiceTestSkill.count({
        where: { skillTestId },
      });

      if (otherUses === 0) {
        await tx.skillTest.delete({
          where: { id: skillTestId },
        });

        await tx.skillContent.delete({
          where: { id: pts.skillTest.skillContentId },
        });
      }

      return { success: true };
    });
  }
}
