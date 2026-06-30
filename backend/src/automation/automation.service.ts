import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Cron } from '@nestjs/schedule';
import { Repository } from 'typeorm';
import { AiService } from '../ai/ai.service';
import { generateArticleDraft } from '../ai/article-draft';
import { ArticlesService } from '../cms/articles.service';
import { LeadsService } from '../cms/leads.service';
import { MailService } from '../mail/mail.service';
import { AutomationJob } from './automation-job.entity';

export const JOB_DEFS = [
  {
    key: 'weekly_article_draft',
    title: 'ร่างบทความรายสัปดาห์',
    schedule: 'ทุกวันจันทร์ 09:00 น.',
    description: 'ให้ Claude คิดหัวข้อใหม่ตามธีมที่ตั้งไว้ แล้วเขียนบทความบันทึกเป็นฉบับร่าง (เลือกสร้างภาพปกด้วย Gemini ได้)',
    needs: 'Claude',
  },
  {
    key: 'weekly_lead_digest',
    title: 'สรุป Leads รายสัปดาห์ (อีเมล)',
    schedule: 'ทุกวันจันทร์ 08:00 น.',
    description: 'สรุปรายชื่อผู้ติดต่อรอบสัปดาห์ด้วย Claude แล้วส่งอีเมลให้ทีม',
    needs: 'Claude + SMTP',
  },
  {
    key: 'auto_cover_missing',
    title: 'เติมภาพปกอัตโนมัติ',
    schedule: 'ทุกวัน 03:00 น.',
    description: 'หาบทความที่ยังไม่มีภาพปก แล้วสร้างปกด้วย Gemini (จำกัดจำนวนต่อรอบ)',
    needs: 'Gemini',
  },
] as const;

const JOB_KEYS = new Set<string>(JOB_DEFS.map((j) => j.key));

@Injectable()
export class AutomationService {
  private readonly log = new Logger('Automation');

  constructor(
    private readonly ai: AiService,
    private readonly articles: ArticlesService,
    private readonly leads: LeadsService,
    private readonly mail: MailService,
    @InjectRepository(AutomationJob) private readonly repo: Repository<AutomationJob>,
  ) {}

  isValidKey(key: string): boolean {
    return JOB_KEYS.has(key);
  }

  private async getJob(key: string): Promise<AutomationJob> {
    let job = await this.repo.findOne({ where: { jobKey: key } });
    if (!job) {
      job = this.repo.create({ jobKey: key, enabled: false });
      await this.repo.save(job);
    }
    return job;
  }

  async listStatus() {
    const rows = await this.repo.find();
    const byKey = new Map(rows.map((r) => [r.jobKey, r]));
    return JOB_DEFS.map((def) => {
      const r = byKey.get(def.key);
      return {
        ...def,
        enabled: r?.enabled ?? false,
        config: (r?.config as Record<string, unknown>) ?? {},
        lastRunAt: r?.lastRunAt ? r.lastRunAt.toISOString() : null,
        lastStatus: r?.lastStatus ?? null,
        lastMessage: r?.lastMessage ?? null,
      };
    });
  }

  async update(key: string, dto: { enabled?: boolean; config?: Record<string, unknown> }) {
    const job = await this.getJob(key);
    if (typeof dto.enabled === 'boolean') job.enabled = dto.enabled;
    if (dto.config) job.config = dto.config;
    await this.repo.save(job);
    return (await this.listStatus()).find((j) => j.key === key)!;
  }

  async runNow(key: string): Promise<{ ok: boolean; status: string; detail: string }> {
    return this.exec(key, true);
  }

  private async exec(key: string, force: boolean): Promise<{ ok: boolean; status: string; detail: string }> {
    const job = await this.getJob(key);
    if (!force && !job.enabled) return { ok: true, status: 'skipped', detail: 'ปิดอยู่' };
    let status = 'ok';
    let detail = '';
    try {
      detail = await this.dispatch(key, (job.config as Record<string, unknown>) ?? {});
    } catch (e) {
      status = 'error';
      detail = e instanceof Error ? e.message : String(e);
      this.log.error(`job ${key} failed: ${detail}`);
    }
    job.lastRunAt = new Date();
    job.lastStatus = status;
    job.lastMessage = detail.slice(0, 500);
    await this.repo.save(job);
    return { ok: status === 'ok', status, detail };
  }

  private dispatch(key: string, cfg: Record<string, unknown>): Promise<string> {
    switch (key) {
      case 'weekly_article_draft':
        return this.doWeeklyArticle(cfg);
      case 'weekly_lead_digest':
        return this.doLeadDigest(cfg);
      case 'auto_cover_missing':
        return this.doAutoCover(cfg);
      default:
        throw new Error('unknown job');
    }
  }

