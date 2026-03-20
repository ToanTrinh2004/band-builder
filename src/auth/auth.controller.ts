import { Controller, Get, Post, Req, Res, UnauthorizedException, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import * as bcrypt from 'bcrypt';
import { PrismaService } from 'src/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService,
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) { }


  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth() { }


  @Get('google/callback')
@UseGuards(AuthGuard('google'))
async googleCallback(@Req() req, @Res() res) {  
  const data = await this.authService.validateGoogleUser(req.user);

  res.cookie('accessToken', data.access_token, {
    httpOnly: true,
    secure: false,
    sameSite: 'lax',
    domain: 'aidsense',            
    maxAge: 15 * 60 * 1000,
  });

  res.cookie('refreshToken', data.refresh_token, {
    httpOnly: true,
    secure: false,
    sameSite: 'lax',
    domain: 'aidsense',             
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  return res.redirect('https://aidsense.online/auth/test-cookie'); 
}
  @Post('refresh')
async refresh(@Req() req) {
  const refreshToken = req.cookies.refreshToken;

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

  const isMatch = await bcrypt.compare(
    refreshToken,
    user.refreshToken,
  );

  if (!isMatch) {
    throw new UnauthorizedException('Invalid refresh token');
  }

  const tokens = await this.authService.generateTokens(
    user.id,
    user.email,
  );

  await this.authService.saveRefreshToken(
    user.id,
    tokens.refreshToken,
  );

  return tokens;
}
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