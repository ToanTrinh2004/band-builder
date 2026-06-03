import {
  Controller,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { VocabAdminService } from './vocab-admin.service';
import {
  CreateVocabTopicDto,
  UpdateVocabTopicDto,
  CreateVocabWordDto,
  UpdateVocabWordDto,
} from './dto/vocab-admin.dto';

@ApiTags('MaterialsVocabAdmin')
@Controller('admin/materials/vocab')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class VocabAdminController {
  constructor(private readonly vocabAdminService: VocabAdminService) {}

  // ─── Topics ──────────────────────────────────────────────────────────────────

  @Post('topics')
  @ApiOperation({ summary: 'Create a new vocab topic' })
  @ApiResponse({ status: 201, description: 'Topic created successfully' })
  createTopic(@Body() dto: CreateVocabTopicDto) {
    return this.vocabAdminService.createTopic(dto);
  }

  @Patch('topics/:id')
  @ApiOperation({ summary: 'Update an existing vocab topic' })
  @ApiParam({ name: 'id', description: 'Vocab Topic ID' })
  @ApiResponse({ status: 200, description: 'Topic updated successfully' })
  updateTopic(@Param('id') id: string, @Body() dto: UpdateVocabTopicDto) {
    return this.vocabAdminService.updateTopic(id, dto);
  }

  @Delete('topics/:id')
  @ApiOperation({ summary: 'Delete a vocab topic and all its words' })
  @ApiParam({ name: 'id', description: 'Vocab Topic ID' })
  @ApiResponse({ status: 200, description: 'Topic and associated words deleted successfully' })
  deleteTopic(@Param('id') id: string) {
    return this.vocabAdminService.deleteTopic(id);
  }

  // ─── Words ───────────────────────────────────────────────────────────────────

  @Post('topics/:topicId/words')
  @ApiOperation({ summary: 'Add a word to a vocab topic' })
  @ApiParam({ name: 'topicId', description: 'Vocab Topic ID' })
  @ApiResponse({ status: 201, description: 'Word added successfully' })
  createWord(@Param('topicId') topicId: string, @Body() dto: CreateVocabWordDto) {
    return this.vocabAdminService.createWord(topicId, dto);
  }

  @Patch('words/:id')
  @ApiOperation({ summary: 'Update an existing vocab word' })
  @ApiParam({ name: 'id', description: 'Vocab Word ID' })
  @ApiResponse({ status: 200, description: 'Word updated successfully' })
  updateWord(@Param('id') id: string, @Body() dto: UpdateVocabWordDto) {
    return this.vocabAdminService.updateWord(id, dto);
  }

  @Delete('words/:id')
  @ApiOperation({ summary: 'Delete a vocab word' })
  @ApiParam({ name: 'id', description: 'Vocab Word ID' })
  @ApiResponse({ status: 200, description: 'Word deleted successfully' })
  deleteWord(@Param('id') id: string) {
    return this.vocabAdminService.deleteWord(id);
  }
}
