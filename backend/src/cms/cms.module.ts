import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/user.entity';
import {
  Article,
  ArticleCategory,
  Comment,
  HomeContent,
  Lead,
  Media,
  SiteSetting,
} from './entities';
import { CmsService } from './cms.service';
import { ArticlesService } from './articles.service';
import { LeadsService } from './leads.service';
import { CommentsService } from './comments.service';
import { ServerStatusService } from './status.service';
import { DriveService } from './drive.service';
import { AdminGuard } from './admin.guard';
import { CmsPublicController } from './public.controller';
import { CmsAdminController } from './admin.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SiteSetting,
      HomeContent,
      Article,
      ArticleCategory,
      Comment,
      Lead,
      Media,
      User,
    ]),
  ],
  controllers: [CmsPublicController, CmsAdminController],
  providers: [CmsService, ArticlesService, LeadsService, CommentsService, ServerStatusService, DriveService, AdminGuard],
})
export class CmsModule {}
