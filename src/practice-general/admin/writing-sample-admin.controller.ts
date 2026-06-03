import { Controller, Post, Patch, Delete, Body, Param, UsePipes, ValidationPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { WritingSampleAdminService } from './writing-sample-admin.service';
import {
  CreateWritingSampleTopicDto,
  UpdateWritingSampleTopicDto,
  CreateWritingSampleEssayDto,
  UpdateWritingSampleEssayDto,
} from './dto/writing-sample-admin.dto';

@ApiTags('WritingSamplesAdmin')
@Controller('admin/writing-samples')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class WritingSampleAdminController {
  constructor(private readonly writingSampleAdminService: WritingSampleAdminService) {}

  // ── Topics CRUD ────────────────────────────────────────────────────────────

  @Post('topics')
  @ApiOperation({ summary: 'Create a new writing sample topic' })
  @ApiResponse({ status: 201, description: 'Topic created successfully' })
  async createTopic(@Body() dto: CreateWritingSampleTopicDto) {
    return this.writingSampleAdminService.createTopic(dto);
  }

  @Patch('topics/:id')
  @ApiOperation({ summary: 'Update an existing writing sample topic' })
  @ApiParam({ name: 'id', description: 'Writing Sample Topic ID' })
  @ApiResponse({ status: 200, description: 'Topic updated successfully' })
  async updateTopic(@Param('id') id: string, @Body() dto: UpdateWritingSampleTopicDto) {
    return this.writingSampleAdminService.updateTopic(id, dto);
  }

  @Delete('topics/:id')
  @ApiOperation({ summary: 'Delete a writing sample topic and all its essays' })
  @ApiParam({ name: 'id', description: 'Writing Sample Topic ID' })
  @ApiResponse({ status: 200, description: 'Topic and associated essays deleted successfully' })
  async deleteTopic(@Param('id') id: string) {
    return this.writingSampleAdminService.deleteTopic(id);
  }

  // ── Essays CRUD ───────────────────────────────────────────────────────────

  @Post('topics/:topicId/essays')
  @ApiOperation({ summary: 'Add a new model essay to a writing sample topic' })
  @ApiParam({ name: 'topicId', description: 'Writing Sample Topic ID' })
  @ApiResponse({ status: 201, description: 'Essay added successfully' })
  async createEssay(@Param('topicId') topicId: string, @Body() dto: CreateWritingSampleEssayDto) {
    return this.writingSampleAdminService.createEssay(topicId, dto);
  }

  @Patch('essays/:id')
  @ApiOperation({ summary: 'Update an existing model essay and its AI analysis' })
  @ApiParam({ name: 'id', description: 'Writing Sample Essay ID' })
  @ApiResponse({ status: 200, description: 'Essay updated successfully' })
  async updateEssay(@Param('id') id: string, @Body() dto: UpdateWritingSampleEssayDto) {
    return this.writingSampleAdminService.updateEssay(id, dto);
  }

  @Delete('essays/:id')
  @ApiOperation({ summary: 'Delete a model essay' })
  @ApiParam({ name: 'id', description: 'Writing Sample Essay ID' })
  @ApiResponse({ status: 200, description: 'Essay deleted successfully' })
  async deleteEssay(@Param('id') id: string) {
    return this.writingSampleAdminService.deleteEssay(id);
  }
}
