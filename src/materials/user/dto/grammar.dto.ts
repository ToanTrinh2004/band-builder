import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

// ─── Query DTOs ────────────────────────────────────────────────────────────────

export class GetGrammarSectionsQueryDto {
  @ApiPropertyOptional({ example: 'basics', description: 'Filter sections by category' })
  @IsString()
  @IsOptional()
  category?: string;

  @ApiPropertyOptional({ example: 'morphology', description: 'Filter sections by subCategory' })
  @IsString()
  @IsOptional()
  subCategory?: string;
}

export class GetGrammarMistakesQueryDto {
  @ApiPropertyOptional({ example: 'Subject-Verb Agreement', description: 'Filter mistakes by category name' })
  @IsString()
  @IsOptional()
  category?: string;
}

// ─── Response DTOs ─────────────────────────────────────────────────────────────

export class GrammarSectionResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() category!: string;
  @ApiProperty() subCategory!: string;
  @ApiProperty() title!: string;
  @ApiProperty() ruleSummary!: string;
  @ApiProperty({
    description: 'Grammar instruction content containing ieltsStrategy and either practiceCases or examples list',
  })
  content!: any;
  @ApiProperty() orderIndex!: number;
  @ApiProperty() createdAt!: Date;
  @ApiProperty() updatedAt!: Date;
}

export class GrammarMistakeResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() category!: string;
  @ApiProperty() incorrect!: string;
  @ApiProperty() correct!: string;
  @ApiProperty() note!: string;
  @ApiProperty() orderIndex!: number;
  @ApiProperty() createdAt!: Date;
}
