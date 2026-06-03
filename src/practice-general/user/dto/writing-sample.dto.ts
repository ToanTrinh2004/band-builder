import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';

// ─── Query ────────────────────────────────────────────────────────────────────

export enum WritingTaskTypeQuery {
  TASK_1 = 'TASK_1',
  TASK_2 = 'TASK_2',
}

export class GetWritingSamplesQueryDto {
  @ApiPropertyOptional({ enum: WritingTaskTypeQuery })
  @IsEnum(WritingTaskTypeQuery)
  @IsOptional()
  taskType?: WritingTaskTypeQuery;
}

export class EssayKeyVocabularyItemResponseDto {
  @ApiProperty() phrase!: string;
  @ApiProperty() meaning!: string;
  @ApiPropertyOptional() context?: string;
}

export class EssayAnalysisResponseDto {
  @ApiPropertyOptional() taskAchievement?: number;
  @ApiPropertyOptional() coherenceCohesion?: number;
  @ApiPropertyOptional() lexicalResource?: number;
  @ApiPropertyOptional() grammaticalRange?: number;
  @ApiPropertyOptional() outline?: string;
  @ApiPropertyOptional({ type: [String] }) strengths?: string[];
  @ApiPropertyOptional({ type: [String] }) improvements?: string[];
  @ApiPropertyOptional({ type: [EssayKeyVocabularyItemResponseDto] })
  keyVocabulary?: EssayKeyVocabularyItemResponseDto[];
  @ApiPropertyOptional() overallComment?: string;
}

// ─── Essay Response ───────────────────────────────────────────────────────────

export class WritingSampleEssayResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() topicId!: string;
  @ApiProperty() bandScore!: number;
  @ApiProperty() essayText!: string;
  @ApiPropertyOptional() essayTranslation?: string;
  @ApiPropertyOptional({ nullable: true })
  analysis?: any;
  @ApiProperty() createdAt!: Date;
  @ApiProperty() updatedAt!: Date;
}

// ─── Topic List Response ──────────────────────────────────────────────────────

export class WritingSampleTopicListItemResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty({ enum: ['TASK_1', 'TASK_2'] }) taskType!: 'TASK_1' | 'TASK_2';
  @ApiProperty() category!: string;
  @ApiProperty() prompt!: string;
  @ApiPropertyOptional({ nullable: true }) imageUrl?: string | null;
  @ApiPropertyOptional({ nullable: true }) chartDescription?: string | null;
  @ApiProperty() essayCount!: number;
  @ApiProperty() createdAt!: Date;
  @ApiProperty() updatedAt!: Date;
}

// ─── Topic Detail Response ────────────────────────────────────────────────────

export class WritingSampleTopicDetailResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty({ enum: ['TASK_1', 'TASK_2'] }) taskType!: 'TASK_1' | 'TASK_2';
  @ApiProperty() category!: string;
  @ApiProperty() prompt!: string;
  @ApiPropertyOptional({ nullable: true }) imageUrl?: string | null;
  @ApiPropertyOptional({ nullable: true }) chartDescription?: string | null;
  @ApiProperty() createdAt!: Date;
  @ApiProperty() updatedAt!: Date;
  @ApiProperty({ type: [WritingSampleEssayResponseDto] }) essays!: WritingSampleEssayResponseDto[];
}
