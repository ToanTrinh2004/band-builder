import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { DictionaryService } from './dictionary.service';
import { GetDictionaryDto, DictionaryResponseDto } from './dto/dictionary.dto';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';

@ApiTags('Dictionary')
@Controller('dictionary')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class DictionaryController {
  constructor(private readonly dictionaryService: DictionaryService) {}

  @Get()
  @ApiOperation({ summary: 'Lookup a word definition and translate context sentence' })
  @ApiResponse({ status: 200, type: DictionaryResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized — requires a valid JWT token' })
  async getDefinition(
    @Query() query: GetDictionaryDto,
  ): Promise<DictionaryResponseDto> {
    return this.dictionaryService.getDefinition(query.word, query.sentence);
  }
}
