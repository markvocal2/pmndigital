import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomBytes, randomUUID } from 'node:crypto';
import * as bcrypt from 'bcryptjs';
import type { Request, Response } from 'express';
import type { OAuthServerProvider, AuthorizationParams } from '@modelcontextprotocol/sdk/server/auth/provider.js';
import type { OAuthRegisteredClientsStore } from '@modelcontextprotocol/sdk/server/auth/clients.js';
import type {
  OAuthClientInformationFull,
  OAuthTokens,
  OAuthTokenRevocationRequest,
} from '@modelcontextprotocol/sdk/shared/auth.js';
import type { AuthInfo } from '@modelcontextprotocol/sdk/server/auth/types.js';
import { InvalidTokenError } from '@modelcontextprotocol/sdk/server/auth/errors.js';
import { User, UserRole } from '../users/user.entity';
import { OAuthClient, OAuthCode, OAuthToken } from './oauth.entities';

const CODE_TTL_MS = 5 * 60 * 1000;
const TOKEN_TTL_S = 3600;

/**
 * Self-hosted OAuth 2.1 Authorization Server for the MCP connector, backed by the
 * existing User table. Admins log in on the /authorize page; tokens are DB-persisted
 * (survive redeploys) and bound to the MCP resource. Implements the MCP SDK
 * OAuthServerProvider + OAuthRegisteredClientsStore (DCR enabled for claude.ai).
 */
@Injectable()
export class McpOAuthProvider implements OAuthServerProvider {
  constructor(
    @InjectRepository(OAuthClient) private readonly clients: Repository<OAuthClient>,
    @InjectRepository(OAuthCode) private readonly codes: Repository<OAuthCode>,
    @InjectRepository(OAuthToken) private readonly tokens: Repository<OAuthToken>,
    @InjectRepository(User) private readonly users: Repository<User>,
  ) {}

  private readonly _clientsStore: OAuthRegisteredClientsStore = {
    getClient: async (clientId) => {
      const c = await this.clients.findOne({ where: { clientId } });
      return c ? (c.metadata as OAuthClientInformationFull) : undefined;
    },
    registerClient: async (client) => {
      const clientId = randomUUID();
      const full: OAuthClientInformationFull = {
        ...client,
        client_id: clientId,
        client_id_issued_at: Math.floor(Date.now() / 1000),
      };
      await this.clients.save(
        this.clients.create({
          clientId,
          clientSecret: full.client_secret ?? null,
          clientName: full.client_name ?? null,
          redirectUris: (full.redirect_uris as string[]) ?? [],
          scope: full.scope ?? null,
          metadata: full,
        }),
      );
      return full;
    },
  };

  get clientsStore(): OAuthRegisteredClientsStore {
    return this._clientsStore;
  }

  // ---- /authorize : render an admin login + consent page ----
  async authorize(client: OAuthClientInformationFull, params: AuthorizationParams, res: Response): Promise<void> {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(this.loginHtml(client, params));
  }

  /** Custom POST handler for the login form (mounted at /mcpauth/login). */
  async handleLogin(req: Request, res: Response): Promise<void> {
    const b = (req.body ?? {}) as Record<string, string>;
    const clientId = b.client_id;
    const redirectUri = b.redirect_uri;
    const client = clientId ? await this.clients.findOne({ where: { clientId } }) : null;
    if (!client || !redirectUri || !client.redirectUris.includes(redirectUri)) {
      res.status(400).send('invalid client or redirect_uri');
      return;
    }
    const user = await this.users.findOne({ where: { email: (b.email ?? '').trim().toLowerCase() } });
    const ok = !!user && user.role === UserRole.ADMIN && (await bcrypt.compare(b.password ?? '', user.passwordHash));
    if (!ok) {
      res.status(401).setHeader('Content-Type', 'text/html; charset=utf-8');
      res.send(
        this.loginHtml(
          client.metadata as OAuthClientInformationFull,
          {
            redirectUri,
            codeChallenge: b.code_challenge,
            state: b.state || undefined,
            scopes: b.scope ? b.scope.split(' ') : undefined,
            resource: b.resource ? new URL(b.resource) : undefined,
          },
          'อีเมล/รหัสผ่านไม่ถูกต้อง หรือบัญชีนี้ไม่ใช่ผู้ดูแลระบบ (ADMIN)',
        ),
      );
      return;
    }
    const code = randomUUID();
    await this.codes.save(
      this.codes.create({
        code,
        clientId,
        userId: user!.id,
        codeChallenge: b.code_challenge,
        redirectUri,
        resource: b.resource || null,
        scope: b.scope || null,
        expiresAt: new Date(Date.now() + CODE_TTL_MS),
      }),
    );
    const u = new URL(redirectUri);
    u.searchParams.set('code', code);
    if (b.state) u.searchParams.set('state', b.state);
    res.redirect(302, u.href);
  }

  async challengeForAuthorizationCode(
    _client: OAuthClientInformationFull,
    authorizationCode: string,
  ): Promise<string> {
    const c = await this.codes.findOne({ where: { code: authorizationCode } });
    if (!c) throw new Error('invalid_grant');
    return c.codeChallenge;
  }

  async exchangeAuthorizationCode(
    client: OAuthClientInformationFull,
    authorizationCode: string,
    _codeVerifier?: string,
    _redirectUri?: string,
    resource?: URL,
  ): Promise<OAuthTokens> {
    const c = await this.codes.findOne({ where: { code: authorizationCode } });
    if (!c || c.clientId !== client.client_id || c.expiresAt.getTime() < Date.now()) {
      throw new Error('invalid_grant');
    }
    await this.codes.delete({ id: c.id });
    return this.issue(client.client_id, c.userId, c.scope, resource?.href ?? c.resource);
  }

