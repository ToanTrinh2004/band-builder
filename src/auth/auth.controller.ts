import { Controller, Get, Post, Req, Res, UseGuards } from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { Throttle } from '@nestjs/throttler';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { AuthTokensDto } from './dto/auth-tokens.dto';
import { MeResponseDto } from './dto/me-response.dto';

const THROTTLE = { short: { ttl: 60000, limit: 5 } };

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Throttle(THROTTLE)
  @Get('google')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Initiate Google OAuth flow' })
  @ApiResponse({ status: 302, description: 'Redirects to Google login' })
  async googleAuth() {}

  @Throttle(THROTTLE)
  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Google OAuth callback — sets auth cookies' })
  @ApiResponse({ status: 302, description: 'Redirects to frontend after login' })
  async googleCallback(@Req() req, @Res() res: Response) {
    const data = await this.authService.validateGoogleUser(req.user);

    const cookieOptions = { httpOnly: true, secure: true, sameSite: 'none' as const };

    res.cookie('accessToken', data.accessToken, { ...cookieOptions, maxAge: 15 * 60 * 1000 });
    res.cookie('refreshToken', data.refreshToken, { ...cookieOptions, maxAge: 7 * 24 * 60 * 60 * 1000 });

    if (!process.env.FRONTEND_URL) {
      throw new Error('FRONTEND_URL is not defined in the environment variables');
    }
    return res.redirect(process.env.FRONTEND_URL);
  }

  @Throttle(THROTTLE)
  @Post('refresh')
  @ApiCookieAuth('refreshToken')
  @ApiOperation({ summary: 'Refresh access token using refresh token cookie' })
  @ApiResponse({ status: 200, type: AuthTokensDto })
  @ApiResponse({ status: 401, description: 'Invalid or missing refresh token' })
  async refresh(@Req() req, @Res({ passthrough: true }) res: Response): Promise<AuthTokensDto> {
    return this.authService.refreshTokens(req.cookies.refreshToken, res);
  }

  @Throttle(THROTTLE)
  @Get('me')
  @ApiCookieAuth('accessToken')
  @ApiOperation({ summary: 'Get current authenticated user' })
  @ApiResponse({ status: 200, type: MeResponseDto })
  @ApiResponse({ status: 401, description: 'No or invalid access token' })
  async getMe(@Req() req): Promise<MeResponseDto> {
    return this.authService.getMe(req.cookies.accessToken);
  }

  @Get('test-cookie')
  @ApiOperation({ summary: 'Debug endpoint — inspect cookies' })
  test(@Req() req) {
    return { cookies: req.cookies };
  }
}