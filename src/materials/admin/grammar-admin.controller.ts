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
import { GrammarAdminService } from './grammar-admin.service';
import {
  CreateGrammarSectionDto,
  UpdateGrammarSectionDto,
  CreateGrammarMistakeDto,
  UpdateGrammarMistakeDto,
} from './dto/grammar-admin.dto';

@ApiTags('MaterialsGrammarAdmin')
@Controller('admin/materials/grammar')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class GrammarAdminController {
  constructor(private readonly grammarAdminService: GrammarAdminService) {}

  // ─── Sections ─────────────────────────────────────────────────────────────────

  @Post('sections')
  @ApiOperation({ summary: 'Create a new grammar section' })
  @ApiResponse({ status: 201, description: 'Grammar section created successfully' })
  createSection(@Body() dto: CreateGrammarSectionDto) {
    return this.grammarAdminService.createSection(dto);
  }

  @Patch('sections/:id')
  @ApiOperation({ summary: 'Update an existing grammar section' })
  @ApiParam({ name: 'id', description: 'Grammar Section ID' })
  @ApiResponse({ status: 200, description: 'Grammar section updated successfully' })
  updateSection(@Param('id') id: string, @Body() dto: UpdateGrammarSectionDto) {
    return this.grammarAdminService.updateSection(id, dto);
  }

  @Delete('sections/:id')
  @ApiOperation({ summary: 'Delete a grammar section' })
  @ApiParam({ name: 'id', description: 'Grammar Section ID' })
  @ApiResponse({ status: 200, description: 'Grammar section deleted successfully' })
  deleteSection(@Param('id') id: string) {
    return this.grammarAdminService.deleteSection(id);
  }

  // ─── Mistakes ─────────────────────────────────────────────────────────────────

  @Post('mistakes')
  @ApiOperation({ summary: 'Create a new grammar mistake' })
  @ApiResponse({ status: 201, description: 'Grammar mistake created successfully' })
  createMistake(@Body() dto: CreateGrammarMistakeDto) {
    return this.grammarAdminService.createMistake(dto);
  }

  @Patch('mistakes/:id')
  @ApiOperation({ summary: 'Update an existing grammar mistake' })
  @ApiParam({ name: 'id', description: 'Grammar Mistake ID' })
  @ApiResponse({ status: 200, description: 'Grammar mistake updated successfully' })
  updateMistake(@Param('id') id: string, @Body() dto: UpdateGrammarMistakeDto) {
    return this.grammarAdminService.updateMistake(id, dto);
  }

  @Delete('mistakes/:id')
  @ApiOperation({ summary: 'Delete a grammar mistake' })
  @ApiParam({ name: 'id', description: 'Grammar Mistake ID' })
  @ApiResponse({ status: 200, description: 'Grammar mistake deleted successfully' })
  deleteMistake(@Param('id') id: string) {
    return this.grammarAdminService.deleteMistake(id);
  }
}
