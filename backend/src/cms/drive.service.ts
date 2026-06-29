import { Injectable, Logger } from '@nestjs/common';

/**
 * PMN Drive (FileBrowser REST) client — per https://drive.pmndigital.co/docs/api.md.
 * Uploads/serves all files via the central Drive; public URLs go through cdn.pmndigital.co.
 * Account `app` is scoped to /uploads, so paths are relative to PMN-Drive/uploads.
 */
@Injectable()
export class DriveService {
  private readonly logger = new Logger('DriveService');
  private readonly base = process.env.DRIVE_API_URL || 'http://drive:80';
  private readonly user = process.env.DRIVE_USER || 'app';
  private readonly pass = process.env.DRIVE_PASS || '';
  private readonly cdn = process.env.DRIVE_CDN_URL || 'https://cdn.pmndigital.co';
  private jwt = '';
  private at = 0;

  private p(path: string): string {
    return encodeURI(path.replace(/^\/+/, ''));
  }

  private async token(): Promise<string> {
    if (this.jwt && Date.now() - this.at < 90 * 60_000) return this.jwt;
    const r = await fetch(`${this.base}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: this.user, password: this.pass, recaptcha: '' }),
    });
    if (!r.ok) throw new Error(`drive login failed: ${r.status}`);
    this.jwt = await r.text();
    this.at = Date.now();
    return this.jwt;
  }

  async mkdir(dir: string): Promise<void> {
    await fetch(`${this.base}/api/resources/${this.p(dir)}/?override=false`, {
      method: 'POST',
      headers: { 'X-Auth': await this.token() },
    });
  }

  async upload(path: string, data: Buffer): Promise<void> {
    if (path.includes('/')) await this.mkdir(path.slice(0, path.lastIndexOf('/')));
    const r = await fetch(`${this.base}/api/resources/${this.p(path)}?override=true`, {
      method: 'POST',
      headers: { 'X-Auth': await this.token() },
      body: new Uint8Array(data),
    });
    if (!r.ok) throw new Error(`drive upload failed: ${r.status}`);
  }

  async remove(path: string): Promise<void> {
    const r = await fetch(`${this.base}/api/resources/${this.p(path)}`, {
      method: 'DELETE',
      headers: { 'X-Auth': await this.token() },
    });
    if (!r.ok && r.status !== 204) throw new Error(`drive delete failed: ${r.status}`);
  }

  /** Create a public CDN URL (no auth) for use in <img>/<video>/download. */
  async publicLink(path: string): Promise<string> {
    const r = await fetch(`${this.base}/api/share/${this.p(path)}`, {
      method: 'POST',
      headers: { 'X-Auth': await this.token() },
      body: '{}',
    });
    if (!r.ok) throw new Error(`drive share failed: ${r.status}`);
    const { hash } = (await r.json()) as { hash: string };
    const name = encodeURIComponent(path.split('/').pop() || 'file');
    return `${this.cdn}/api/public/dl/${hash}/${name}`;
  }
}
