import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { YoutubeTranscriptService } from './youtube/youtube-transcript.service';

// User Imports
import { PracticePronunciationController } from './user/practice-pronunciation.controller';
import { PracticePronunciationService } from './user/practice-pronunciation.service';
import { WritingSampleController } from './user/writing-sample.controller';
import { WritingSampleService } from './user/writing-sample.service';

// Admin Imports
import { WritingSampleAdminController } from './admin/writing-sample-admin.controller';
import { WritingSampleAdminService } from './admin/writing-sample-admin.service';
import { PracticePronunciationAdminController } from './admin/practice-pronunciation-admin.controller';
import { PracticePronunciationAdminService } from './admin/practice-pronunciation-admin.service';

@Module({
  imports: [PrismaModule],
  controllers: [
    PracticePronunciationController,
    WritingSampleController,
    WritingSampleAdminController,
    PracticePronunciationAdminController,
  ],
  providers: [
    PracticePronunciationService,
    YoutubeTranscriptService,
    WritingSampleService,
    WritingSampleAdminService,
    PracticePronunciationAdminService,
  ],
  exports: [PracticePronunciationService],
})
export class PracticeGeneralModule {}


