import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AdminGuard } from './admin.guard';
import { PromotionsService } from './promotions.service';
import { CouponsService } from './coupons.service';
import { CouponDto, CouponStateDto, PromotionDto, PromotionStateDto } from './dto';

@Controller('admin')
@UseGuards(AdminGuard)
export class PromotionsAdminController {
  constructor(
    private readonly promotions: PromotionsService,
    private readonly coupons: CouponsService,
  ) {}

  /* ---- promotions ---- */
  @Get('promotions')
  async listPromotions() {
    return { items: await this.promotions.listAll() };
  }
  @Get('promotions/:id')
  async getPromotion(@Param('id', ParseIntPipe) id: number) {
    return { promotion: await this.promotions.getOne(id) };
  }
  @Post('promotions')
  async createPromotion(@Body() dto: PromotionDto) {
    return { promotion: await this.promotions.create(dto) };
  }
  @Patch('promotions/:id')
  async updatePromotion(@Param('id', ParseIntPipe) id: number, @Body() dto: PromotionDto) {
    return { promotion: await this.promotions.update(id, dto) };
  }
  @Patch('promotions/:id/state')
  async setPromotionState(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: PromotionStateDto,
  ) {
    return { promotion: await this.promotions.setState(id, dto) };
  }
  @Delete('promotions/:id')
  deletePromotion(@Param('id', ParseIntPipe) id: number) {
    return this.promotions.remove(id);
  }

  /* ---- coupons ---- */
  @Get('coupons')
  async listCoupons() {
    return { items: await this.coupons.listAll() };
  }
  @Get('coupons/:id')
  async getCoupon(@Param('id', ParseIntPipe) id: number) {
    return { coupon: await this.coupons.getOne(id) };
  }
  @Get('coupons/:id/redemptions')
  redemptions(@Param('id', ParseIntPipe) id: number) {
    return this.coupons.listRedemptions(id);
  }
  @Post('coupons')
  async createCoupon(@Body() dto: CouponDto) {
    return { coupon: await this.coupons.create(dto) };
  }
  @Patch('coupons/:id')
  async updateCoupon(@Param('id', ParseIntPipe) id: number, @Body() dto: CouponDto) {
    return { coupon: await this.coupons.update(id, dto) };
  }
  @Patch('coupons/:id/state')
  async setCouponState(@Param('id', ParseIntPipe) id: number, @Body() dto: CouponStateDto) {
    return { coupon: await this.coupons.setState(id, dto) };
  }
  @Delete('coupons/:id')
  deleteCoupon(@Param('id', ParseIntPipe) id: number) {
    return this.coupons.remove(id);
  }
}
