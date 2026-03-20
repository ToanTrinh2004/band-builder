import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

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
    const hashed = await bcrypt.hash(refreshToken, 10);
  
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
}