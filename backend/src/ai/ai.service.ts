import { BadRequestException, Injectable } from '@nestjs/common';
import { createHash } from 'node:crypto';
import { IntegrationsService } from './integrations.service';
import { anthropicText } from './providers/anthropic.provider';
import { geminiImage } from './providers/gemini.provider';
import { DriveService } from '../cms/drive.service';

/** Provider-agnostic façade used by MCP tools + autonomous jobs. */
@Injectable()
export class AiService {
  constructor(
    private readonly integrations: IntegrationsService,
    private readonly drive: DriveService,
  ) {}

  async anthropicReady(): Promise<boolean> {
    return !!(await this.integrations.anthropicCreds());
  }
  async geminiReady(): Promise<boolean> {
    return !!(await this.integrations.geminiCreds());
  }

  async generateText(opts: { system?: string; prompt: string; maxTokens?: number }): Promise<string> {
    const creds = await this.integrations.anthropicCreds();
    if (!creds) throw new BadRequestException('Claude ยังไม่ได้ตั้งค่า — ไปที่ /admin/integrations');
    return anthropicText(creds, opts);
  }

  /** Generate an image with Gemini and store it on PMN Drive; returns the public CDN url. */
  async generateImageToDrive(prompt: string, model?: string): Promise<{ url: string }> {
    const creds = await this.integrations.geminiCreds();
    if (!creds) throw new BadRequestException('Gemini ยังไม่ได้ตั้งค่า — ไปที่ /admin/integrations');
    const { bytes, mime } = await geminiImage(creds, { prompt, model });
    const ext = mime.includes('jpeg') ? 'jpg' : mime.includes('webp') ? 'webp' : 'png';
    const hash = createHash('sha256').update(bytes).digest('hex').slice(0, 12);
    const driveName = `cms/ai-${hash}.${ext}`;
    await this.drive.upload(driveName, bytes);
    const url = await this.drive.publicLink(driveName);
    return { url };
  }
}
