import { Injectable, UnauthorizedException } from '@nestjs/common';
import { Response } from 'express';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}
// Generate access and refresh tokens
  async generateTokens(userId: string, email: string) {
    const payload = { sub: userId, email };
  
    const accessToken = await this.jwtService.signAsync(payload, {
      secret: process.env.JWT_SECRET,
      expiresIn: '15m',
    });
  
    const refreshToken = await this.jwtService.signAsync(payload, {
      secret: process.env.JWT_REFRESH_SECRET,
      expiresIn: '7d',
    });
  
    return { accessToken, refreshToken };
  }
  //save hashed refresh token in database
  async saveRefreshToken(userId: string, refreshToken: string) {
    const hashed = crypto
      .createHash('sha256')
      .update(refreshToken)
      .digest('hex');
  
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: hashed },
    });
  }
  async validateGoogleUser(googleUser: any) {
    const { email, googleId, name, avatarUrl } = googleUser;
  
    let user = await this.prisma.user.findUnique({
      where: { email },
    });
  
    if (!user) {
      user = await this.prisma.user.create({
        data: {
          email,
          googleId,
          name,
          avatarUrl,
        },
      });
    }
   // Generate tokens and save refresh token
    const tokens = await this.generateTokens(user.id, user.email);
  
    await this.saveRefreshToken(user.id, tokens.refreshToken);
  
    return {
      access_token: tokens.accessToken,
      refresh_token: tokens.refreshToken,
      user,
    };
  }
  async refreshTokens(refreshToken: string, res: Response) {
    if (!refreshToken) {
      throw new UnauthorizedException('No refresh token');
    }
  
    const payload = this.jwtService.verify(refreshToken, {
      secret: process.env.JWT_REFRESH_SECRET,
    });
  
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });
  
    if (!user || !user.refreshToken) {
      throw new UnauthorizedException('Access denied');
    }
  
    const incomingHash = crypto
      .createHash('sha256')
      .update(refreshToken)
      .digest('hex');
  
    if (incomingHash !== user.refreshToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  
    const tokens = await this.generateTokens(user.id, user.email);
    await this.saveRefreshToken(user.id, tokens.refreshToken);
  
    res.cookie('accessToken', tokens.accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000,
    });
    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
  
    return tokens;
  }
}