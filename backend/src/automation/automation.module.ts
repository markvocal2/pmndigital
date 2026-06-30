import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/user.entity';
import { AiModule } from '../ai/ai.module';
import { CmsModule } from '../cms/cms.module';
import { MailModule } from '../mail/mail.module';
import { AdminGuard } from '../cms/admin.guard';
import { AutomationJob } from './automation-job.entity';
import { AutomationService } from './automation.service';
import { AutomationController } from './automation.controller';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    TypeOrmModule.forFeature([AutomationJob, User]),
    AiModule,
    CmsModule,
    MailModule,
  ],
  controllers: [AutomationController],
  providers: [AutomationService, AdminGuard],
})
export class AutomationModule {}
