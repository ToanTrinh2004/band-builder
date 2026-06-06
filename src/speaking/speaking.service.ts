import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SaveSpeakingSessionDto } from './speaking.dto';

@Injectable()
export class SpeakingService {
  private readonly logger = new Logger(SpeakingService.name);

  constructor(private readonly prisma: PrismaService) {}

  async saveSession(userId: string, dto: SaveSpeakingSessionDto) {
    this.logger.log(`Saving speaking session for user ${userId} examiner ${dto.voiceId}`);
    return this.prisma.speakingSession.create({
      data: {
        userId,
        voiceId: dto.voiceId,
        dialogue: dto.dialogue as any,
        overallBand: dto.overallBand,
        fluency: dto.fluency,
        lexical: dto.lexical,
        grammar: dto.grammar,
        pronunciation: dto.pronunciation,
        corrections: dto.corrections as any,
      },
    });
  }

  async getHistory(userId: string) {
    this.logger.log(`Retrieving speaking session history for user ${userId}`);
    return this.prisma.speakingSession.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
  }

  async getSessionDetail(userId: string, sessionId: string) {
    this.logger.log(`Retrieving speaking session detail: ${sessionId} for user ${userId}`);
    const session = await this.prisma.speakingSession.findUnique({
      where: { id: sessionId },
    });
    if (!session || session.userId !== userId) {
      throw new NotFoundException('Speaking session not found');
    }
    return session;
  }
}
