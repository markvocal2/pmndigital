import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Article, ArticleCategory, ArticleStatus } from './entities';
import { ArticleDto, CategoryDto } from './dto';

function readingMinutes(markdown: string): number {
  const words = (markdown || '').trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

@Injectable()
export class ArticlesService {
  constructor(
    @InjectRepository(Article) private readonly articles: Repository<Article>,
    @InjectRepository(ArticleCategory) private readonly categories: Repository<ArticleCategory>,
  ) {}

  /* -------- public -------- */
  async listPublic(opts: { page?: number; limit?: number; category?: string; tag?: string }) {
    const page = Math.max(1, opts.page || 1);
    const limit = Math.min(50, Math.max(1, opts.limit || 12));
    const qb = this.articles
      .createQueryBuilder('a')
      .where('a.status = :st', { st: ArticleStatus.PUBLISHED })
      .orderBy('a.publishedAt', 'DESC')
      .addOrderBy('a.id', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);
    if (opts.category) {
      const cat = await this.categories.findOne({ where: { slug: opts.category } });
      qb.andWhere('a.categoryId = :cid', { cid: cat ? cat.id : -1 });
    }
    if (opts.tag) qb.andWhere(':tag = ANY(a.tags)', { tag: opts.tag });
    const [items, total] = await qb.getManyAndCount();
    return { items, total, page, limit };
  }

  async getPublicBySlug(slug: string): Promise<Article> {
    const a = await this.articles.findOne({ where: { slug, status: ArticleStatus.PUBLISHED } });
    if (!a) throw new NotFoundException('Article not found');
    return a;
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
    a.coverImageUrl = dto.coverImageUrl ?? null;
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
    a.readingMins = readingMinutes(a.bodyMarkdown);
    const nextStatus = (dto.status as ArticleStatus) ?? a.status ?? ArticleStatus.DRAFT;
    if (nextStatus === ArticleStatus.PUBLISHED && !a.publishedAt) a.publishedAt = new Date();
    if (nextStatus === ArticleStatus.DRAFT) a.publishedAt = null;
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
