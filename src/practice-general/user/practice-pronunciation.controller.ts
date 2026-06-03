import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { PracticePronunciationService } from './practice-pronunciation.service';
import {
  PronunciationTopicListItemResponseDto,
  PronunciationTopicDetailResponseDto,
} from './dto/practice-pronunciation.dto';

@ApiTags('PracticePronunciation')
@Controller('practice-general')
export class PracticePronunciationController {
  constructor(private readonly practicePronunciationService: PracticePronunciationService) {}

  // ── Pronunciation ──────────────────────────────────────────────────────────

  @Get('pronunciation/topics')
  @ApiOperation({ summary: 'Get all pronunciation topics' })
  @ApiResponse({ status: 200, type: [PronunciationTopicListItemResponseDto], description: 'List of pronunciation topics' })
  async getPronunciationTopics(): Promise<PronunciationTopicListItemResponseDto[]> {
    return this.practicePronunciationService.getPronunciationTopics();
  }

  @Get('pronunciation/topics/:id')
  @ApiOperation({ summary: 'Get details of a single pronunciation topic' })
  @ApiParam({ name: 'id', description: 'Pronunciation Topic ID' })
  @ApiResponse({ status: 200, type: PronunciationTopicDetailResponseDto, description: 'Pronunciation topic details with vocabularies and sentences' })
  async getPronunciationTopicDetail(
    @Param('id') id: string,
  ): Promise<PronunciationTopicDetailResponseDto> {
    return this.practicePronunciationService.getPronunciationTopicDetail(id);
  }
}
