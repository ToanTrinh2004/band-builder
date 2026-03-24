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
  Query
} from '@nestjs/common';
import { Request } from 'express';
import { PracticeService } from './practice.service';
import { SubmitSkillDto, SkillTypeName,ContentJson, PaginationQueryDto} from './dto/practice.dto';
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



@Controller('practice')
export class PracticeController {
  constructor(private readonly practiceService: PracticeService) {}

  // ── Public routes (no auth) ──────────────────────────────────────────────

  @Get('tests')
  getAllPracticeTests(@Query() query: PaginationQueryDto) {
    return this.practiceService.getAllPracticeTests(query.page, query.limit);
  }

  @Get('skills')
  getAllSkills(@Query() query: PaginationQueryDto) {
    return this.practiceService.getAllSkills(query);
  }

  @Get('tests/:practiceTestId/preview')
  getPracticeTestPreview(@Param('practiceTestId') practiceTestId: string) {
    return this.practiceService.getPracticeTestPreview(practiceTestId);
  }

  @Get('skills/:skillContentId/preview')
  getSkillPreview(@Param('skillContentId') skillContentId: string) {
    return this.practiceService.getSkillContent(skillContentId);
  }
  // ── Protected routes (JWT required) ─────────────────────────────────────

  @UseGuards(JwtAuthGuard)
  @Post(':practiceTestId/start')
  @HttpCode(HttpStatus.CREATED)
  startTest(@Param('practiceTestId') practiceTestId: string, @Req() req: Request) {
    return this.practiceService.startTest(practiceTestId, req.user!.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':testId/skills/:skillType/start')
  @HttpCode(HttpStatus.CREATED)
  startSkillAttempt(
    @Param('testId') testId: string,
    @Param('skillType', SkillTypePipe) skillType: SkillTypeName,
    @Req() req: Request,
  ) {
    return this.practiceService.startSkillAttempt(testId, skillType, req.user!.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':testId/skills/:skillType/submit')
  @HttpCode(HttpStatus.OK)
  submitSkill(
    @Param('testId') testId: string,
    @Param('skillType', SkillTypePipe) skillType: SkillTypeName,
    @Body() dto: SubmitSkillDto,
    @Req() req: Request,
  ) {
    return this.practiceService.submitSkill(testId, skillType, dto, req.user!.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':testId')
  getTestContent(@Param('testId') testId: string, @Req() req: Request) {
    return this.practiceService.getTestContent(testId, req.user!.userId);
  }
}
