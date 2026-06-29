import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { createHash } from 'node:crypto';
import { SiteSetting, HomeContent } from './entities';
import { UpdateSettingsDto, UpdateHomeDto } from './dto';

const UPLOADS_DIR = process.env.UPLOADS_DIR ?? '/app/uploads';
const IMG_MIME: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/svg+xml': 'svg',
  'image/x-icon': 'ico',
  'image/vnd.microsoft.icon': 'ico',
  'image/gif': 'gif',
  'image/avif': 'avif',
  // video (e.g. article cover videos)
  'video/mp4': 'mp4',
  'video/webm': 'webm',
  'video/quicktime': 'mov',
};
const IMG_MAX_BYTES = 50 * 1024 * 1024;

@Injectable()
export class CmsService {
  constructor(
    @InjectRepository(SiteSetting) private readonly settings: Repository<SiteSetting>,
    @InjectRepository(HomeContent) private readonly home: Repository<HomeContent>,
  ) {}

  async getSettings(): Promise<SiteSetting> {
    let s = await this.settings.findOne({ where: { key: 'default' } });
    if (!s) s = await this.settings.save(this.settings.create({ key: 'default' }));
    return s;
  }

  async updateSettings(dto: UpdateSettingsDto): Promise<SiteSetting> {
    const s = await this.getSettings();
    Object.assign(s, dto);
    return this.settings.save(s);
  }

  async getHome(): Promise<HomeContent> {
    let h = await this.home.findOne({ where: { key: 'home' } });
    if (!h) h = await this.home.save(this.home.create({ key: 'home', data: {} }));
    return h;
  }

  async updateHome(dto: UpdateHomeDto): Promise<HomeContent> {
    const h = await this.getHome();
    if (dto.data !== undefined) h.data = dto.data;
    if (dto.seo !== undefined) h.seo = dto.seo;
    return this.home.save(h);
  }

  async saveImage(file: {
    buffer: Buffer;
    mimetype: string;
    size: number;
  }): Promise<{ url: string }> {
    const ext = IMG_MIME[file.mimetype];
    if (!ext) {
      throw new BadRequestException(
        'Unsupported file type. Allowed: ' + Object.keys(IMG_MIME).join(', '),
      );
    }
    if (file.size > IMG_MAX_BYTES) {
      throw new BadRequestException('File too large (max 50 MB)');
    }
    const hash = createHash('sha256').update(file.buffer).digest('hex').slice(0, 12);
    const filename = hash + '.' + ext;
    const dir = path.join(UPLOADS_DIR, 'cms');
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(path.join(dir, filename), file.buffer);
    return { url: '/uploads/cms/' + filename };
  }

  async listMedia(): Promise<{
    items: { url: string; filename: string; size: number; mtime: number }[];
  }> {
    const dir = path.join(UPLOADS_DIR, 'cms');
    try {
      const names = await fs.readdir(dir);
      const items = await Promise.all(
        names
          .filter((n) => !n.startsWith('.'))
          .map(async (n) => {
            const st = await fs.stat(path.join(dir, n));
            return { url: '/uploads/cms/' + n, filename: n, size: st.size, mtime: st.mtimeMs };
          }),
      );
      items.sort((a, b) => b.mtime - a.mtime);
      return { items };
    } catch {
      return { items: [] };
    }
  }

  async deleteMedia(filename: string): Promise<{ ok: true }> {
    if (!/^[A-Za-z0-9._-]+$/.test(filename) || filename.includes('..')) {
      throw new BadRequestException('invalid filename');
    }
    try {
      await fs.unlink(path.join(UPLOADS_DIR, 'cms', filename));
    } catch {
      /* already gone */
    }
    return { ok: true };
  }
}
