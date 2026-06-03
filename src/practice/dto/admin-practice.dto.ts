import { IsString, IsNotEmpty, IsOptional, IsInt, IsUrl, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePracticeTestDto {
  @ApiProperty({ example: 'IELTS Cambridge 18 Test 1', description: 'The title of the practice test' })
  @IsString()
  @IsNotEmpty()
  title!: string;
}

export class UpdatePracticeTestDto {
  @ApiPropertyOptional({ example: 'IELTS Cambridge 18 Test 1 Updated', description: 'The title of the practice test' })
  @IsString()
  @IsOptional()
  title?: string;
}

export class CreateSkillTestDto {
  @ApiProperty({ example: 1, description: 'Skill type ID (1: Listening, 2: Reading, 3: Writing, 4: Speaking)' })
  @IsInt()
  @IsNotEmpty()
  skillTypeId!: number;

  @ApiProperty({ example: {}, description: 'Detailed questions and sections JSON structure' })
  @IsNotEmpty()
  contentJson!: any;

  @ApiPropertyOptional({ example: 'https://example.com/audio.mp3', description: 'Audio URL for listening skill' })
  @IsString()
  @IsOptional()
  audioUrl?: string;

  @ApiProperty({ example: 'Cambridge 18', description: 'Source book/resource' })
  @IsString()
  @IsNotEmpty()
  source!: string;
}

export class UpdateSkillTestDto {
  @ApiPropertyOptional({ example: {}, description: 'Detailed questions and sections JSON structure' })
  @IsOptional()
  contentJson?: any;

  @ApiPropertyOptional({ example: 'https://example.com/audio_updated.mp3', description: 'Audio URL for listening skill' })
  @IsString()
  @IsOptional()
  audioUrl?: string;

  @ApiPropertyOptional({ example: 'Cambridge 18 Updated', description: 'Source book/resource' })
  @IsString()
  @IsOptional()
  source?: string;
}
