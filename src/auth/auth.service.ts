// auth.service.ts

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { Response } from 'express';
import { JwtService } from '@nestjs/jwt';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { GoogleUserDto } from './dto/google-user.dto';
import { AuthTokensDto } from './dto/auth-tokens.dto';
import { MeResponseDto } from './dto/me-response.dto';

// Centralise cookie config so it can't drift between methods
export const COOKIE_BASE = {
  httpOnly: true,
  secure: true,
  sameSite: 'none' as const,   // Required for cross-origin + mobile browsers
};

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) { }

  // ─── Token helpers ────────────────────────────────────────────────────────

  async generateTokens(userId: string, email: string): Promise<AuthTokensDto> {
    const payload = { sub: userId, email };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: process.env.JWT_SECRET,
        expiresIn: '15m',
      }),
      this.jwtService.signAsync(payload, {
        secret: process.env.JWT_REFRESH_SECRET,
        expiresIn: '7d',
      }),
    ]);

    return { accessToken, refreshToken };
  }

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  async saveRefreshToken(userId: string, refreshToken: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: this.hashToken(refreshToken) },
    });
  }

  // ─── Auth flows ───────────────────────────────────────────────────────────

  async validateGoogleUser(googleUser: GoogleUserDto) {
    const { email, googleId, name, avatarUrl } = googleUser;

    let user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      user = await this.prisma.$transaction(async (tx) => {
        const newUser = await tx.user.create({
          data: {
            email,
            googleId,
            name,
            avatarUrl,
            role: 'STUDENT',
          },
        });

        await tx.userCredit.create({
          data: {
            userId: newUser.id,
            balance: 10,
          },
        });

        await tx.creditTransaction.create({
          data: {
            userId: newUser.id,
            type: 'BONUS',
            amount: 10,
            balanceBefore: 0,
            balanceAfter: 10,
            description: 'Chào mừng thành viên mới (Tặng 10 Credits)',
            status: 'COMPLETED',
          },
        });

        return newUser;
      });
    } else {
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: { googleId, name, avatarUrl },
      });
    }

    const tokens = await this.generateTokens(user.id, user.email);
    await this.saveRefreshToken(user.id, tokens.refreshToken);

    return { ...tokens, user };
  }

  async refreshTokens(refreshToken: string, res: Response): Promise<AuthTokensDto> {
    if (!refreshToken) throw new UnauthorizedException('No refresh token');

    let payload: { sub: string; email: string };
    try {
      payload = this.jwtService.verify(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET,
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });

    if (!user?.refreshToken) throw new UnauthorizedException('Access denied');

    if (this.hashToken(refreshToken) !== user.refreshToken) {
      // Possible token reuse — invalidate everything (refresh token rotation)
      await this.prisma.user.update({
        where: { id: user.id },
        data: { refreshToken: null },
      });
      throw new UnauthorizedException('Refresh token reuse detected');
    }

    const tokens = await this.generateTokens(user.id, user.email);
    await this.saveRefreshToken(user.id, tokens.refreshToken);

    this.setAuthCookies(res, tokens);
    return tokens;
  }

  // ─── Logout ───────────────────────────────────────────────────────────────

  async logout(userId: string, res: Response): Promise<void> {
    // Invalidate the stored refresh token so it can never be reused
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: null },
    });

    // Clear both cookies by expiring them immediately
    res.clearCookie('accessToken', COOKIE_BASE);
    res.clearCookie('refreshToken', COOKIE_BASE);
  }

  // ─── Utilities ────────────────────────────────────────────────────────────

  setAuthCookies(res: Response, tokens: AuthTokensDto): void {
    res.cookie('accessToken', tokens.accessToken, {
      ...COOKIE_BASE,
      maxAge: 15 * 60 * 1000, // 15 min
    });
    res.cookie('refreshToken', tokens.refreshToken, {
      ...COOKIE_BASE,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
  }
}