import { Controller, Get, Query, UsePipes, ValidationPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { GrammarService } from './grammar.service';
import {
  GetGrammarSectionsQueryDto,
  GetGrammarMistakesQueryDto,
  GrammarSectionResponseDto,
  GrammarMistakeResponseDto,
} from './dto/grammar.dto';

@ApiTags('MaterialsGrammar')
@Controller('materials/grammar')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class GrammarController {
  constructor(private readonly grammarService: GrammarService) {}

  @Get('sections')
  @ApiOperation({ summary: 'Get grammar sections, optionally filtered by category and subCategory' })
  @ApiResponse({ status: 200, type: [GrammarSectionResponseDto] })
  async getSections(
    @Query() query: GetGrammarSectionsQueryDto,
  ): Promise<GrammarSectionResponseDto[]> {
    return this.grammarService.getSections(query.category, query.subCategory);
  }

  @Get('mistakes')
  @ApiOperation({ summary: 'Get grammar mistakes, optionally filtered by category' })
  @ApiResponse({ status: 200, type: [GrammarMistakeResponseDto] })
  async getMistakes(
    @Query() query: GetGrammarMistakesQueryDto,
  ): Promise<GrammarMistakeResponseDto[]> {
    return this.grammarService.getMistakes(query.category);
  }
}
