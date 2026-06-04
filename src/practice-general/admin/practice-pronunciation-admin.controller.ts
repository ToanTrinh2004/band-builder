import { Controller, Post, Patch, Delete, Body, Param, UsePipes, ValidationPipe, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { PracticePronunciationAdminService } from './practice-pronunciation-admin.service';
import { extractYoutubeVideoId } from '../youtube/extract-youtube-id.util';
import {
  CreatePronunciationTopicAdminDto,
  UpdatePronunciationTopicAdminDto,
  CreatePronunciationVocabAdminDto,
  UpdatePronunciationVocabAdminDto,
  CreatePronunciationSentenceAdminDto,
  UpdatePronunciationSentenceAdminDto,
} from './dto/practice-pronunciation-admin.dto';

@ApiTags('PracticePronunciationAdmin')
@Controller('admin/pronunciation')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class PracticePronunciationAdminController {
  constructor(private readonly adminService: PracticePronunciationAdminService) {}

  @Post('scrape-transcript')
  @ApiOperation({ summary: 'Scrape YouTube transcript from a URL in real-time' })
  @ApiResponse({ status: 200, description: 'Transcript scraped successfully' })
  async scrapeTranscript(@Body('videoUrl') videoUrl: string) {
    if (!videoUrl) {
      throw new BadRequestException('videoUrl is required');
    }
    const [sentences, title] = await Promise.all([
      this.adminService.scrapeTranscript(videoUrl),
      this.adminService.getVideoTitle(videoUrl).catch(() => {
        const videoId = extractYoutubeVideoId(videoUrl);
        return `YouTube Lesson: ${videoId ? videoId.toUpperCase() : 'New'}`;
      }),
    ]);
    const paragraph = sentences.map(s => s.text).join(' ');
    return {
      title,
      paragraph,
      sentences,
    };
  }

  // ── Topics CRUD ────────────────────────────────────────────────────────────

  @Post('topics')
  @ApiOperation({ summary: 'Create a new pronunciation topic (scrapes YouTube transcript if videoUrl supplied)' })
  @ApiResponse({ status: 201, description: 'Topic created successfully with core vocabularies and interactive sentences' })
  async createTopic(@Body() dto: CreatePronunciationTopicAdminDto) {
    return this.adminService.createTopic(dto);
  }

  @Patch('topics/:id')
  @ApiOperation({ summary: 'Update metadata of an existing pronunciation topic' })
  @ApiParam({ name: 'id', description: 'Pronunciation Topic ID' })
  @ApiResponse({ status: 200, description: 'Topic updated successfully' })
  async updateTopic(@Param('id') id: string, @Body() dto: UpdatePronunciationTopicAdminDto) {
    return this.adminService.updateTopic(id, dto);
  }

  @Delete('topics/:id')
  @ApiOperation({ summary: 'Delete a pronunciation topic and all its associated vocabularies & sentences' })
  @ApiParam({ name: 'id', description: 'Pronunciation Topic ID' })
  @ApiResponse({ status: 200, description: 'Topic and associated contents deleted successfully' })
  async deleteTopic(@Param('id') id: string) {
    return this.adminService.deleteTopic(id);
  }

  // ── Vocabularies CRUD ──────────────────────────────────────────────────────

  @Post('topics/:topicId/vocabs')
  @ApiOperation({ summary: 'Add a new key vocabulary item to a pronunciation topic' })
  @ApiParam({ name: 'topicId', description: 'Pronunciation Topic ID' })
  @ApiResponse({ status: 201, description: 'Vocabulary added successfully' })
  async createVocab(@Param('topicId') topicId: string, @Body() dto: CreatePronunciationVocabAdminDto) {
    return this.adminService.createVocab(topicId, dto);
  }

  @Patch('vocabs/:id')
  @ApiOperation({ summary: 'Update an existing pronunciation vocabulary item' })
  @ApiParam({ name: 'id', description: 'Pronunciation Vocabulary ID' })
  @ApiResponse({ status: 200, description: 'Vocabulary updated successfully' })
  async updateVocab(@Param('id') id: string, @Body() dto: UpdatePronunciationVocabAdminDto) {
    return this.adminService.updateVocab(id, dto);
  }

  @Delete('vocabs/:id')
  @ApiOperation({ summary: 'Delete a pronunciation vocabulary item' })
  @ApiParam({ name: 'id', description: 'Pronunciation Vocabulary ID' })
  @ApiResponse({ status: 200, description: 'Vocabulary deleted successfully' })
  async deleteVocab(@Param('id') id: string) {
    return this.adminService.deleteVocab(id);
  }

  // ── Sentences CRUD ─────────────────────────────────────────────────────────

  @Post('topics/:topicId/sentences')
  @ApiOperation({ summary: 'Add an interactive pronunciation sentence manually' })
  @ApiParam({ name: 'topicId', description: 'Pronunciation Topic ID' })
  @ApiResponse({ status: 201, description: 'Sentence added successfully' })
  async createSentence(@Param('topicId') topicId: string, @Body() dto: CreatePronunciationSentenceAdminDto) {
    return this.adminService.createSentence(topicId, dto);
  }

  @Patch('sentences/:id')
  @ApiOperation({ summary: 'Update an existing interactive pronunciation sentence' })
  @ApiParam({ name: 'id', description: 'Pronunciation Sentence ID' })
  @ApiResponse({ status: 200, description: 'Sentence updated successfully' })
  async updateSentence(@Param('id') id: string, @Body() dto: UpdatePronunciationSentenceAdminDto) {
    return this.adminService.updateSentence(id, dto);
  }

  @Delete('sentences/:id')
  @ApiOperation({ summary: 'Delete a pronunciation sentence' })
  @ApiParam({ name: 'id', description: 'Pronunciation Sentence ID' })
  @ApiResponse({ status: 200, description: 'Sentence deleted successfully' })
  async deleteSentence(@Param('id') id: string) {
    return this.adminService.deleteSentence(id);
  }
}
