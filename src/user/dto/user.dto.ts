import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUrl, MaxLength } from 'class-validator';

// ──────────────────────────────────────────────────────────
// REQUEST DTOs
// ──────────────────────────────────────────────────────────

export class UpdateUserProfileDto {
  @ApiPropertyOptional({ example: 'Nguyen Van A' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  fullName?: string;

  @ApiPropertyOptional({ example: 'https://cdn.example.com/avatar.jpg' })
  @IsOptional()
  @IsString()
  avatarUrl?: string;
}

// ──────────────────────────────────────────────────────────
// RESPONSE DTOs  (match frontend interfaces 1-to-1)
// ──────────────────────────────────────────────────────────

export class UserProfileDto {
  @ApiProperty() userId: string;
  @ApiProperty() email: string;
  @ApiPropertyOptional() fullName?: string;
  @ApiPropertyOptional() avatarUrl?: string;
  @ApiProperty() isPro: boolean;
  @ApiProperty() totalCredits: number;
  @ApiProperty() usedCredits: number;
  @ApiProperty() createdAt: string;
}

export class UserStatsDto {
  @ApiProperty() testsCompleted: number;
  @ApiProperty() avgBandScore: number;
  @ApiProperty() studyStreak: number;
  @ApiProperty() totalStudyTime: number; // minutes
}

export class UserActivityDto {
  @ApiProperty() id: string;
  @ApiProperty() title: string;
  @ApiProperty({ enum: ['Reading', 'Listening', 'Writing', 'Speaking'] })
  skill: 'Reading' | 'Listening' | 'Writing' | 'Speaking';
  @ApiProperty() score: number | string;
  @ApiProperty() date: string;
  @ApiProperty({ enum: ['COMPLETED', 'IN_PROGRESS', 'FAILED'] })
  status: 'COMPLETED' | 'IN_PROGRESS' | 'FAILED';
}

export class ProfileResponseDto {
  @ApiProperty({ type: UserProfileDto }) user: UserProfileDto;
  @ApiProperty({ type: UserStatsDto }) stats: UserStatsDto;
  @ApiProperty({ type: [UserActivityDto] }) recentActivities: UserActivityDto[];
}