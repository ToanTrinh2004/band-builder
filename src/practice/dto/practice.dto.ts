import { IsString, IsArray, IsOptional, ValidateNested, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export interface QuestionEntry {
  id: string;
  answer?: string;
}

export interface ContentJson {
  sections?: Array<{ question_blocks: Array<{ questions?: QuestionEntry[] }> }>;
  passages?: Array<{ question_blocks: Array<{ questions?: QuestionEntry[]; answers?: string[] }> }>;
}

// ─── Submit Answers ──────────────────────────────────────────────────────────

export class AnswerDto {
  @ApiProperty({ example: 'clx1abc123', description: 'Question ID' })
  @IsString()
  questionId!: string;

  @ApiPropertyOptional({ example: 'B', description: 'User submitted answer' })
  @IsString()
  @IsOptional()
  userAnswer?: string;
}

export class PaginationQueryDto {
  @ApiPropertyOptional({ example: 1, description: 'Page number (starts at 1)', minimum: 1, default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({ example: 20, description: 'Items per page', minimum: 1, default: 20 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  limit?: number = 20;
}

export class SubmitSkillDto {
  @ApiProperty({
    type: [AnswerDto],
    description: 'Array of question answers',
    example: [{ questionId: 'clx1abc123', userAnswer: 'B' }],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AnswerDto)
  answers!: AnswerDto[];

  @ApiProperty({ example: 120, description: 'Time spent on the skill in seconds', minimum: 0 })
  @IsInt()
  @Min(0)
  timeSpentSec!: number;
}

export class GetSkillsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    example: 'listening',
    description: 'Filter by skill type',
    enum: ['listening', 'reading', 'writing', 'speaking'],
  })
  @IsOptional()
  @IsString()
  skillType?: string;
}

// ─── Skill type param ────────────────────────────────────────────────────────

export type SkillTypeName = 'listening' | 'reading' | 'writing' | 'speaking';

export const SKILL_TYPE_MAP: Record<SkillTypeName, number> = {
  listening: 1,
  reading:   2,
  writing:   3,
  speaking:  4,
};

export const AUTO_SCORED_SKILLS: SkillTypeName[] = ['listening', 'reading'];