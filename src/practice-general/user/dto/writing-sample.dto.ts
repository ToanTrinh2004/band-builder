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

// ─── Response ─────────────────────────────────────────────────────────────────

export class WritingSampleEssayResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() topicId!: string;
  @ApiProperty() bandScore!: number;
  @ApiProperty() essayText!: string;
  @ApiProperty() essayTranslation!: string;
  @ApiProperty({ type: Object, nullable: true }) analysis!: any;
  @ApiProperty() createdAt!: Date;
  @ApiProperty() updatedAt!: Date;
}

export class WritingSampleTopicListItemResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty({ enum: ['TASK_1', 'TASK_2'] }) taskType!: 'TASK_1' | 'TASK_2';
  @ApiProperty() category!: string;
  @ApiProperty() prompt!: string;
  @ApiProperty({ type: String, nullable: true }) imageUrl!: string | null;
  @ApiProperty() essayCount!: number;
  @ApiProperty() createdAt!: Date;
  @ApiProperty() updatedAt!: Date;
}

export class WritingSampleTopicDetailResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty({ enum: ['TASK_1', 'TASK_2'] }) taskType!: 'TASK_1' | 'TASK_2';
  @ApiProperty() category!: string;
  @ApiProperty() prompt!: string;
  @ApiProperty({ type: String, nullable: true }) imageUrl!: string | null;
  @ApiProperty() createdAt!: Date;
  @ApiProperty() updatedAt!: Date;
  @ApiProperty({ type: [WritingSampleEssayResponseDto] }) essays!: WritingSampleEssayResponseDto[];
}
