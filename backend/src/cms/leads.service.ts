import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Lead, LeadStatus, LeadType } from './entities';
import { CreateLeadDto } from './dto';

@Injectable()
export class LeadsService {
  constructor(@InjectRepository(Lead) private readonly leads: Repository<Lead>) {}

  async create(
    dto: CreateLeadDto,
    meta: { ip?: string; userAgent?: string },
  ): Promise<{ ok: true }> {
    // honeypot: bots fill the hidden field → silently drop, pretend success
    if (dto.hp && dto.hp.trim()) return { ok: true };
    const lead = this.leads.create({
      type: dto.type as LeadType,
      name: dto.name,
      email: dto.email,
      phone: dto.phone ?? null,
      company: dto.company ?? null,
      service: dto.service ?? null,
      message: dto.message ?? null,
      source: dto.source ?? null,
      ip: meta.ip ?? null,
      userAgent: meta.userAgent ?? null,
    });
    await this.leads.save(lead);
    return { ok: true };
  }

  async list(opts: { page?: number; limit?: number; type?: string; status?: string }) {
    const page = Math.max(1, opts.page || 1);
    const limit = Math.min(100, Math.max(1, opts.limit || 30));
    const qb = this.leads
      .createQueryBuilder('l')
      .orderBy('l.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);
    if (opts.type === 'REGISTER' || opts.type === 'CONTACT') {
      qb.andWhere('l.type = :t', { t: opts.type });
    }
    if (opts.status === 'NEW' || opts.status === 'CONTACTED' || opts.status === 'CLOSED') {
      qb.andWhere('l.status = :s', { s: opts.status });
    }
    const [items, total] = await qb.getManyAndCount();
    return { items, total, page, limit };
  }

  async setStatus(id: number, status: string): Promise<Lead> {
    const lead = await this.leads.findOne({ where: { id } });
    if (!lead) throw new NotFoundException('Lead not found');
    lead.status = status as LeadStatus;
    return this.leads.save(lead);
  }

  async remove(id: number): Promise<{ ok: true }> {
    const lead = await this.leads.findOne({ where: { id } });
    if (!lead) throw new NotFoundException('Lead not found');
    await this.leads.remove(lead);
    return { ok: true };
  }
}
