import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Coupon, CouponRedemption } from './entities';
import { CouponDto, CouponStateDto } from './dto';

export interface CouponValidation {
  valid: boolean;
  message: string;
  code?: string;
  discountType?: string;
  discountValue?: number;
  remaining?: number | null;
}

@Injectable()
export class CouponsService {
  constructor(
    @InjectRepository(Coupon) private readonly coupons: Repository<Coupon>,
    @InjectRepository(CouponRedemption) private readonly redemptions: Repository<CouponRedemption>,
    private readonly dataSource: DataSource,
  ) {}

  private norm(code: string): string {
    return (code || '').trim().toUpperCase();
  }

  private remaining(c: Coupon): number | null {
    return c.maxRedemptions == null ? null : Math.max(0, c.maxRedemptions - c.redeemedCount);
  }

  /** Non-mutating check for live UX feedback in the form. */
  async validate(rawCode: string, email?: string): Promise<CouponValidation> {
    const code = this.norm(rawCode);
    if (!code) return { valid: false, message: 'กรุณากรอกรหัสคูปอง' };
    const c = await this.coupons.findOne({ where: { code } });
    if (!c) return { valid: false, message: 'ไม่พบคูปองนี้' };
    const now = new Date();
    if (!c.active) return { valid: false, message: 'คูปองนี้ถูกปิดใช้งาน' };
    if (c.startsAt && c.startsAt.getTime() > now.getTime())
      return { valid: false, message: 'คูปองยังไม่เริ่มใช้งาน' };
    if (c.endsAt && c.endsAt.getTime() < now.getTime())
      return { valid: false, message: 'คูปองหมดอายุแล้ว' };
    const remaining = this.remaining(c);
    if (remaining !== null && remaining <= 0)
      return { valid: false, message: 'คูปองถูกใช้ครบจำนวนแล้ว' };
    if (email && c.perEmailLimit != null) {
      const used = await this.redemptions.count({
        where: { couponId: c.id, email: email.trim().toLowerCase() },
      });
      if (used >= c.perEmailLimit)
        return { valid: false, message: 'อีเมลนี้ใช้คูปองครบสิทธิ์แล้ว' };
    }
    return {
      valid: true,
      message: 'ใช้คูปองนี้ได้',
      code: c.code,
      discountType: c.discountType,
      discountValue: c.discountValue,
      remaining,
    };
  }

  /**
   * Atomically redeem a coupon (called when a lead is created). Race-safe against
   * over-selling a limited quantity. Never throws — returns applied:false on any issue
   * so it cannot block a public lead submission.
   */
  async redeem(
    rawCode: string,
    email: string | null,
    leadId: number | null,
  ): Promise<{ applied: boolean; message: string; code?: string; couponId?: number }> {
    const code = this.norm(rawCode);
    if (!code) return { applied: false, message: 'no code' };
    try {
      return await this.dataSource.transaction(async (m) => {
        const c = await m.findOne(Coupon, { where: { code } });
        if (!c) return { applied: false, message: 'ไม่พบคูปอง' };
        const now = new Date();
        if (!c.active || (c.startsAt && c.startsAt > now) || (c.endsAt && c.endsAt < now))
          return { applied: false, message: 'คูปองใช้ไม่ได้' };
        const mail = email ? email.trim().toLowerCase() : null;
        if (mail && c.perEmailLimit != null) {
          const used = await m.count(CouponRedemption, { where: { couponId: c.id, email: mail } });
          if (used >= c.perEmailLimit) return { applied: false, message: 'ใช้ครบสิทธิ์ต่ออีเมล' };
        }
        if (c.maxRedemptions != null) {
          // guarded atomic increment: only succeeds while quota remains
          const res = await m
            .createQueryBuilder()
            .update(Coupon)
            .set({ redeemedCount: () => '"redeemedCount" + 1' })
            .where('id = :id AND "redeemedCount" < "maxRedemptions"', { id: c.id })
            .execute();
          if (!res.affected) return { applied: false, message: 'คูปองถูกใช้ครบแล้ว' };
        } else {
          await m.increment(Coupon, { id: c.id }, 'redeemedCount', 1);
        }
        await m.save(
          m.create(CouponRedemption, { couponId: c.id, code: c.code, leadId, email: mail }),
        );
        return { applied: true, message: 'ใช้คูปองสำเร็จ', code: c.code, couponId: c.id };
      });
    } catch {
      return { applied: false, message: 'ใช้คูปองไม่สำเร็จ' };
    }
  }

  /* ---------------- admin ---------------- */

  private apply(target: Coupon, dto: CouponDto): Coupon {
    if (dto.code !== undefined) target.code = this.norm(dto.code);
    if (dto.description !== undefined) target.description = dto.description ?? null;
    if (dto.discountType !== undefined) target.discountType = dto.discountType as Coupon['discountType'];
    if (dto.discountValue !== undefined) target.discountValue = dto.discountValue;
    if (dto.maxRedemptions !== undefined) target.maxRedemptions = dto.maxRedemptions ?? null;
    if (dto.perEmailLimit !== undefined) target.perEmailLimit = dto.perEmailLimit ?? null;
    if (dto.minPurchase !== undefined) target.minPurchase = dto.minPurchase ?? null;
    if (dto.promotionId !== undefined) target.promotionId = dto.promotionId ?? null;
    if (dto.startsAt !== undefined) target.startsAt = dto.startsAt ? new Date(dto.startsAt) : null;
    if (dto.endsAt !== undefined) target.endsAt = dto.endsAt ? new Date(dto.endsAt) : null;
    if (dto.active !== undefined) target.active = dto.active;
    return target;
  }

  async listAll(): Promise<(Coupon & { remaining: number | null })[]> {
    const all = await this.coupons.find({ order: { createdAt: 'DESC' } });
    return all.map((c) => Object.assign(c, { remaining: this.remaining(c) }));
  }

  async getOne(id: number): Promise<Coupon> {
    const c = await this.coupons.findOne({ where: { id } });
    if (!c) throw new NotFoundException('Coupon not found');
    return c;
  }

  create(dto: CouponDto): Promise<Coupon> {
    return this.coupons.save(this.apply(this.coupons.create({ redeemedCount: 0 }), dto));
  }

  async update(id: number, dto: CouponDto): Promise<Coupon> {
    const c = await this.getOne(id);
    return this.coupons.save(this.apply(c, dto));
  }

  async setState(id: number, dto: CouponStateDto): Promise<Coupon> {
    const c = await this.getOne(id);
    if (dto.active !== undefined) c.active = dto.active;
    return this.coupons.save(c);
  }

  async remove(id: number): Promise<{ ok: true }> {
    const c = await this.getOne(id);
    await this.coupons.remove(c);
    return { ok: true };
  }

  async listRedemptions(couponId: number) {
    const items = await this.redemptions.find({
      where: { couponId },
      order: { createdAt: 'DESC' },
      take: 500,
    });
    return { items };
  }
}
