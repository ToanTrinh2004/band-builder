import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { WritingTaskType } from '@prisma/client';

// ─── Topic DTOs ───────────────────────────────────────────────────────────────

export class CreateWritingSampleTopicDto {
  @ApiProperty({ enum: ['TASK_1', 'TASK_2'], description: 'IELTS Writing Task Type' })
  @IsEnum(WritingTaskType)
  @IsNotEmpty()
  taskType!: WritingTaskType;

  @ApiProperty({ description: 'Category of the writing topic (e.g. Technology, Education)' })
  @IsString()
  @IsNotEmpty()
  category!: string;

  @ApiProperty({ description: 'The prompt question/task instruction for the topic' })
  @IsString()
  @IsNotEmpty()
  prompt!: string;

  @ApiPropertyOptional({ description: 'Optional image URL for diagrams (Task 1)' })
  @IsString()
  @IsOptional()
  imageUrl?: string;

  @ApiPropertyOptional({
    description: 'Chart/diagram description and data interpretation notes (Task 1 only)',
  })
  @IsString()
  @IsOptional()
  chartDescription?: string;
}

export class UpdateWritingSampleTopicDto extends PartialType(CreateWritingSampleTopicDto) {}

// ─── Analysis DTOs ────────────────────────────────────────────────────────────

export class EssayKeyVocabularyItemDto {
  @ApiProperty({ description: 'The vocabulary phrase or collocation' })
  @IsString()
  @IsNotEmpty()
  phrase!: string;

  @ApiProperty({ description: 'Vietnamese meaning of the phrase' })
  @IsString()
  @IsNotEmpty()
  meaning!: string;

  @ApiPropertyOptional({ description: 'Example usage context in the essay' })
  @IsString()
  @IsOptional()
  context?: string;
}

export class EssayAnalysisDto {
  @ApiPropertyOptional({
    description: 'Task Achievement / Task Response score (0-9)',
    minimum: 0,
    maximum: 9,
  })
  @IsNumber()
  @Min(0)
  @Max(9)
  @IsOptional()
  taskAchievement?: number;

  @ApiPropertyOptional({
    description: 'Coherence & Cohesion score (0-9)',
    minimum: 0,
    maximum: 9,
  })
  @IsNumber()
  @Min(0)
  @Max(9)
  @IsOptional()
  coherenceCohesion?: number;

  @ApiPropertyOptional({
    description: 'Lexical Resource score (0-9)',
    minimum: 0,
    maximum: 9,
  })
  @IsNumber()
  @Min(0)
  @Max(9)
  @IsOptional()
  lexicalResource?: number;

  @ApiPropertyOptional({
    description: 'Grammatical Range & Accuracy score (0-9)',
    minimum: 0,
    maximum: 9,
  })
  @IsNumber()
  @Min(0)
  @Max(9)
  @IsOptional()
  grammaticalRange?: number;

  @ApiPropertyOptional({
    description: 'Outline / essay structure guide (e.g. Introduction, Body, Conclusion)',
  })
  @IsString()
  @IsOptional()
  outline?: string;

  @ApiPropertyOptional({
    description: 'Key strengths of the essay',
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  strengths?: string[];

  @ApiPropertyOptional({
    description: 'Areas that need improvement',
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  improvements?: string[];

  @ApiPropertyOptional({
    description: 'Key vocabulary and collocations highlighted in the essay',
    type: [EssayKeyVocabularyItemDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EssayKeyVocabularyItemDto)
  @IsOptional()
  keyVocabulary?: EssayKeyVocabularyItemDto[];

  @ApiPropertyOptional({ description: 'Overall comment and advice for the student' })
  @IsString()
  @IsOptional()
  overallComment?: string;
}

// ─── Essay DTOs ───────────────────────────────────────────────────────────────

export class CreateWritingSampleEssayDto {
  @ApiProperty({ description: 'The IELTS Band Score of the model essay', minimum: 0, maximum: 9 })
  @IsNumber()
  @Min(0)
  @Max(9)
  @IsNotEmpty()
  bandScore!: number;

  @ApiProperty({ description: 'The full text of the model essay' })
  @IsString()
  @IsNotEmpty()
  essayText!: string;

  @ApiPropertyOptional({ description: 'The Vietnamese translation of the model essay' })
  @IsString()
  @IsOptional()
  essayTranslation?: string;

  @ApiPropertyOptional({
    type: EssayAnalysisDto,
    description: 'Structured AI analysis of the essay',
  })
  @ValidateNested()
  @Type(() => EssayAnalysisDto)
  @IsOptional()
  analysis?: EssayAnalysisDto;
}

export class UpdateWritingSampleEssayDto extends PartialType(CreateWritingSampleEssayDto) {}
