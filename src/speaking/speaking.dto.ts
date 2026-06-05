import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsArray, IsNumber, IsNotEmpty, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class DialogueTurnDto {
  @ApiProperty({ example: 'ai', enum: ['ai', 'user'] })
  @IsString()
  @IsNotEmpty()
  sender: 'ai' | 'user';

  @ApiProperty({ example: 'Hello! Welcome to the AI speaking practice room. My name is Sophia.' })
  @IsString()
  @IsNotEmpty()
  text: string;
}

export class CorrectionItemDto {
  @ApiProperty({ example: 'grammar', enum: ['grammar', 'vocab', 'positive'] })
  @IsString()
  @IsNotEmpty()
  type: 'grammar' | 'vocab' | 'positive';

  @ApiProperty({ example: 'I has a dog', required: false })
  @IsString()
  @IsOptional()
  original?: string;

  @ApiProperty({ example: 'I have a dog', required: false })
  @IsString()
  @IsOptional()
  correction?: string;

  @ApiProperty({ example: 'Lỗi chia động từ (has -> have) đi với chủ ngữ I.' })
  @IsString()
  @IsNotEmpty()
  explanation: string;
}

export class SaveSpeakingSessionDto {
  @ApiProperty({ example: 'sophia' })
  @IsString()
  @IsNotEmpty()
  voiceId: string;

  @ApiProperty({ type: [DialogueTurnDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DialogueTurnDto)
  dialogue: DialogueTurnDto[];

  @ApiProperty({ example: 7.0 })
  @IsNumber()
  overallBand: number;

  @ApiProperty({ example: 7.0 })
  @IsNumber()
  fluency: number;

  @ApiProperty({ example: 6.5 })
  @IsNumber()
  lexical: number;

  @ApiProperty({ example: 7.0 })
  @IsNumber()
  grammar: number;

  @ApiProperty({ example: 7.5 })
  @IsNumber()
  pronunciation: number;

  @ApiProperty({ type: [CorrectionItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CorrectionItemDto)
  corrections: CorrectionItemDto[];
}
