import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AdjustCreditsDto, UpdateUserRoleDto } from './dto/admin-user.dto';

@Injectable()
export class AdminUserService {
  constructor(private readonly prisma: PrismaService) {}

  // 1. List all users with credit balances
  async listUsers() {
    const users = await this.prisma.user.findMany({
      include: {
        userCredit: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return users.map((user) => ({
      id: user.id,
      name: user.name ?? 'Guest',
      email: user.email,
      role: user.role,
      balance: user.userCredit?.balance ?? 0,
      joinDate: user.createdAt.toISOString().slice(0, 10),
    }));
  }

  // 2. Get transaction history for a specific user
  async getUserTransactions(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      throw new NotFoundException('Không tìm thấy học viên.');
    }

    return this.prisma.creditTransaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  // 3. Adjust user credits (BONUS / REFUND)
  async adjustCredits(userId: string, dto: AdjustCreditsDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      throw new NotFoundException('Không tìm thấy học viên.');
    }

    const signedAmount = dto.type === 'BONUS' ? dto.amount : -dto.amount;

    return this.prisma.$transaction(async (tx) => {
      // Find or create user credit
      const userCredit = await tx.userCredit.upsert({
        where: { userId },
        create: { userId, balance: 0 },
        update: {},
      });

      const balanceBefore = userCredit.balance;
      const balanceAfter = balanceBefore + signedAmount;

      if (balanceAfter < 0) {
        throw new BadRequestException('Số dư ví không thể âm sau khi điều chỉnh.');
      }

      // Update balance
      await tx.userCredit.update({
        where: { userId },
        data: { balance: balanceAfter },
      });

      // Create transaction log
      return tx.creditTransaction.create({
        data: {
          userId,
          type: dto.type,
          amount: signedAmount,
          balanceBefore,
          balanceAfter,
          description: dto.reason,
          status: 'COMPLETED',
        },
      });
    });
  }

  // 4. Update user role
  async updateUserRole(userId: string, dto: UpdateUserRoleDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      throw new NotFoundException('Không tìm thấy học viên.');
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: { role: dto.role },
    });
  }
}
