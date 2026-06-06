import { Controller, Get, Post, Body, Param, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { SpeakingService } from './speaking.service';
import { SaveSpeakingSessionDto } from './speaking.dto';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Speaking')
@Controller('speaking')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SpeakingController {
  constructor(private readonly speakingService: SpeakingService) {}

  @Post('sessions')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Save completed AI speaking call session' })
  @ApiResponse({ status: 201, description: 'Session saved successfully' })
  async saveSession(
    @CurrentUser('userId') userId: string,
    @Body() dto: SaveSpeakingSessionDto,
  ) {
    return this.speakingService.saveSession(userId, dto);
  }

  @Get('sessions')
  @ApiOperation({ summary: 'Get recent AI speaking sessions for the current user' })
  @ApiResponse({ status: 200, description: 'Retrieved session history' })
  async getHistory(@CurrentUser('userId') userId: string) {
    return this.speakingService.getHistory(userId);
  }

  @Get('sessions/:id')
  @ApiOperation({ summary: 'Get details of a specific AI speaking session' })
  @ApiResponse({ status: 200, description: 'Retrieved session details' })
  async getSessionDetail(
    @CurrentUser('userId') userId: string,
    @Param('id') sessionId: string,
  ) {
    return this.speakingService.getSessionDetail(userId, sessionId);
  }
}
