import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, IsUrl } from 'class-validator';

export class GoogleUserDto {
  @ApiProperty({ example: 'user@gmail.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'google-oauth2|1234567890' })
  @IsString()
  googleId!: string;

  @ApiProperty({ example: 'John Doe' })
  @IsString()
  name!: string;

  @ApiProperty({ example: 'https://lh3.googleusercontent.com/...', required: false })
  @IsOptional()
  @IsUrl()
  avatarUrl?: string;
}