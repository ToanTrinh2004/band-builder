import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsArray, IsNumber, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

// ── 1. Vocabulary DTOs ──────────────────────────────────────────────────────

export class CreatePronunciationVocabAdminDto {
  @ApiProperty({ example: 'vocabulary', description: 'Từ vựng cần luyện phát âm' })
  @IsNotEmpty()
  @IsString()
  word!: string;

  @ApiProperty({ example: '/vəˈkæbjəleri/', description: 'Phiên âm IPA' })
  @IsNotEmpty()
  @IsString()
  ipa!: string;

  @ApiProperty({ example: 'từ vựng', description: 'Nghĩa tiếng Việt của từ' })
  @IsNotEmpty()
  @IsString()
  meaning!: string;

  @ApiPropertyOptional({ example: 'https://example.com/audio.mp3', description: 'Đường dẫn file âm thanh phát âm mẫu' })
  @IsString()
  @IsOptional()
  audioUrl?: string;

  @ApiProperty({ example: 'This is a vocabulary word.', description: 'Câu ví dụ sử dụng từ vựng này' })
  @IsNotEmpty()
  @IsString()
  example!: string;

  @ApiProperty({ example: 'Đây là một từ vựng.', description: 'Bản dịch tiếng Việt của câu ví dụ' })
  @IsNotEmpty()
  @IsString()
  exampleTranslation!: string;
}

export class UpdatePronunciationVocabAdminDto extends PartialType(CreatePronunciationVocabAdminDto) {}

// ── 2. Sentence DTOs ────────────────────────────────────────────────────────

export class CreatePronunciationSentenceAdminDto {
  @ApiProperty({ example: 'This is a sample sentence.', description: 'Nội dung câu luyện phát âm' })
  @IsNotEmpty()
  @IsString()
  text!: string;

  @ApiProperty({ example: 1.25, description: 'Mốc thời gian bắt đầu (giây) trong video/audio' })
  @IsNotEmpty()
  @IsNumber()
  startTime!: number;

  @ApiProperty({ example: 4.5, description: 'Mốc thời gian kết thúc (giây) trong video/audio' })
  @IsNotEmpty()
  @IsNumber()
  endTime!: number;

  @ApiProperty({ example: 0, description: 'Thứ tự xuất hiện của câu trong đoạn văn' })
  @IsNotEmpty()
  @IsNumber()
  orderIndex!: number;
}

export class UpdatePronunciationSentenceAdminDto extends PartialType(CreatePronunciationSentenceAdminDto) {}

// ── 3. Topic DTOs ───────────────────────────────────────────────────────────

export class CreatePronunciationTopicAdminDto {
  @ApiProperty({ example: 'English Pronunciation 101', description: 'Tiêu đề chủ đề phát âm' })
  @IsNotEmpty()
  @IsString()
  title!: string;

  @ApiProperty({ example: 'This is a sample paragraph for practice.', description: 'Đoạn văn luyện đọc/phát âm' })
  @IsNotEmpty()
  @IsString()
  paragraph!: string;

  @ApiPropertyOptional({ example: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', description: 'Đường dẫn video YouTube để cào transcript' })
  @IsString()
  @IsOptional()
  videoUrl?: string;

  @ApiPropertyOptional({ example: 'https://example.com/audio.mp3', description: 'Đường dẫn audio backup' })
  @IsString()
  @IsOptional()
  audioUrl?: string;

  @ApiPropertyOptional({
    type: [CreatePronunciationVocabAdminDto],
    description: 'Danh sách các từ vựng cốt lõi đi kèm chủ đề',
  })
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CreatePronunciationVocabAdminDto)
  vocabs?: CreatePronunciationVocabAdminDto[];

  @ApiPropertyOptional({
    type: [CreatePronunciationSentenceAdminDto],
    description: 'Danh sách câu tương tác karaoke thủ công',
  })
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CreatePronunciationSentenceAdminDto)
  sentences?: CreatePronunciationSentenceAdminDto[];
}

export class UpdatePronunciationTopicAdminDto extends PartialType(CreatePronunciationTopicAdminDto) {}
