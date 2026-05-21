import {
  Controller,
  Get,
  Patch,
  Body,
  Req,
  HttpCode,
  HttpStatus,
  UseGuards,
  Logger,
  Param,
  Post,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Request } from 'express';
import { UserService } from './user.service';
import {
  UpdateUserProfileDto,
  UserProfileDto,
  ProfileResponseDto,
  TestResultsResponseDto,
  TestAttemptDetailDto,
} from './dto/user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { SkipThrottle, Throttle } from '@nestjs/throttler';

@ApiTags('User')
@Controller('user')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UserController {
  private readonly logger = new Logger(UserController.name);

  constructor(private readonly userService: UserService) { }

  // ──────────────────────────────────────────────────────────
  // GET /user/profile
  // Returns full profile: user info + stats + recent activity
  // ──────────────────────────────────────────────────────────
  @Get('profile')
  @ApiOperation({ summary: 'Get full user profile with stats and recent activity' })
  @ApiResponse({ status: 200, type: ProfileResponseDto })
  async getProfile(@CurrentUser('userId') userId: string): Promise<ProfileResponseDto> {
    return this.userService.getProfile(userId);
  }

  // ──────────────────────────────────────────────────────────
  // PATCH /user/profile
  // Update fullName and/or avatarUrl
  // ──────────────────────────────────────────────────────────
  @Patch('profile')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update user display name or avatar URL' })
  @ApiResponse({ status: 200, type: UserProfileDto })
  async updateProfile(
    @CurrentUser('userId') userId: string,
    @Body() dto: UpdateUserProfileDto,
  ): Promise<UserProfileDto> {
    return this.userService.updateProfile(userId, dto);
  }
  // ──────────────────────────────────────────────────────────
  // GET /user/tests
  // Returns all test sessions with scores and skill breakdown
  // ──────────────────────────────────────────────────────────
  @Get('tests')
  @ApiOperation({ summary: 'Get all test results for the current user' })
  @ApiResponse({ status: 200, type: TestResultsResponseDto })
  async getTestResults(
    @CurrentUser('userId') userId: string,
  ): Promise<TestResultsResponseDto> {
    return this.userService.getTestResults(userId);
  }


  @SkipThrottle()
  @UseGuards(JwtAuthGuard)
  @Get('attempts/:attemptId')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get attempt detail with answers' })
  getAttemptDetail(
    @Param('attemptId') attemptId: string,
    @Req() req: Request,
  ) {
    return this.userService.getAttemptDetail(req.user!.userId, attemptId);
  }

  @Throttle({ long: { ttl: 60000, limit: 10 } })
  @UseGuards(JwtAuthGuard)
  @Post('attempts/:attemptId/explain')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get AI explanation for wrong answers — costs 1 credit (cached after first call)' })
  getAttemptExplanation(
    @Param('attemptId') attemptId: string,
    @Req() req: Request,
  ) {
    return this.userService.getAttemptExplanation(req.user!.userId, attemptId);
  }
}