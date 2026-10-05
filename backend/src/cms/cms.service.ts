import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { appendFile, mkdir, readdir, rm, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { SiteSetting, HomeContent, Media } from './entities';
import { UpdateSettingsDto, UpdateHomeDto } from './dto';
import { DriveService } from './drive.service';

/** Largest file the CMS accepts. Big clips arrive in chunks (see saveChunk). */
export const MAX_BYTES = 1024 * 1024 * 1024;
const MAX_LABEL = '1 GB';
/** Chunk ceiling: the admin sends 8 MB pieces; anything bigger than this is not ours. */
const CHUNK_MAX = 16 * 1024 * 1024;
const PART_DIR = join(tmpdir(), 'pmn-uploads');
/** Half-finished uploads older than this are swept on the next upload. */
const PART_TTL_MS = 24 * 60 * 60 * 1000;
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
      throw new BadRequestException(`ไฟล์ใหญ่เกินไป — สูงสุด ${MAX_LABEL}`);
    }
    const hash = createHash('sha256').update(file.buffer).digest('hex').slice(0, 12);
    const driveName = `cms/${hash}.${this.extOf(file.originalname, file.mimetype)}`;
    await this.drive.upload(driveName, file.buffer);
    return this.record(driveName, file.originalname, file.mimetype, file.size);
  }

  /**
   * One piece of a chunked upload. Pieces are appended to a temp file in order; the last one
   * hashes the file, streams it to the Drive and returns the public url like saveImage does.
   * A repeated piece (client retry after a lost response) is acknowledged without appending twice.
   */
  async saveChunk(
    meta: { uploadId: string; offset: number; last: boolean; size: number; name?: string; type?: string },
    chunk: Buffer,
  ): Promise<{ received: number; url?: string }> {
    const { uploadId, offset, last, size } = meta;
    if (!/^[A-Za-z0-9-]{8,64}$/.test(uploadId)) throw new BadRequestException('invalid upload id');
    if (!Number.isInteger(size) || size < 1) throw new BadRequestException('invalid size');
    if (size > MAX_BYTES) throw new BadRequestException(`ไฟล์ใหญ่เกินไป — สูงสุด ${MAX_LABEL}`);
    if (!Number.isInteger(offset) || offset < 0 || offset + chunk.length > size) {
      throw new BadRequestException('invalid chunk offset');
    }
    if (chunk.length < 1 || chunk.length > CHUNK_MAX) throw new BadRequestException('invalid chunk size');

    await mkdir(PART_DIR, { recursive: true });
    if (offset === 0) await this.sweepParts();
    const part = join(PART_DIR, `${uploadId}.part`);
    const have = await stat(part).then((s) => s.size).catch(() => 0);

    if (have === offset) {
      await appendFile(part, chunk);
    } else if (have !== offset + chunk.length) {
      // neither the next piece nor a retry of the previous one: a gap we cannot fill
      await rm(part, { force: true });
      throw new BadRequestException('upload out of order — please retry');
    }
    const received = await stat(part).then((s) => s.size);
    if (!last) return { received };

    try {
      if (received !== size) throw new BadRequestException('upload incomplete — please retry');
      const hash = await new Promise<string>((resolve, reject) => {
        const h = createHash('sha256');
        createReadStream(part)
          .on('data', (d) => h.update(d))
          .on('end', () => resolve(h.digest('hex').slice(0, 12)))
          .on('error', reject);
      });
      const mime = meta.type || 'application/octet-stream';
      const driveName = `cms/${hash}.${this.extOf(meta.name, mime)}`;
      await this.drive.uploadFile(driveName, part);
      return { received, ...(await this.record(driveName, meta.name, mime, size)) };
    } finally {
      await rm(part, { force: true });
    }
  }

  private extOf(name: string | undefined, mime: string): string {
    const fromName = (name || '').split('.').pop()?.toLowerCase() || '';
    return (/^[a-z0-9]{1,8}$/.test(fromName) ? fromName : '') || EXT_BY_MIME[mime] || 'bin';
  }

  private async record(driveName: string, origName: string | undefined, mime: string, size: number) {
    const url = await this.drive.publicLink(driveName);
    await this.media.save(
      this.media.create({ driveName, url, origName: origName ?? null, mime: mime ?? null, size }),
    );
    return { url };
  }

  private async sweepParts(): Promise<void> {
    const now = Date.now();
    for (const f of await readdir(PART_DIR).catch(() => [] as string[])) {
      const p = join(PART_DIR, f);
      const s = await stat(p).catch(() => null);
      if (s && now - s.mtimeMs > PART_TTL_MS) await rm(p, { force: true });
    }
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
