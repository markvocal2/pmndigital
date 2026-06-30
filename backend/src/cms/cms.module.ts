import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/user.entity';
import {
  Article,
  ArticleCategory,
  Comment,
  Coupon,
  CouponRedemption,
  HomeContent,
  Lead,
  Media,
  Promotion,
  SiteSetting,
} from './entities';
import { CmsService } from './cms.service';
import { ArticlesService } from './articles.service';
import { LeadsService } from './leads.service';
import { CommentsService } from './comments.service';
import { ServerStatusService } from './status.service';
import { DriveService } from './drive.service';
import { PromotionsService } from './promotions.service';
import { CouponsService } from './coupons.service';
import { AdminGuard } from './admin.guard';
import { CmsPublicController } from './public.controller';
import { CmsAdminController } from './admin.controller';
import { PromotionsPublicController } from './promotions.public.controller';
import { PromotionsAdminController } from './promotions.admin.controller';

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
      Promotion,
      Coupon,
      CouponRedemption,
      User,
    ]),
  ],
  controllers: [
    CmsPublicController,
    CmsAdminController,
    PromotionsPublicController,
    PromotionsAdminController,
  ],
  providers: [
    CmsService,
    ArticlesService,
    LeadsService,
    CommentsService,
    ServerStatusService,
    DriveService,
    PromotionsService,
    CouponsService,
    AdminGuard,
  ],
  exports: [ArticlesService, LeadsService],
})
export class CmsModule {}