  async exchangeRefreshToken(
    client: OAuthClientInformationFull,
    refreshToken: string,
    scopes?: string[],
    resource?: URL,
  ): Promise<OAuthTokens> {
    const t = await this.tokens.findOne({ where: { refreshToken } });
    if (!t || t.revoked || t.clientId !== client.client_id) throw new Error('invalid_grant');
    t.revoked = true;
    await this.tokens.save(t);
    return this.issue(client.client_id, t.userId, scopes?.join(' ') ?? t.scope, resource?.href ?? t.resource);
  }

  async verifyAccessToken(token: string): Promise<AuthInfo> {
    const t = await this.tokens.findOne({ where: { accessToken: token } });
    if (!t || t.revoked || t.expiresAt.getTime() < Date.now()) {
      throw new InvalidTokenError('Token expired or invalid');
    }
    return {
      token,
      clientId: t.clientId,
      scopes: t.scope ? t.scope.split(' ') : [],
      expiresAt: Math.floor(t.expiresAt.getTime() / 1000),
      resource: t.resource ? new URL(t.resource) : undefined,
      extra: { userId: t.userId },
    };
  }

  async revokeToken(_client: OAuthClientInformationFull, request: OAuthTokenRevocationRequest): Promise<void> {
    const tok = request.token;
    await this.tokens.update({ accessToken: tok }, { revoked: true });
    await this.tokens.update({ refreshToken: tok }, { revoked: true });
  }

  private async issue(
    clientId: string,
    userId: number,
    scope: string | null | undefined,
    resource: string | null | undefined,
  ): Promise<OAuthTokens> {
    const accessToken = randomBytes(32).toString('hex');
    const refreshToken = randomBytes(32).toString('hex');
    await this.tokens.save(
      this.tokens.create({
        accessToken,
        refreshToken,
        clientId,
        userId,
        scope: scope ?? 'mcp',
        resource: resource ?? null,
        revoked: false,
        expiresAt: new Date(Date.now() + TOKEN_TTL_S * 1000),
      }),
    );
    return {
      access_token: accessToken,
      token_type: 'Bearer',
      expires_in: TOKEN_TTL_S,
      refresh_token: refreshToken,
      scope: scope ?? 'mcp',
    };
  }

  private loginHtml(client: OAuthClientInformationFull, params: AuthorizationParams, error?: string): string {
    const esc = (s: string) =>
      String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
    const name = esc(client.client_name || 'แอปพลิเคชัน');
    return `<!doctype html><html lang="th"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>เชื่อมต่อ MCP — PMN Digital</title>
<style>
  body{margin:0;font-family:system-ui,'Noto Sans Thai',sans-serif;background:#0b1120;color:#e2e8f0;display:flex;min-height:100vh;align-items:center;justify-content:center}
  .card{width:100%;max-width:400px;background:#0f172a;border:1px solid rgba(255,255,255,.08);border-radius:18px;padding:28px;box-shadow:0 20px 60px rgba(0,0,0,.4)}
  h1{font-size:19px;margin:0 0 4px} p.sub{margin:0 0 18px;color:#94a3b8;font-size:13px}
  .app{background:rgba(59,130,246,.1);border:1px solid rgba(59,130,246,.25);border-radius:10px;padding:10px 12px;font-size:13px;margin-bottom:16px}
  label{display:block;font-size:13px;margin:12px 0 4px;color:#cbd5e1}
  input{width:100%;box-sizing:border-box;background:#1e293b;border:1px solid rgba(255,255,255,.1);border-radius:9px;padding:10px 12px;color:#fff;font-size:14px}
  button{width:100%;margin-top:18px;background:#2563eb;color:#fff;border:0;border-radius:9px;padding:11px;font-size:15px;font-weight:600;cursor:pointer}
  button:hover{background:#3b82f6}
  .err{background:rgba(244,63,94,.12);color:#fda4af;border-radius:9px;padding:9px 12px;font-size:13px;margin-bottom:8px}
</style></head><body>
<form class="card" method="POST" action="/mcpauth/login">
  <h1>เชื่อมต่อ Claude กับ PMN Digital</h1>
  <p class="sub">เข้าสู่ระบบด้วยบัญชีผู้ดูแล (ADMIN) เพื่ออนุญาตให้เชื่อมต่อ</p>
  <div class="app">🔗 <b>${name}</b> ขอสิทธิ์เข้าถึงเครื่องมือจัดการเว็บไซต์ของคุณ</div>
  ${error ? `<div class="err">${esc(error)}</div>` : ''}
  <label>อีเมล</label>
  <input name="email" type="email" autocomplete="username" required>
  <label>รหัสผ่าน</label>
  <input name="password" type="password" autocomplete="current-password" required>
  <input type="hidden" name="client_id" value="${esc(client.client_id)}">
  <input type="hidden" name="redirect_uri" value="${esc(params.redirectUri)}">
  <input type="hidden" name="code_challenge" value="${esc(params.codeChallenge)}">
  <input type="hidden" name="state" value="${esc(params.state || '')}">
  <input type="hidden" name="scope" value="${esc((params.scopes || []).join(' '))}">
  <input type="hidden" name="resource" value="${esc(params.resource?.href || '')}">
  <button type="submit">อนุญาตและเชื่อมต่อ</button>
</form></body></html>`;
  }
}
