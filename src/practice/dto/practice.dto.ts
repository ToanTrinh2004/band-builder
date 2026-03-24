import { IsString, IsArray, IsOptional, ValidateNested, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

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
  @IsString()
  questionId!: string;

  @IsString()
  @IsOptional()
  userAnswer?: string;
}
export class PaginationQueryDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  limit?: number = 20;
}

export class SubmitSkillDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AnswerDto)
  answers!: AnswerDto[];

  @IsInt()
  @Min(0)
  timeSpentSec!: number;
}
// pagination for GET /practice/skills
export class GetSkillsQueryDto extends PaginationQueryDto {
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