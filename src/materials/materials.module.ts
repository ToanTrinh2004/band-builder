import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';

// User controllers & services
import { VocabController } from './user/vocab.controller';
import { VocabService } from './user/vocab.service';
import { GrammarController } from './user/grammar.controller';
import { GrammarService } from './user/grammar.service';

// Admin controllers & services
import { VocabAdminController } from './admin/vocab-admin.controller';
import { VocabAdminService } from './admin/vocab-admin.service';
import { GrammarAdminController } from './admin/grammar-admin.controller';
import { GrammarAdminService } from './admin/grammar-admin.service';

@Module({
  imports: [PrismaModule],
  controllers: [
    VocabController,
    GrammarController,
    VocabAdminController,
    GrammarAdminController,
  ],
  providers: [
    VocabService,
    GrammarService,
    VocabAdminService,
    GrammarAdminService,
  ],
})
export class MaterialsModule {}
