
import { Controller, Get, Post, Req, Res, UseGuards } from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { Throttle } from '@nestjs/throttler';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { AuthTokensDto } from './dto/auth-tokens.dto';
import { MeResponseDto } from './dto/me-response.dto';
import { JwtAuthGuard } from './guards/jwt.guard'; // your existing guard
import { GoogleAuthGuard } from './guards/google.guard';
import { CurrentUser } from './decorators/current-user.decorator'; // @Req().user shorthand

const THROTTLE = { short: { ttl: 60000, limit: 5 } };

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  // ─── Google OAuth ─────────────────────────────────────────────────────────

  @Throttle(THROTTLE)
  @Get('google')
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({ summary: 'Initiate Google OAuth flow' })
  @ApiResponse({ status: 302, description: 'Redirects to Google login' })
  async googleAuth() { }

  @Throttle(THROTTLE)
  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({ summary: 'Google OAuth callback — sets auth cookies' })
  @ApiResponse({ status: 302, description: 'Redirects to frontend after login' })
  async googleCallback(@Req() req: Request, @Res() res: Response) {
    const data = await this.authService.validateGoogleUser(req.user as any);

    this.authService.setAuthCookies(res, data);

    // Check if there is a mobileRedirect in the state query parameter
    const stateStr = req.query.state as string;
    let mobileRedirect: string | undefined;
    if (stateStr) {
      try {
        const state = JSON.parse(stateStr);
        mobileRedirect = state.mobileRedirect;
      } catch (e) {
        console.error('Error parsing OAuth state:', e);
      }
    }

    if (mobileRedirect) {
      try {
        const redirectUrl = new URL(mobileRedirect);
        redirectUrl.searchParams.set('token', data.accessToken);
        redirectUrl.searchParams.set('refreshToken', data.refreshToken);
        return res.redirect(redirectUrl.toString());
      } catch (e) {
        const separator = mobileRedirect.includes('?') ? '&' : '?';
        return res.redirect(
          `${mobileRedirect}${separator}token=${encodeURIComponent(
            data.accessToken,
          )}&refreshToken=${encodeURIComponent(data.refreshToken)}`,
        );
      }
    }

    if (!process.env.FRONTEND_URL) {
      throw new Error('FRONTEND_URL is not defined');
    }
    return res.redirect(process.env.FRONTEND_URL);
  }

  // ─── Token refresh ────────────────────────────────────────────────────────

  @Throttle(THROTTLE)
  @Post('refresh')
  @ApiCookieAuth('refreshToken')
  @ApiOperation({ summary: 'Rotate tokens using httpOnly refresh-token cookie' })
  @ApiResponse({ status: 200, type: AuthTokensDto })
  @ApiResponse({ status: 401, description: 'Invalid or missing refresh token' })
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthTokensDto> {
    const token = req.cookies?.refreshToken || req.body?.refreshToken || req.headers.authorization?.replace('Bearer ', '');
    return this.authService.refreshTokens(token, res);
  }

  // ─── Me ───────────────────────────────────────────────────────────────────

  @Throttle(THROTTLE)
  @Get('me')
  @UseGuards(JwtAuthGuard) // ← guard handles verification; no manual jwtService.verify
  @ApiCookieAuth('accessToken')
  @ApiOperation({ summary: 'Get current authenticated user from JWT' })
  @ApiResponse({ status: 200, type: MeResponseDto })
  @ApiResponse({ status: 401, description: 'No or invalid access token' })
  async getMe(@CurrentUser() user: { userId: string; email: string }): Promise<MeResponseDto> {
    return user; // guard already validated & attached the payload
  }

  // ─── Logout ───────────────────────────────────────────────────────────────

  @Throttle(THROTTLE)
  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiCookieAuth('accessToken')
  @ApiOperation({ summary: 'Logout — revokes refresh token and clears cookies' })
  @ApiResponse({ status: 200, description: 'Logged out successfully' })
  async logout(
    @CurrentUser() user: { userId: string },
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ message: string }> {
    await this.authService.logout(user.userId, res);
    return { message: 'Logged out successfully' };
  }
}