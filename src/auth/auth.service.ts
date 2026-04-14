import { Injectable, UnauthorizedException } from '@nestjs/common';
import { Response } from 'express';
import { JwtService } from '@nestjs/jwt';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { GoogleUserDto } from './dto/google-user.dto';
import { AuthTokensDto } from './dto/auth-tokens.dto';
import { MeResponseDto } from './dto/me-response.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

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

  async saveRefreshToken(userId: string, refreshToken: string): Promise<void> {
    const hashed = crypto.createHash('sha256').update(refreshToken).digest('hex');

    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: hashed },
    });
  }

  async validateGoogleUser(googleUser: GoogleUserDto) {
    const { email, googleId, name, avatarUrl } = googleUser;

    const user = await this.prisma.user.findUnique({ where: { email } })
      ?? await this.prisma.user.create({ data: { email, googleId, name, avatarUrl } });

    const tokens = await this.generateTokens(user.id, user.email);
    await this.saveRefreshToken(user.id, tokens.refreshToken);

    return { ...tokens, user };
  }

  async getMe(token: string): Promise<MeResponseDto> {
    if (!token) {
      throw new UnauthorizedException('No access token');
    }

    const payload = this.jwtService.verify(token, {
      secret: process.env.JWT_SECRET,
    });

    return { userId: payload.sub, email: payload.email };
  }

  async refreshTokens(refreshToken: string, res: Response): Promise<AuthTokensDto> {
    if (!refreshToken) {
      throw new UnauthorizedException('No refresh token');
    }

    const payload = this.jwtService.verify(refreshToken, {
      secret: process.env.JWT_REFRESH_SECRET,
    });

    const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });

    if (!user?.refreshToken) {
      throw new UnauthorizedException('Access denied');
    }

    const incomingHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    if (incomingHash !== user.refreshToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const tokens = await this.generateTokens(user.id, user.email);
    await this.saveRefreshToken(user.id, tokens.refreshToken);

    const cookieOptions = {
      httpOnly: true,
      secure: true,
      sameSite: 'strict' as const,
    };

    res.cookie('accessToken', tokens.accessToken, { ...cookieOptions, maxAge: 15 * 60 * 1000 });
    res.cookie('refreshToken', tokens.refreshToken, { ...cookieOptions, maxAge: 7 * 24 * 60 * 60 * 1000 });

    return tokens;
  }
}