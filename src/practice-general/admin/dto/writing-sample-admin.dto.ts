import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';
import { WritingTaskType } from '@prisma/client';

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
}

export class UpdateWritingSampleTopicDto extends PartialType(CreateWritingSampleTopicDto) {}

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

  @ApiProperty({ description: 'The Vietnamese translation of the model essay' })
  @IsString()
  @IsNotEmpty()
  essayTranslation!: string;

  @ApiPropertyOptional({ type: Object, description: 'Detailed AI analysis structure (criteria scores, strengths, improvements, overall comments)' })
  @IsOptional()
  analysis?: any;
}

export class UpdateWritingSampleEssayDto extends PartialType(CreateWritingSampleEssayDto) {}
