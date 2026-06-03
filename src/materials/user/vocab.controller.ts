import { Controller, Get, Param, Query, UsePipes, ValidationPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { VocabService } from './vocab.service';
import {
  GetVocabTopicsQueryDto,
  VocabTopicListItemResponseDto,
  VocabTopicDetailResponseDto,
} from './dto/vocab.dto';

@ApiTags('MaterialsVocab')
@Controller('materials/vocab')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class VocabController {
  constructor(private readonly vocabService: VocabService) {}

  @Get('topics')
  @ApiOperation({ summary: 'Get all vocab topics, optionally filtered by type' })
  @ApiResponse({ status: 200, type: [VocabTopicListItemResponseDto] })
  async getTopics(
    @Query() query: GetVocabTopicsQueryDto,
  ): Promise<VocabTopicListItemResponseDto[]> {
    return this.vocabService.getTopics(query.type);
  }

  @Get('topics/:id')
  @ApiOperation({ summary: 'Get vocab topic detail with full word list' })
  @ApiParam({ name: 'id', description: 'Vocab Topic ID' })
  @ApiResponse({ status: 200, type: VocabTopicDetailResponseDto })
  async getTopicDetail(
    @Param('id') id: string,
  ): Promise<VocabTopicDetailResponseDto> {
    return this.vocabService.getTopicDetail(id);
  }
}
