import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class CreatePronunciationVocabDto {
  @ApiProperty({ example: 'vocabulary', description: 'Vocabulary word' })
  @IsNotEmpty()
  @IsString()
  word!: string;

  @ApiProperty({ example: '/vəˈkæbjəleri/', description: 'IPA pronunciation' })
  @IsNotEmpty()
  @IsString()
  ipa!: string;

  @ApiProperty({ example: 'từ vựng', description: 'Vietnamese translation/meaning' })
  @IsNotEmpty()
  @IsString()
  meaning!: string;

  @ApiPropertyOptional({ example: 'https://example.com/audio.mp3', description: 'Audio URL for vocabulary' })
  @IsString()
  @IsOptional()
  audioUrl?: string;

  @ApiProperty({ example: 'This is a vocabulary word.', description: 'Example sentence using the word' })
  @IsNotEmpty()
  @IsString()
  example!: string;

  @ApiProperty({ example: 'Đây là một từ vựng.', description: 'Translation of the example sentence' })
  @IsNotEmpty()
  @IsString()
  exampleTranslation!: string;
}

export class CreatePronunciationTopicDto {
  @ApiProperty({ example: 'English Pronunciation 101', description: 'Title of the topic' })
  @IsNotEmpty()
  @IsString()
  title!: string;

  @ApiProperty({ example: 'This is a sample paragraph for practice.', description: 'The reading passage or transcript text' })
  @IsNotEmpty()
  @IsString()
  paragraph!: string;

  @ApiPropertyOptional({ example: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', description: 'YouTube video URL' })
  @IsString()
  @IsOptional()
  videoUrl?: string;

  @ApiPropertyOptional({ example: 'https://example.com/audio.mp3', description: 'Optional backup audio URL' })
  @IsString()
  @IsOptional()
  audioUrl?: string;

  @ApiPropertyOptional({
    type: [CreatePronunciationVocabDto],
    description: 'Array of core vocabulary items associated with the topic',
  })
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CreatePronunciationVocabDto)
  vocabs?: CreatePronunciationVocabDto[];
}

export class PronunciationVocabResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() topicId!: string;
  @ApiProperty() word!: string;
  @ApiProperty() ipa!: string;
  @ApiProperty() meaning!: string;
  @ApiProperty({ type: String, nullable: true }) audioUrl!: string | null;
  @ApiProperty() example!: string;
  @ApiProperty() exampleTranslation!: string;
}

export class PronunciationSentenceResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() topicId!: string;
  @ApiProperty() text!: string;
  @ApiProperty() startTime!: number;
  @ApiProperty() endTime!: number;
  @ApiProperty() orderIndex!: number;
}

export class PronunciationTopicListItemResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() title!: string;
  @ApiProperty() paragraph!: string;
  @ApiProperty({ type: String, nullable: true }) videoUrl!: string | null;
  @ApiProperty() vocabCount!: number;
  @ApiProperty() sentencesCount!: number;
}

export class PronunciationTopicDetailResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() title!: string;
  @ApiProperty() paragraph!: string;
  @ApiProperty({ type: String, nullable: true }) videoUrl!: string | null;
  @ApiProperty({ type: String, nullable: true }) audioUrl!: string | null;
  @ApiProperty() createdAt!: Date;
  @ApiProperty() updatedAt!: Date;
  @ApiProperty({ type: [PronunciationVocabResponseDto] }) vocabs!: PronunciationVocabResponseDto[];
  @ApiProperty({ type: [PronunciationSentenceResponseDto] }) sentences!: PronunciationSentenceResponseDto[];
}
