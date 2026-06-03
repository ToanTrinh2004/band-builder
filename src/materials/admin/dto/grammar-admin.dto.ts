import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsInt,
  IsObject,
  Min,
} from 'class-validator';

// ─── GrammarSection ────────────────────────────────────────────────────────────

export class CreateGrammarSectionDto {
  @ApiProperty({ example: 'basics', description: 'basics | tenses | sentence' })
  @IsString()
  @IsNotEmpty()
  category!: string;

  @ApiProperty({ example: 'morphology', description: 'Sub-category ID matching FE sidebar' })
  @IsString()
  @IsNotEmpty()
  subCategory!: string;

  @ApiProperty({ example: 'Noun Suffixes for People' })
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiProperty({ example: 'Sử dụng hậu tố -er, -ist, -ant để chỉ người/nghề nghiệp.' })
  @IsString()
  @IsNotEmpty()
  ruleSummary!: string;

  @ApiProperty({
    description: 'Flexible JSON: { ieltsStrategy, practiceCases: [{type, input, transformed, note}] } or { ieltsStrategy, examples: [...] }',
    example: {
      ieltsStrategy: 'Dùng để mô tả đối tượng trong Speaking Part 2.',
      practiceCases: [{ type: 'Suffix', input: 'Science', transformed: 'Scientist', note: 'Nhà khoa học' }],
    },
  })
  @IsObject()
  content!: Record<string, unknown>;

  @ApiPropertyOptional({ default: 0 })
  @IsInt()
  @Min(0)
  @IsOptional()
  orderIndex?: number;
}

export class UpdateGrammarSectionDto extends PartialType(CreateGrammarSectionDto) {}

// ─── GrammarMistake ────────────────────────────────────────────────────────────

export class CreateGrammarMistakeDto {
  @ApiProperty({ example: 'Subject-Verb Agreement: Uncountable Nouns' })
  @IsString()
  @IsNotEmpty()
  category!: string;

  @ApiProperty({ example: 'The information provided are very useful.' })
  @IsString()
  @IsNotEmpty()
  incorrect!: string;

  @ApiProperty({ example: 'The information provided is very useful.' })
  @IsString()
  @IsNotEmpty()
  correct!: string;

  @ApiProperty({ example: 'Information is strictly uncountable.' })
  @IsString()
  @IsNotEmpty()
  note!: string;

  @ApiPropertyOptional({ default: 0 })
  @IsInt()
  @Min(0)
  @IsOptional()
  orderIndex?: number;
}

export class UpdateGrammarMistakeDto extends PartialType(CreateGrammarMistakeDto) {}
