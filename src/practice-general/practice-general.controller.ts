import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { PracticeGeneralService } from './practice-general.service';
import {
  CreatePronunciationTopicDto,
  PronunciationTopicListItemResponseDto,
  PronunciationTopicDetailResponseDto,
} from './dto/practice-general.dto';

@ApiTags('PracticeGeneral')
@Controller('practice-general')
export class PracticeGeneralController {
  constructor(private readonly practiceGeneralService: PracticeGeneralService) {}

  // ── Pronunciation ──────────────────────────────────────────────────────────

  @Get('pronunciation/topics')
  @ApiOperation({ summary: 'Get all pronunciation topics' })
  @ApiResponse({ status: 200, type: [PronunciationTopicListItemResponseDto], description: 'List of pronunciation topics' })
  async getPronunciationTopics(): Promise<PronunciationTopicListItemResponseDto[]> {
    return this.practiceGeneralService.getPronunciationTopics();
  }

  @Get('pronunciation/topics/:id')
  @ApiOperation({ summary: 'Get details of a single pronunciation topic' })
  @ApiParam({ name: 'id', description: 'Pronunciation Topic ID' })
  @ApiResponse({ status: 200, type: PronunciationTopicDetailResponseDto, description: 'Pronunciation topic details with vocabularies and sentences' })
  async getPronunciationTopicDetail(
    @Param('id') id: string,
  ): Promise<PronunciationTopicDetailResponseDto> {
    return this.practiceGeneralService.getPronunciationTopicDetail(id);
  }

  @Post('pronunciation/topics')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new pronunciation topic (admin/seed)' })
  @ApiResponse({ status: 201, type: PronunciationTopicDetailResponseDto, description: 'Created topic details' })
  async createPronunciationTopic(
    @Body() body: CreatePronunciationTopicDto,
  ): Promise<PronunciationTopicDetailResponseDto> {
    return this.practiceGeneralService.createPronunciationTopic(body);
  }
}
