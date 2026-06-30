import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/user.entity';
import { Integration } from './integration.entity';
import { IntegrationsService } from './integrations.service';
import { AiService } from './ai.service';
import { DriveService } from '../cms/drive.service';
import { AdminGuard } from '../cms/admin.guard';
import { IntegrationsController } from './integrations.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Integration, User])],
  controllers: [IntegrationsController],
  providers: [IntegrationsService, AiService, DriveService, AdminGuard],
  exports: [AiService, IntegrationsService],
})
export class AiModule {}
