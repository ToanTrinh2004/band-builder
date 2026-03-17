import { Controller, Get, Req, Res, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) { }


    @Get('google')
    @UseGuards(AuthGuard('google'))
    async googleAuth() { }


    @Get('google/callback')
    @UseGuards(AuthGuard('google'))
    async googleCallback(@Req() req, @Res() res) {
        const data = await this.authService.validateGoogleUser(req.user);

        return res.redirect(
            `http://localhost:5173/oauth-success?token=${data.access_token}`
        );
    }
}