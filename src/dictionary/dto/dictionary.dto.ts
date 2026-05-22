import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class GetDictionaryDto {
  @ApiProperty({ description: 'The word to query in the dictionary', example: 'accomplish' })
  @IsNotEmpty()
  @IsString()
  word: string;

  @ApiPropertyOptional({ description: 'An optional sentence context to translate', example: 'We can accomplish anything together.' })
  @IsOptional()
  @IsString()
  sentence?: string;
}

export class DictionaryResponseDto {
  @ApiProperty() word: string;
  @ApiProperty() phonetic: string;
  @ApiProperty() audio: string;
  @ApiProperty() meaning: string;
  @ApiProperty() related: string;
  @ApiProperty() explainVN: string;
  @ApiProperty() example: string;
  @ApiProperty() translation: string;
  @ApiProperty() isSaved: boolean;
  @ApiProperty({ type: String, nullable: true }) dateSaved: string | null;
}