  /* ---------------- job handlers ---------------- */
  private async doWeeklyArticle(cfg: Record<string, unknown>): Promise<string> {
    if (!(await this.ai.anthropicReady())) return 'ข้าม: ยังไม่ได้ตั้งค่า Claude';
    const theme = (typeof cfg.theme === 'string' && cfg.theme) || 'เทคโนโลยี ดิจิทัล และการตลาดออนไลน์สำหรับธุรกิจไทย';
    const topicRaw = await this.ai.generateText({
      system: 'ตอบสั้น ๆ บรรทัดเดียว ไม่ต้องมีเครื่องหมายคำพูด',
      prompt: `เสนอหัวข้อบทความใหม่ที่น่าสนใจ 1 หัวข้อ ในธีม: ${theme} (ตอบเฉพาะชื่อหัวข้อ)`,
      maxTokens: 120,
    });
    const topic = topicRaw.trim().split('\n')[0].replace(/^["'“]|["'”]$/g, '').slice(0, 160);
    const d = await generateArticleDraft(this.ai, { topic });
    let coverImageUrl: string | undefined;
    if (cfg.withCover && (await this.ai.geminiReady())) {
      try {
        coverImageUrl = (
          await this.ai.generateImageToDrive(
            `Professional blog cover illustration for "${d.title}", modern, clean, corporate, no text`,
          )
        ).url;
      } catch {
        /* cover optional */
      }
    }
    const a = await this.articles.create(
      {
        title: d.title,
        slug: d.slug,
        excerpt: d.excerpt,
        bodyMarkdown: d.bodyMarkdown,
        coverImageUrl,
        status: 'DRAFT',
        categoryId: typeof cfg.categoryId === 'number' ? cfg.categoryId : undefined,
        tags: d.tags,
        metaTitle: d.metaTitle,
        metaDesc: d.metaDesc,
      },
      null,
    );
    return `สร้างฉบับร่าง #${a.id}: ${a.title}`;
  }

  private async doLeadDigest(cfg: Record<string, unknown>): Promise<string> {
    if (!(await this.ai.anthropicReady())) return 'ข้าม: ยังไม่ได้ตั้งค่า Claude';
    const to = (typeof cfg.email === 'string' && cfg.email) || process.env.LEAD_NOTIFY_TO;
    if (!to) return 'ข้าม: ไม่มีอีเมลปลายทาง (ตั้ง LEAD_NOTIFY_TO หรือ config.email)';
    const data = await this.leads.list({ limit: 100, page: 1 });
    if (!data.total) return 'ไม่มี leads ในระบบ';
    const summary = await this.ai.generateText({
      system: 'คุณเป็นผู้ช่วยทีมขาย สรุปเป็นภาษาไทย กระชับ เป็นหัวข้อ เหมาะส่งอีเมล',
      prompt: `สรุปรายชื่อผู้ติดต่อ (leads) ล่าสุด: จำนวนรวม, แนวโน้ม, รายที่ควรรีบติดตาม, ข้อเสนอแนะ\n\n${JSON.stringify(
        data,
      ).slice(0, 12000)}`,
      maxTokens: 1500,
    });
    await this.mail.send({
      to,
      subject: `สรุป Leads รายสัปดาห์ — PMN Digital (${data.total} รายการ)`,
      html: `<div style="font-family:'Noto Sans Thai',system-ui,sans-serif;white-space:pre-wrap;line-height:1.7">${summary.replace(
        /</g,
        '&lt;',
      )}</div>`,
      text: summary,
    });
    return `ส่งสรุป ${data.total} leads ไปที่ ${to}`;
  }

  private async doAutoCover(cfg: Record<string, unknown>): Promise<string> {
    if (!(await this.ai.geminiReady())) return 'ข้าม: ยังไม่ได้ตั้งค่า Gemini';
    const limit = Math.min(10, Math.max(1, Number(cfg.limit) || 3));
    const res = await this.articles.listAll({ limit: 100, page: 1 });
    const missing = res.items.filter((a) => !a.coverImageUrl).slice(0, limit);
    let done = 0;
    for (const a of missing) {
      try {
        const { url } = await this.ai.generateImageToDrive(
          `Professional blog cover illustration for "${a.title}", modern, clean, corporate, no text`,
        );
        await this.articles.update(a.id, {
          title: a.title,
          slug: a.slug,
          excerpt: a.excerpt ?? undefined,
          bodyMarkdown: a.bodyMarkdown,
          coverImageUrl: url,
          status: a.status,
          categoryId: a.categoryId ?? undefined,
          tags: a.tags,
          metaTitle: a.metaTitle ?? undefined,
          metaDesc: a.metaDesc ?? undefined,
          canonicalUrl: a.canonicalUrl ?? undefined,
        });
        done++;
      } catch {
        /* skip this one */
      }
    }
    return `เติมปก ${done}/${missing.length} บทความ`;
  }

  /* ---------------- cron triggers (Asia/Bangkok) ---------------- */
  @Cron('0 9 * * 1', { name: 'weekly_article_draft', timeZone: 'Asia/Bangkok' })
  cronWeeklyArticle(): void {
    void this.exec('weekly_article_draft', false);
  }

  @Cron('0 8 * * 1', { name: 'weekly_lead_digest', timeZone: 'Asia/Bangkok' })
  cronLeadDigest(): void {
    void this.exec('weekly_lead_digest', false);
  }

  @Cron('0 3 * * *', { name: 'auto_cover_missing', timeZone: 'Asia/Bangkok' })
  cronAutoCover(): void {
    void this.exec('auto_cover_missing', false);
  }
}
