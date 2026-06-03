import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { VocabType } from '@prisma/client';

// ─── Query DTO ─────────────────────────────────────────────────────────────────

export class GetVocabTopicsQueryDto {
  @ApiPropertyOptional({ enum: VocabType, description: 'Filter vocab topics by type' })
  @IsEnum(VocabType)
  @IsOptional()
  type?: VocabType;
}

// ─── Response DTOs ─────────────────────────────────────────────────────────────

export class VocabWordResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() topicId!: string;
  @ApiProperty() word!: string;
  @ApiProperty() meaning!: string;
  @ApiPropertyOptional({ type: String, nullable: true }) pronunciation!: string | null;
  @ApiPropertyOptional({ type: String, nullable: true }) example!: string | null;
  @ApiProperty({ type: [String] }) synonyms!: string[];
}

export class VocabTopicListItemResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() name!: string;
  @ApiProperty({ enum: VocabType }) type!: VocabType;
  @ApiPropertyOptional({ type: Number, nullable: true }) bandLevel!: number | null;
  @ApiProperty() wordCount!: number;
  @ApiProperty() createdAt!: Date;
  @ApiProperty() updatedAt!: Date;
}

export class VocabTopicDetailResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() name!: string;
  @ApiProperty({ enum: VocabType }) type!: VocabType;
  @ApiPropertyOptional({ type: Number, nullable: true }) bandLevel!: number | null;
  @ApiProperty() createdAt!: Date;
  @ApiProperty() updatedAt!: Date;
  @ApiProperty({ type: [VocabWordResponseDto] }) words!: VocabWordResponseDto[];
}
