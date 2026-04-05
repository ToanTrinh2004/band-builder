import { Controller, Get, Post, Req, Res, UnauthorizedException, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import * as bcrypt from 'bcrypt';
import { PrismaService } from 'src/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as crypto from 'crypto';
import { Throttle } from '@nestjs/throttler';
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService,
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) { }


  @Throttle({ short: { ttl: 60000, limit: 5 } })
  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth() { }

  @Throttle({ short: { ttl: 60000, limit: 5 } })
  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleCallback(@Req() req, @Res() res) {
    const data = await this.authService.validateGoogleUser(req.user);

    res.cookie('accessToken', data.access_token, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: 15 * 60 * 1000,
    });

    res.cookie('refreshToken', data.refresh_token, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    console.log('Set cookies:', {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
    });

    return res.redirect('https://hydropic-mona-overflatly.ngrok-free.dev');
  }
  @Throttle({ short: { ttl: 60000, limit: 5 } })
  @Post('refresh')
  async refresh(@Req() req, @Res({ passthrough: true }) res: Response) {
    return this.authService.refreshTokens(req.cookies.refreshToken, res);
  }
  @Throttle({ short: { ttl: 60000, limit: 5 } })
  @Get('me')
  async getMe(@Req() req) {
    const token = req.cookies.accessToken;

    if (!token) {
      throw new UnauthorizedException('No access token');
    }

    const payload = this.jwtService.verify(token, {
      secret: process.env.JWT_SECRET,
    });

    return {
      userId: payload.sub,
      email: payload.email,
    };
  }
  @Get('test-cookie')
  test(@Req() req) {
    return {
      cookies: req.cookies,
    };
  }
}