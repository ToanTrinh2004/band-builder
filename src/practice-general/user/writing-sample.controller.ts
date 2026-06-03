import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { WritingTaskType } from '@prisma/client';
import { WritingSampleService } from './writing-sample.service';
import {
  GetWritingSamplesQueryDto,
  WritingSampleTopicListItemResponseDto,
  WritingSampleTopicDetailResponseDto,
} from './dto/writing-sample.dto';

@ApiTags('WritingSamples')
@Controller('practice-general/writing-samples')
export class WritingSampleController {
  constructor(private readonly writingSampleService: WritingSampleService) { }

  @Get('topics')
  @ApiOperation({ summary: 'Get all writing sample topics' })
  @ApiResponse({ status: 200, type: [WritingSampleTopicListItemResponseDto] })
  async getTopics(
    @Query() query: GetWritingSamplesQueryDto,
  ): Promise<WritingSampleTopicListItemResponseDto[]> {
    const taskType = query.taskType as WritingTaskType | undefined;
    return this.writingSampleService.getTopics(taskType);
  }

  @Get('topics/:id')
  @ApiOperation({ summary: 'Get details of a single writing sample topic' })
  @ApiParam({ name: 'id', description: 'Writing Sample Topic ID' })
  @ApiResponse({ status: 200, type: WritingSampleTopicDetailResponseDto })
  async getTopicDetail(
    @Param('id') id: string,
  ): Promise<WritingSampleTopicDetailResponseDto> {
    return this.writingSampleService.getTopicDetail(id);
  }
}
