import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { PracticeGeneralController } from './practice-general.controller';
import { PracticeGeneralService } from './practice-general.service';
import { YoutubeTranscriptService } from './youtube/youtube-transcript.service';

@Module({
  imports: [PrismaModule],
  controllers: [PracticeGeneralController],
  providers: [PracticeGeneralService, YoutubeTranscriptService],
  exports: [PracticeGeneralService],
})
export class PracticeGeneralModule {}
