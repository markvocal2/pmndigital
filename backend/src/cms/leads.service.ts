import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Lead, LeadStatus, LeadType } from './entities';
import { CreateLeadDto } from './dto';
import { CmsService } from './cms.service';
import { MailService } from '../mail/mail.service';

@Injectable()
export class LeadsService {
  private readonly logger = new Logger('LeadsService');

  constructor(
    @InjectRepository(Lead) private readonly leads: Repository<Lead>,
    private readonly cms: CmsService,
    private readonly mail: MailService,
  ) {}

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
    // fire-and-forget notification — never block / fail the public submission
    void this.notify(lead);
    return { ok: true };
  }

  private async notify(lead: Lead): Promise<void> {
    try {
      if (!this.mail.isConfigured()) return;
      const recipients = await this.notifyRecipients();
      if (!recipients.length) {
        this.logger.warn('lead notify skipped — no recipient configured');
        return;
      }
      await this.mail.sendLeadNotification(lead, recipients);
    } catch (e) {
      this.logger.error(
        `lead notify failed: ${e instanceof Error ? e.message : e}`,
      );
    }
  }

  /** LEAD_NOTIFY_TO env (comma-separated) takes priority, else SiteSetting.contactEmail. */
  private async notifyRecipients(): Promise<string[]> {
    const env = (process.env.LEAD_NOTIFY_TO || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    if (env.length) return env;
    const settings = await this.cms.getSettings();
    return settings.contactEmail ? [settings.contactEmail] : [];
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
