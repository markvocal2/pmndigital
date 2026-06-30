import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Integration, IntegrationMode, IntegrationProvider } from './integration.entity';
import { decryptSecret, encryptSecret } from './secret.util';
import { anthropicTest, type AnthropicCreds } from './providers/anthropic.provider';
import { geminiTest, type GeminiCreds } from './providers/gemini.provider';

export interface IntegrationStatus {
  provider: IntegrationProvider;
  mode: IntegrationMode;
  enabled: boolean;
  configured: boolean; // has a stored secret
  status: string | null; // ok | error | untested
  statusMsg: string | null;
  lastTestedAt: string | null;
  meta: Record<string, unknown> | null;
}

const PROVIDERS: IntegrationProvider[] = [
  IntegrationProvider.ANTHROPIC,
  IntegrationProvider.GEMINI,
  IntegrationProvider.OPENAI,
];

@Injectable()
export class IntegrationsService {
  constructor(@InjectRepository(Integration) private readonly repo: Repository<Integration>) {}

  private secret(row: Integration | null): Record<string, unknown> {
    if (!row?.secretEnc) return {};
    try {
      return JSON.parse(decryptSecret(row.secretEnc)) as Record<string, unknown>;
    } catch {
      return {};
    }
  }

  private async row(p: IntegrationProvider): Promise<Integration | null> {
    return this.repo.findOne({ where: { provider: p } });
  }

  /** Public list — never returns secrets. */
  async listStatus(): Promise<IntegrationStatus[]> {
    const rows = await this.repo.find();
    const byP = new Map(rows.map((r) => [r.provider, r]));
    return PROVIDERS.map((p) => {
      const r = byP.get(p) || null;
      const s = this.secret(r);
      return {
        provider: p,
        mode: r?.mode ?? IntegrationMode.API_KEY,
        enabled: r?.enabled ?? false,
        configured: !!(s.apiKey || s.accessToken),
        status: r?.status ?? 'untested',
        statusMsg: r?.statusMsg ?? null,
        lastTestedAt: r?.lastTestedAt ? r.lastTestedAt.toISOString() : null,
        meta: (r?.meta as Record<string, unknown>) ?? null,
      };
    });
  }

  /** Save an API key (and/or mode/enabled/meta). Empty apiKey keeps the existing secret. */
  async save(
    p: IntegrationProvider,
    dto: { mode?: string; apiKey?: string; enabled?: boolean; meta?: Record<string, unknown> },
  ): Promise<IntegrationStatus> {
    let r = await this.row(p);
    if (!r) r = this.repo.create({ provider: p });
    if (dto.mode) r.mode = dto.mode as IntegrationMode;
    if (typeof dto.enabled === 'boolean') r.enabled = dto.enabled;
    if (dto.meta) r.meta = dto.meta;
    if (dto.apiKey && dto.apiKey.trim()) {
      const s = this.secret(r);
      s.apiKey = dto.apiKey.trim();
      r.secretEnc = encryptSecret(JSON.stringify(s));
      r.status = 'untested';
      r.statusMsg = null;
    }
    await this.repo.save(r);
    return (await this.listStatus()).find((x) => x.provider === p)!;
  }

  /** Store OAuth tokens (subscription login) — used by the Login-with-Claude flow. */
  async saveOAuthTokens(
    p: IntegrationProvider,
    tokens: { accessToken: string; refreshToken?: string; expiresAt?: number; account?: string },
  ): Promise<void> {
    let r = await this.row(p);
    if (!r) r = this.repo.create({ provider: p });
    r.mode = IntegrationMode.OAUTH;
    r.enabled = true;
    r.secretEnc = encryptSecret(JSON.stringify(tokens));
    r.status = 'ok';
    r.statusMsg = tokens.account ? `subscription: ${tokens.account}` : 'subscription connected';
    r.lastTestedAt = new Date();
    await this.repo.save(r);
  }

  /** Internal: decrypted Anthropic creds for the provider layer. */
  async anthropicCreds(): Promise<AnthropicCreds | null> {
    const r = await this.row(IntegrationProvider.ANTHROPIC);
    if (!r || !r.enabled) return null;
    const s = this.secret(r);
    if (r.mode === IntegrationMode.OAUTH && s.accessToken)
      return { mode: 'OAUTH', accessToken: String(s.accessToken) };
    if (s.apiKey) return { mode: 'API_KEY', apiKey: String(s.apiKey) };
    return null;
  }

  async geminiCreds(): Promise<GeminiCreds | null> {
    const r = await this.row(IntegrationProvider.GEMINI);
    if (!r || !r.enabled) return null;
    const s = this.secret(r);
    return s.apiKey ? { apiKey: String(s.apiKey) } : null;
  }

  /** Run a live connection test and persist the result. */
  async test(p: IntegrationProvider): Promise<{ ok: boolean; detail: string }> {
    let result: { ok: boolean; detail: string };
    if (p === IntegrationProvider.ANTHROPIC) {
      const r = await this.row(p);
      const s = this.secret(r);
      const creds: AnthropicCreds | null =
        r?.mode === IntegrationMode.OAUTH && s.accessToken
          ? { mode: 'OAUTH', accessToken: String(s.accessToken) }
          : s.apiKey
            ? { mode: 'API_KEY', apiKey: String(s.apiKey) }
            : null;
      result = creds ? await anthropicTest(creds) : { ok: false, detail: 'ยังไม่ได้ตั้งค่า credential' };
    } else if (p === IntegrationProvider.GEMINI) {
      const creds = await this.geminiCreds();
      // geminiCreds requires enabled; for test allow even if not yet enabled
      const r = await this.row(p);
      const s = this.secret(r);
      const c: GeminiCreds | null = creds || (s.apiKey ? { apiKey: String(s.apiKey) } : null);
      result = c ? await geminiTest(c) : { ok: false, detail: 'ยังไม่ได้ตั้งค่า API key' };
    } else {
      result = { ok: false, detail: 'ยังไม่รองรับผู้ให้บริการนี้' };
    }
    const row = (await this.row(p)) || this.repo.create({ provider: p });
    row.status = result.ok ? 'ok' : 'error';
    row.statusMsg = result.detail;
    row.lastTestedAt = new Date();
    if (result.ok) row.enabled = true;
    await this.repo.save(row);
    return result;
  }

  async disconnect(p: IntegrationProvider): Promise<void> {
    const r = await this.row(p);
    if (!r) return;
    r.secretEnc = null;
    r.enabled = false;
    r.status = 'untested';
    r.statusMsg = null;
    r.mode = IntegrationMode.API_KEY;
    await this.repo.save(r);
  }
}
