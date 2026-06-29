import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Promotion } from './entities';
import { PromotionDto, PromotionStateDto } from './dto';

@Injectable()
export class PromotionsService {
  constructor(
    @InjectRepository(Promotion) private readonly repo: Repository<Promotion>,
  ) {}

  /** Map a DTO onto entity fields (parse dates, normalise coupon code). */
  private apply(target: Promotion, dto: PromotionDto): Promotion {
    const assignIf = <K extends keyof Promotion>(k: K, v: Promotion[K] | undefined) => {
      if (v !== undefined) target[k] = v;
    };
    assignIf('title', dto.title as Promotion['title']);
    assignIf('subtitle', (dto.subtitle ?? null) as Promotion['subtitle']);
    assignIf('description', (dto.description ?? null) as Promotion['description']);
    assignIf('badge', (dto.badge ?? null) as Promotion['badge']);
    if (dto.discountType !== undefined) target.discountType = dto.discountType as Promotion['discountType'];
    assignIf('discountValue', (dto.discountValue ?? null) as Promotion['discountValue']);
    assignIf('originalPrice', (dto.originalPrice ?? null) as Promotion['originalPrice']);
    assignIf('finalPrice', (dto.finalPrice ?? null) as Promotion['finalPrice']);
    assignIf('priceUnit', (dto.priceUnit ?? null) as Promotion['priceUnit']);
    assignIf('imageUrl', (dto.imageUrl ?? null) as Promotion['imageUrl']);
    assignIf('ctaText', (dto.ctaText ?? null) as Promotion['ctaText']);
    assignIf('ctaUrl', (dto.ctaUrl ?? null) as Promotion['ctaUrl']);
    if (dto.couponCode !== undefined)
      target.couponCode = dto.couponCode ? dto.couponCode.trim().toUpperCase() : null;
    assignIf('terms', (dto.terms ?? null) as Promotion['terms']);
    assignIf('highlightColor', (dto.highlightColor ?? null) as Promotion['highlightColor']);
    if (dto.startsAt !== undefined) target.startsAt = dto.startsAt ? new Date(dto.startsAt) : null;
    if (dto.endsAt !== undefined) target.endsAt = dto.endsAt ? new Date(dto.endsAt) : null;
    if (dto.active !== undefined) target.active = dto.active;
    if (dto.featured !== undefined) target.featured = dto.featured;
    if (dto.sortOrder !== undefined) target.sortOrder = dto.sortOrder;
    return target;
  }

  /** A promotion is "live" when active and inside its (optional) date window. */
  isLive(p: Promotion, now = new Date()): boolean {
    if (!p.active) return false;
    if (p.startsAt && p.startsAt.getTime() > now.getTime()) return false;
    if (p.endsAt && p.endsAt.getTime() < now.getTime()) return false;
    return true;
  }

  /** Public: only live promotions, featured first. */
  async listPublic(): Promise<Promotion[]> {
    const all = await this.repo.find({
      order: { featured: 'DESC', sortOrder: 'ASC', createdAt: 'DESC' },
    });
    return all.filter((p) => this.isLive(p));
  }

  /** Admin: every promotion with a computed status tag. */
  async listAll(): Promise<(Promotion & { live: boolean })[]> {
    const all = await this.repo.find({ order: { sortOrder: 'ASC', createdAt: 'DESC' } });
    const now = new Date();
    return all.map((p) => Object.assign(p, { live: this.isLive(p, now) }));
  }

  async getOne(id: number): Promise<Promotion> {
    const p = await this.repo.findOne({ where: { id } });
    if (!p) throw new NotFoundException('Promotion not found');
    return p;
  }

  create(dto: PromotionDto): Promise<Promotion> {
    return this.repo.save(this.apply(this.repo.create(), dto));
  }

  async update(id: number, dto: PromotionDto): Promise<Promotion> {
    const p = await this.getOne(id);
    return this.repo.save(this.apply(p, dto));
  }

  async setState(id: number, dto: PromotionStateDto): Promise<Promotion> {
    const p = await this.getOne(id);
    if (dto.active !== undefined) p.active = dto.active;
    if (dto.featured !== undefined) p.featured = dto.featured;
    return this.repo.save(p);
  }

  async remove(id: number): Promise<{ ok: true }> {
    const p = await this.getOne(id);
    await this.repo.remove(p);
    return { ok: true };
  }
}
