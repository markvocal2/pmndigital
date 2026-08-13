import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, LessThanOrEqual, Repository } from 'typeorm';
import { Article, ArticleCategory, ArticleStatus } from './entities';
import { ArticleDto, CategoryDto } from './dto';

function readingMinutes(text: string): number {
  const words = (text || '').trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

/** Rough plaintext from HTML (word-count / reading time only). */
function stripHtml(html: string): string {
  return (html || '').replace(/<[^>]+>/g, ' ').replace(/&[a-z#0-9]+;/gi, ' ');
}

/**
 * Scheduling rule, in one place: a PUBLISHED article is only *public* once its publishedAt
 * has arrived. That is what lets scheduling work with no cron — the row is written straight
 * away and simply stays out of every public read until the clock catches up. Rows with a
 * null publishedAt (legacy) count as already live.
 */
export function livePublicWhere<T extends object>(base: T) {
  const now = new Date();
  return [
    { ...base, status: ArticleStatus.PUBLISHED, publishedAt: LessThanOrEqual(now) },
    { ...base, status: ArticleStatus.PUBLISHED, publishedAt: IsNull() },
  ];
}

/** Same rule expressed for query-builder reads (alias `a`); bind `:now`. */
const LIVE_SQL = '(a.publishedAt IS NULL OR a.publishedAt <= :now)';

@Injectable()
export class ArticlesService {
  constructor(
    @InjectRepository(Article) private readonly articles: Repository<Article>,
    @InjectRepository(ArticleCategory) private readonly categories: Repository<ArticleCategory>,
  ) {}

  /* -------- public -------- */
  async listPublic(opts: {
    page?: number;
    limit?: number;
    category?: string;
    tag?: string;
    sort?: string;
  }) {
    const page = Math.max(1, opts.page || 1);
    const limit = Math.min(50, Math.max(1, opts.limit || 12));
    const qb = this.articles
      .createQueryBuilder('a')
      .where('a.status = :st', { st: ArticleStatus.PUBLISHED })
      .andWhere(LIVE_SQL, { now: new Date() })
      .skip((page - 1) * limit)
      .take(limit);
    switch (opts.sort) {
      case 'views':
        qb.orderBy('a.viewCount', 'DESC').addOrderBy('a.id', 'DESC');
        break;
      case 'views_asc':
        qb.orderBy('a.viewCount', 'ASC').addOrderBy('a.id', 'DESC');
        break;
      case 'oldest':
        qb.orderBy('a.publishedAt', 'ASC').addOrderBy('a.id', 'ASC');
        break;
      default:
        qb.orderBy('a.publishedAt', 'DESC').addOrderBy('a.id', 'DESC');
    }
    if (opts.category) {
      const cat = await this.categories.findOne({ where: { slug: opts.category } });
      qb.andWhere('a.categoryId = :cid', { cid: cat ? cat.id : -1 });
    }
    if (opts.tag) qb.andWhere(':tag = ANY(a.tags)', { tag: opts.tag });
    const [items, total] = await qb.getManyAndCount();
    return { items, total, page, limit };
  }

  async getPublicBySlug(slug: string): Promise<Article> {
    const a = await this.articles.findOne({ where: livePublicWhere({ slug }) });
    if (!a) throw new NotFoundException('Article not found');
    return a;
  }

  async incrementView(slug: string): Promise<{ viewCount: number }> {
    const live = await this.articles.findOne({ where: livePublicWhere({ slug }), select: { id: true } });
    if (!live) return { viewCount: 0 };
    await this.articles.increment({ id: live.id }, 'viewCount', 1);
    const a = await this.articles.findOne({ where: { id: live.id }, select: { viewCount: true } });
    return { viewCount: a?.viewCount ?? 0 };
  }

  /** Related by same category OR overlapping tags; falls back to latest others. */
  async related(slug: string, limit = 4): Promise<Article[]> {
    const a = await this.articles.findOne({ where: { slug } });
    if (!a) return [];
    const qb = this.articles
      .createQueryBuilder('a')
      .where('a.status = :st', { st: ArticleStatus.PUBLISHED })
      .andWhere(LIVE_SQL, { now: new Date() })
      .andWhere('a.id != :id', { id: a.id })
      .orderBy('a.publishedAt', 'DESC')
      .addOrderBy('a.id', 'DESC')
      .take(Math.min(12, Math.max(1, limit)));
    const conds: string[] = [];
    const params: Record<string, unknown> = {};
    if (a.categoryId) {
      conds.push('a.categoryId = :cid');
      params.cid = a.categoryId;
    }
    if (a.tags && a.tags.length) {
      conds.push('a.tags && :tags');
      params.tags = a.tags;
    }
    if (conds.length) qb.andWhere('(' + conds.join(' OR ') + ')', params);
    return qb.getMany();
  }

  /* -------- admin -------- */
  async listAll(opts: { page?: number; limit?: number; status?: string; q?: string }) {
    const page = Math.max(1, opts.page || 1);
    const limit = Math.min(100, Math.max(1, opts.limit || 30));
    const qb = this.articles
      .createQueryBuilder('a')
      .orderBy('a.updatedAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);
    if (opts.status === 'DRAFT' || opts.status === 'PUBLISHED') {
      qb.andWhere('a.status = :st', { st: opts.status });
    }
    if (opts.q) {
      qb.andWhere('(a.title ILIKE :q OR a.slug ILIKE :q)', { q: '%' + opts.q + '%' });
    }
    const [items, total] = await qb.getManyAndCount();
    return { items, total, page, limit };
  }

  async getOne(id: number): Promise<Article> {
    const a = await this.articles.findOne({ where: { id } });
    if (!a) throw new NotFoundException('Article not found');
    return a;
  }

  private apply(a: Article, dto: ArticleDto) {
    a.title = dto.title;
    a.slug = dto.slug;
    a.excerpt = dto.excerpt ?? null;
    a.bodyMarkdown = dto.bodyMarkdown ?? '';
    a.bodyHtml = dto.bodyHtml ?? '';
    a.coverImageUrl = dto.coverImageUrl ?? null;
    a.youtubeUrl = dto.youtubeUrl?.trim() || null;
    a.categoryId = dto.categoryId ?? null;
    a.tags = dto.tags ?? [];
    a.metaTitle = dto.metaTitle ?? null;
    a.metaDesc = dto.metaDesc ?? null;
    a.canonicalUrl = dto.canonicalUrl ?? null;
    a.ogImageUrl = dto.ogImageUrl ?? null;
    a.noindex = dto.noindex ?? false;
    a.keyphrase = dto.keyphrase ?? null;
    a.faq = dto.faq ?? null;
    a.takeaways = dto.takeaways ?? [];
    a.schemaType = dto.schemaType || 'Article';
    a.readingMins = readingMinutes(a.bodyHtml ? stripHtml(a.bodyHtml) : a.bodyMarkdown);
    const nextStatus = (dto.status as ArticleStatus) ?? a.status ?? ArticleStatus.DRAFT;
    if (dto.publishedAt !== undefined) {
      // Explicit from the editor: a future timestamp schedules it, blank means "go live now".
      // Kept even while DRAFT so a scheduled time survives a "save as draft".
      const at = dto.publishedAt ? new Date(dto.publishedAt) : null;
      a.publishedAt = nextStatus === ArticleStatus.PUBLISHED ? (at ?? new Date()) : at;
    } else {
      if (nextStatus === ArticleStatus.PUBLISHED && !a.publishedAt) a.publishedAt = new Date();
      if (nextStatus === ArticleStatus.DRAFT) a.publishedAt = null;
    }
    a.status = nextStatus;
  }

  async create(dto: ArticleDto, authorId: number | null): Promise<Article> {
    if (await this.articles.findOne({ where: { slug: dto.slug } })) {
      throw new ConflictException('slug "' + dto.slug + '" ถูกใช้แล้ว');
    }
    const a = this.articles.create({ authorId });
    this.apply(a, dto);
    return this.articles.save(a);
  }

  async update(id: number, dto: ArticleDto): Promise<Article> {
    const a = await this.getOne(id);
    if (dto.slug !== a.slug) {
      const dup = await this.articles.findOne({ where: { slug: dto.slug } });
      if (dup && dup.id !== id) throw new ConflictException('slug "' + dto.slug + '" ถูกใช้แล้ว');
    }
    this.apply(a, dto);
    return this.articles.save(a);
  }

  async remove(id: number): Promise<{ ok: true }> {
    const a = await this.getOne(id);
    await this.articles.remove(a);
    return { ok: true };
  }

  /* -------- categories -------- */
  listCategories() {
    return this.categories.find({ order: { name: 'ASC' } });
  }

  async createCategory(dto: CategoryDto): Promise<ArticleCategory> {
    if (await this.categories.findOne({ where: { slug: dto.slug } })) {
      throw new ConflictException('slug "' + dto.slug + '" ถูกใช้แล้ว');
    }
    return this.categories.save(
      this.categories.create({ slug: dto.slug, name: dto.name, nameEn: dto.nameEn ?? null }),
    );
  }
}
