import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { YoutubeTranscriptService } from './youtube/youtube-transcript.service';

// User Imports
import { PracticeGeneralController } from './user/practice-general.controller';
import { PracticeGeneralService } from './user/practice-general.service';
import { WritingSampleController } from './user/writing-sample.controller';
import { WritingSampleService } from './user/writing-sample.service';

// Admin Imports
import { WritingSampleAdminController } from './admin/writing-sample-admin.controller';
import { WritingSampleAdminService } from './admin/writing-sample-admin.service';

@Module({
  imports: [PrismaModule],
  controllers: [
    PracticeGeneralController,
    WritingSampleController,
    WritingSampleAdminController,
  ],
  providers: [
    PracticeGeneralService,
    YoutubeTranscriptService,
    WritingSampleService,
    WritingSampleAdminService,
  ],
  exports: [PracticeGeneralService],
})
export class PracticeGeneralModule {}


