import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { createHash } from 'node:crypto';
import { SiteSetting, HomeContent, Media } from './entities';
import { UpdateSettingsDto, UpdateHomeDto } from './dto';
import { DriveService } from './drive.service';

const MAX_BYTES = 50 * 1024 * 1024;
// fallback ext when the uploaded filename has none
const EXT_BY_MIME: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/svg+xml': 'svg',
  'image/gif': 'gif',
  'image/avif': 'avif',
  'video/mp4': 'mp4',
  'video/webm': 'webm',
  'video/quicktime': 'mov',
  'application/pdf': 'pdf',
  'application/zip': 'zip',
};

@Injectable()
export class CmsService {
  constructor(
    @InjectRepository(SiteSetting) private readonly settings: Repository<SiteSetting>,
    @InjectRepository(HomeContent) private readonly home: Repository<HomeContent>,
    @InjectRepository(Media) private readonly media: Repository<Media>,
    private readonly drive: DriveService,
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

  /** Upload any file to PMN Drive and record metadata; returns the public CDN url. */
  async saveImage(file: {
    buffer: Buffer;
    mimetype: string;
    size: number;
    originalname?: string;
  }): Promise<{ url: string }> {
    if (file.size > MAX_BYTES) {
      throw new BadRequestException('File too large (max 50 MB)');
    }
    const fromName = (file.originalname || '').split('.').pop()?.toLowerCase() || '';
    const ext =
      (/^[a-z0-9]{1,8}$/.test(fromName) ? fromName : '') ||
      EXT_BY_MIME[file.mimetype] ||
      'bin';
    const hash = createHash('sha256').update(file.buffer).digest('hex').slice(0, 12);
    const driveName = `cms/${hash}.${ext}`;
    await this.drive.upload(driveName, file.buffer);
    const url = await this.drive.publicLink(driveName);
    await this.media.save(
      this.media.create({
        driveName,
        url,
        origName: file.originalname ?? null,
        mime: file.mimetype ?? null,
        size: file.size,
      }),
    );
    return { url };
  }

  async listMedia(): Promise<{
    items: { url: string; filename: string; size: number; mtime: number }[];
  }> {
    const rows = await this.media.find({ order: { createdAt: 'DESC' }, take: 500 });
    return {
      items: rows.map((m) => ({
        url: m.url,
        filename: m.driveName.split('/').pop() || m.driveName,
        size: m.size,
        mtime: m.createdAt.getTime(),
      })),
    };
  }

  async deleteMedia(filename: string): Promise<{ ok: true }> {
    if (!/^[A-Za-z0-9._-]+$/.test(filename) || filename.includes('..')) {
      throw new BadRequestException('invalid filename');
    }
    const driveName = `cms/${filename}`;
    const row = await this.media.findOne({ where: { driveName } });
    try {
      await this.drive.remove(driveName);
    } catch {
      /* file may already be gone on Drive */
    }
    if (row) await this.media.remove(row);
    return { ok: true };
  }
}
