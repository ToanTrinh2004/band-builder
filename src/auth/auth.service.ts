import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async validateGoogleUser(googleUser: any) {
    const { email, googleId, name, avatarUrl } = googleUser;

    //check if user exists
    let user = await this.prisma.user.findUnique({
      where: { email },
    });
   //if not, create user
   
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

 // generate JWT token
    const payload = {
      sub: user.id,
      email: user.email,
    };

    const token = this.jwtService.sign(payload);

    return {
      access_token: token,
      user,
    };
  }
}