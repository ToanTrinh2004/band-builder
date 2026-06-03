import { Module } from '@nestjs/common';
import { PracticeController } from './practice.controller';
import { PracticeService } from './practice.service';
import { AdminPracticeController } from './admin-practice.controller';
import { AdminPracticeService } from './admin-practice.service';
import { PrismaModule } from '../prisma/prisma.module';

import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [PracticeController, AdminPracticeController],
  providers: [PracticeService, AdminPracticeService],
})
export class PracticeModule { }