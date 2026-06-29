import { Body, Controller, Get, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { PromotionsService } from './promotions.service';
import { CouponsService } from './coupons.service';
import { ValidateCouponDto } from './dto';

@Controller('public')
export class PromotionsPublicController {
  constructor(
    private readonly promotions: PromotionsService,
    private readonly coupons: CouponsService,
  ) {}

  @Get('promotions')
  async list() {
    return { items: await this.promotions.listPublic() };
  }

  @Post('coupons/validate')
  @HttpCode(HttpStatus.OK)
  validateCoupon(@Body() dto: ValidateCouponDto) {
    return this.coupons.validate(dto.code, dto.email);
  }
}
