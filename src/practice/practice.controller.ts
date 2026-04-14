import {
  Controller,
  Post,
  Param,
  Body,
  HttpCode,
  HttpStatus,
  ParseEnumPipe,
  UseGuards,
  Req,
  Get,
  Query,
  ParseIntPipe
} from '@nestjs/common';
import { Request } from 'express';
import { Throttle, SkipThrottle } from '@nestjs/throttler';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
} from '@nestjs/swagger';
import { PracticeService } from './practice.service';
import { SubmitSkillDto, SkillTypeName, ContentJson, PaginationQueryDto } from './dto/practice.dto';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';

export interface JwtUser {
  userId: string;
  email: string;
}

declare module 'express' {
  interface Request {
    user?: JwtUser;
  }
}

const SkillTypeValues = ['listening', 'reading', 'writing', 'speaking'] as const;
const SkillTypePipe = new ParseEnumPipe(
  Object.fromEntries(SkillTypeValues.map((v) => [v, v])),
);

@ApiTags('Practice')
@Controller('practice')
export class PracticeController {
  constructor(private readonly practiceService: PracticeService) {}

  @SkipThrottle()
  @Get('tests')
  @ApiOperation({ summary: 'Get all practice tests (paginated)' })
  @ApiResponse({ status: 200, description: 'List of practice tests' })
  getAllPracticeTests(@Query() query: PaginationQueryDto) {
    return this.practiceService.getAllPracticeTests(query.page, query.limit);
  }

  @SkipThrottle()
  @Get('skills')
  @ApiOperation({ summary: 'Get all skills (paginated, filterable)' })
  @ApiResponse({ status: 200, description: 'List of skills' })
  getAllSkills(@Query() query: PaginationQueryDto) {
    return this.practiceService.getAllSkills(query);
  }

  @SkipThrottle()
  @Get('tests/:practiceTestId/preview')
  @ApiOperation({ summary: 'Get practice test preview' })
  @ApiParam({ name: 'practiceTestId', example: 'clx1abc123' })
  @ApiResponse({ status: 200, description: 'Practice test preview data' })
  getPracticeTestPreview(@Param('practiceTestId') practiceTestId: string) {
    return this.practiceService.getPracticeTestPreview(practiceTestId);
  }

  @SkipThrottle()
  @Get('skills/:skillContentId/preview')
  @ApiOperation({ summary: 'Get skill content preview' })
  @ApiParam({ name: 'skillContentId', example: 'clx1abc123' })
  @ApiResponse({ status: 200, description: 'Skill content data' })
  getSkillPreview(@Param('skillContentId') skillContentId: string) {
    return this.practiceService.getSkillContent(skillContentId);
  }

  @SkipThrottle()
  @Get('skills/:skillContentId/speaking/hint/:questionId')
  @ApiOperation({ summary: 'Get speaking hint for a question' })
  @ApiParam({ name: 'skillContentId', example: 'clx1abc123' })
  @ApiParam({ name: 'questionId', example: 'clx1q001' })
  @ApiResponse({ status: 200, description: 'Speaking hint' })
  getSpeakingHint(
    @Param('skillContentId') skillContentId: string,
    @Param('questionId') questionId: string,
  ) {
    return this.practiceService.getSpeakingHint(skillContentId, questionId);
  }

  // ── Protected routes ────────────────────────────────────────────────────────

  @Throttle({ long: { ttl: 60000, limit: 10 } })
  @UseGuards(JwtAuthGuard)
  @Post('tests/:practiceTestId/start')
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Start a practice test (10 req/min)' })
  @ApiParam({ name: 'practiceTestId', example: 'clx1abc123' })
  @ApiResponse({ status: 201, description: 'Test session started' })
  startTest(
    @Param('practiceTestId') practiceTestId: string,
    @Req() req: Request,
  ) {
    return this.practiceService.startTest(practiceTestId, req.user!.userId);
  }

  @Throttle({ long: { ttl: 60000, limit: 20 } })
  @UseGuards(JwtAuthGuard)
  @Post('tests/:testId/skills/:skillType/start')
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Start a skill attempt (20 req/min)' })
  @ApiParam({ name: 'testId', example: 'clx1abc123' })
  @ApiParam({ name: 'skillType', enum: ['listening', 'reading', 'writing', 'speaking'] })
  @ApiResponse({ status: 201, description: 'Skill attempt started' })
  startSkillAttempt(
    @Param('testId') testId: string,
    @Param('skillType', SkillTypePipe) skillType: SkillTypeName,
    @Req() req: Request,
  ) {
    return this.practiceService.startSkillAttempt(testId, skillType, req.user!.userId);
  }

  @Throttle({ long: { ttl: 60000, limit: 5 } })
  @UseGuards(JwtAuthGuard)
  @Post('tests/:testId/skills/:skillType/submit')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Submit skill answers — hits Claude API (5 req/min)' })
  @ApiParam({ name: 'testId', example: 'clx1abc123' })
  @ApiParam({ name: 'skillType', enum: ['listening', 'reading', 'writing', 'speaking'] })
  @ApiResponse({ status: 200, description: 'Skill graded and result returned' })
  submitSkill(
    @Param('testId') testId: string,
    @Param('skillType', SkillTypePipe) skillType: SkillTypeName,
    @Body() dto: SubmitSkillDto,
    @Req() req: Request,
  ) {
    return this.practiceService.submitSkill(testId, skillType, dto, req.user!.userId);
  }

  @Throttle({ long: { ttl: 60000, limit: 30 } })
  @UseGuards(JwtAuthGuard)
  @Get(':testId')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get test content for authenticated user (30 req/min)' })
  @ApiParam({ name: 'testId', example: 'clx1abc123' })
  @ApiResponse({ status: 200, description: 'Test content' })
  getTestContent(@Param('testId') testId: string, @Req() req: Request) {
    return this.practiceService.getTestContent(testId, req.user!.userId);
  }

  @Throttle({ long: { ttl: 60000, limit: 30 } })
  @UseGuards(JwtAuthGuard)
  @Get('skills/:skillContentId/speaking/sample/:questionId')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get speaking sample answer — costs 1 credit (30 req/min)' })
  @ApiParam({ name: 'skillContentId', example: 'clx1abc123' })
  @ApiParam({ name: 'questionId', example: 'clx1q001' })
  @ApiQuery({ name: 'band', example: 7, description: 'Target band score (1–9)' })
  @ApiResponse({ status: 200, description: 'Sample answer returned (credit deducted on first access)' })
  getSpeakingSample(
    @Param('skillContentId') skillContentId: string,
    @Param('questionId') questionId: string,
    @Query('band', new ParseIntPipe()) band: number,
    @Req() req: Request,
  ) {
    return this.practiceService.getSpeakingSample(
      skillContentId,
      questionId,
      band,
      req.user!.userId,
    );
  }
}