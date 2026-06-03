import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsArray,
  IsEnum,
  IsInt,
  Min,
  Max,
} from 'class-validator';
import { VocabType } from '@prisma/client';

// ─── VocabTopic ────────────────────────────────────────────────────────────────

export class CreateVocabTopicDto {
  @ApiProperty({ description: 'Topic name (unique). Band topics: LR_5, LR_6, SW_7...' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ enum: VocabType, default: VocabType.TOPIC })
  @IsEnum(VocabType)
  type!: VocabType;

  @ApiPropertyOptional({ description: 'Band level 5-8 (only for BAND_LR / BAND_SW)' })
  @IsInt()
  @Min(5)
  @Max(8)
  @IsOptional()
  bandLevel?: number;
}

export class UpdateVocabTopicDto extends PartialType(CreateVocabTopicDto) {}

// ─── VocabWord ─────────────────────────────────────────────────────────────────

export class CreateVocabWordDto {
  @ApiProperty({ example: 'Curriculum' })
  @IsString()
  @IsNotEmpty()
  word!: string;

  @ApiProperty({ example: 'Chương trình học' })
  @IsString()
  @IsNotEmpty()
  meaning!: string;

  @ApiPropertyOptional({ example: '/kəˈrɪkjələm/' })
  @IsString()
  @IsOptional()
  pronunciation?: string;

  @ApiPropertyOptional({ example: 'The school is revising its curriculum.' })
  @IsString()
  @IsOptional()
  example?: string;

  @ApiPropertyOptional({ type: [String], example: ['Syllabus', 'Program'] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  synonyms?: string[];
}

export class UpdateVocabWordDto extends PartialType(CreateVocabWordDto) {}
