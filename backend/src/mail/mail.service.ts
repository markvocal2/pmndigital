import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

export interface SendResult {
  sent: boolean;
  messageId?: string;
  error?: string;
}

export interface MailStatus {
  configured: boolean;
  host: string | null;
  port: number | null;
  secure: boolean;
  user: string | null;
  from: string | null;
}

@Injectable()
export class MailService {
  private readonly logger = new Logger('MailService');
  private transporter: nodemailer.Transporter | null = null;
  private readonly host = process.env.SMTP_HOST || '';
  private readonly port = parseInt(process.env.SMTP_PORT || '587', 10);
  private readonly secure =
    process.env.SMTP_SECURE === 'true' || this.port === 465;
  private readonly user = process.env.SMTP_USER || '';
  private readonly pass = process.env.SMTP_PASS || '';
  private readonly fromAddr = process.env.MAIL_FROM || this.user || '';
  private readonly fromName = process.env.MAIL_FROM_NAME || 'PMN Digital';

  constructor() {
    if (this.host && this.user && this.pass) {
      this.transporter = nodemailer.createTransport({
        host: this.host,
        port: this.port,
        secure: this.secure,
        auth: { user: this.user, pass: this.pass },
        // Allow self-signed / hostname-mismatch during initial setup only.
        tls:
          process.env.SMTP_INSECURE_TLS === 'true'
            ? { rejectUnauthorized: false }
            : undefined,
      });
      this.logger.log(
        `SMTP ready: ${this.host}:${this.port} (secure=${this.secure}) as ${this.user}`,
      );
    } else {
      this.logger.warn(
        'SMTP not configured (SMTP_HOST/SMTP_USER/SMTP_PASS missing) — email sending disabled',
      );
    }
  }

  isConfigured(): boolean {
    return this.transporter !== null;
  }

  status(): MailStatus {
    return {
      configured: this.isConfigured(),
      host: this.host || null,
      port: this.host ? this.port : null,
      secure: this.secure,
      user: this.user || null,
      from: this.fromAddr || null,
    };
  }

  private fromHeader(): string {
    return this.fromName ? `"${this.fromName}" <${this.fromAddr}>` : this.fromAddr;
  }

  async send(opts: {
    to: string | string[];
    subject: string;
    html: string;
    text?: string;
    replyTo?: string;
  }): Promise<SendResult> {
    if (!this.transporter) {
      this.logger.warn(`send skipped (SMTP not configured): "${opts.subject}"`);
      return { sent: false, error: 'SMTP not configured' };
    }
    try {
      const info = await this.transporter.sendMail({
        from: this.fromHeader(),
        to: Array.isArray(opts.to) ? opts.to.join(', ') : opts.to,
        subject: opts.subject,
        html: opts.html,
        text: opts.text ?? stripHtml(opts.html),
        replyTo: opts.replyTo,
      });
      this.logger.log(`sent "${opts.subject}" → ${opts.to} (${info.messageId})`);
      return { sent: true, messageId: info.messageId };
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      this.logger.error(`send failed "${opts.subject}": ${msg}`);
      return { sent: false, error: msg };
    }
  }

  async verify(): Promise<{ ok: boolean; error?: string }> {
    if (!this.transporter) return { ok: false, error: 'SMTP not configured' };
    try {
      await this.transporter.verify();
      return { ok: true };
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : String(e) };
    }
  }

  async sendTest(to: string): Promise<SendResult> {
    return this.send({
      to,
      subject: '[PMN Digital] ทดสอบการส่งอีเมล',
      html: `<div style="font-family:system-ui,'Segoe UI',sans-serif;max-width:520px;margin:0 auto;padding:24px;color:#0f172a">
        <h2 style="margin:0 0 12px;color:#2563eb">ระบบอีเมลทำงานปกติ ✅</h2>
        <p style="margin:0 0 8px;line-height:1.6">นี่คืออีเมลทดสอบจากระบบหลังบ้าน <b>pmndigital.co</b></p>
        <p style="margin:0 0 8px;line-height:1.6;color:#475569">ส่งผ่าน ${this.host}:${this.port} โดย ${this.user}</p>
        <hr style="border:none;border-top:1px solid #e2e8f0;margin:16px 0"/>
        <p style="margin:0;font-size:12px;color:#94a3b8">PMN Digital — Email System</p>
      </div>`,
    });
  }

  async sendLeadNotification(
    lead: {
      id: number;
      type: string;
      name: string;
      email: string;
      phone?: string | null;
      company?: string | null;
      service?: string | null;
      message?: string | null;
      source?: string | null;
    },
    to: string | string[],
  ): Promise<SendResult> {
    const typeLabel =
      lead.type === 'REGISTER' ? 'ลงทะเบียนรับสิทธิพิเศษ' : 'ติดต่อสอบถาม';
    const row = (label: string, value?: string | null) =>
      value
        ? `<tr><td style="padding:6px 12px 6px 0;color:#64748b;white-space:nowrap;vertical-align:top">${label}</td><td style="padding:6px 0;color:#0f172a">${escapeHtml(value)}</td></tr>`
        : '';
    const html = `<div style="font-family:system-ui,'Segoe UI',sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#0f172a">
      <div style="display:inline-block;background:#eff6ff;color:#2563eb;font-size:12px;font-weight:600;padding:4px 10px;border-radius:999px;margin-bottom:12px">${typeLabel}</div>
      <h2 style="margin:0 0 4px">มีลูกค้าใหม่ติดต่อเข้ามา</h2>
      <p style="margin:0 0 16px;color:#64748b;font-size:13px">Lead #${lead.id}</p>
      <table style="border-collapse:collapse;font-size:14px;width:100%">
        ${row('ชื่อ', lead.name)}
        ${row('อีเมล', lead.email)}
        ${row('เบอร์โทร', lead.phone)}
        ${row('บริษัท', lead.company)}
        ${row('บริการที่สนใจ', lead.service)}
        ${row('ข้อความ', lead.message)}
        ${row('ที่มา', lead.source)}
      </table>
      <a href="https://pmndigital.co/admin/leads" style="display:inline-block;margin-top:20px;background:#2563eb;color:#fff;text-decoration:none;font-weight:600;font-size:14px;padding:10px 18px;border-radius:8px">เปิดดูในระบบหลังบ้าน →</a>
      <hr style="border:none;border-top:1px solid #e2e8f0;margin:20px 0 12px"/>
      <p style="margin:0;font-size:12px;color:#94a3b8">PMN Digital — แจ้งเตือนอัตโนมัติ • ตอบกลับอีเมลนี้เพื่อติดต่อลูกค้าได้ทันที</p>
    </div>`;
    return this.send({
      to,
      subject: `[PMN Digital] Lead ใหม่: ${typeLabel} — ${lead.name}`,
      html,
      replyTo: lead.email,
    });
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function stripHtml(s: string): string {
  return s
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
