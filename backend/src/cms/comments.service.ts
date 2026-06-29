import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Article, ArticleStatus, Comment, CommentStatus } from './entities';
import { CreateCommentDto } from './dto';

@Injectable()
export class CommentsService {
  constructor(
    @InjectRepository(Comment) private readonly comments: Repository<Comment>,
    @InjectRepository(Article) private readonly articles: Repository<Article>,
  ) {}

  /* -------- public -------- */
  async createPublic(
    slug: string,
    dto: CreateCommentDto,
    meta: { ip?: string; userAgent?: string },
  ): Promise<{ ok: true; status: 'PENDING' }> {
    // honeypot: bots fill the hidden field → silently accept, don't store
    if (dto.hp && dto.hp.trim()) return { ok: true, status: 'PENDING' };
    const art = await this.articles.findOne({
      where: { slug, status: ArticleStatus.PUBLISHED },
      select: { id: true },
    });
    if (!art) throw new NotFoundException('Article not found');
    const c = this.comments.create({
      articleId: art.id,
      authorName: dto.authorName.trim(),
      authorEmail: dto.authorEmail?.trim() || null,
      body: dto.body.trim(),
      status: CommentStatus.PENDING,
      ip: meta.ip ?? null,
      userAgent: meta.userAgent ?? null,
    });
    await this.comments.save(c);
    return { ok: true, status: 'PENDING' };
  }

  /** Approved comments only, public-safe fields. */
  async listPublic(slug: string) {
    const art = await this.articles.findOne({ where: { slug }, select: { id: true } });
    if (!art) return { items: [] };
    const rows = await this.comments.find({
      where: { articleId: art.id, status: CommentStatus.APPROVED },
      order: { createdAt: 'ASC' },
    });
    return {
      items: rows.map((c) => ({
        id: c.id,
        authorName: c.authorName,
        body: c.body,
        createdAt: c.createdAt,
      })),
    };
  }

  /* -------- admin -------- */
  async listAdmin(opts: { page?: number; limit?: number; status?: string }) {
    const page = Math.max(1, opts.page || 1);
    const limit = Math.min(100, Math.max(1, opts.limit || 30));
    const where: { status?: CommentStatus } = {};
    if (
      opts.status === 'PENDING' ||
      opts.status === 'APPROVED' ||
      opts.status === 'REJECTED'
    ) {
      where.status = opts.status as CommentStatus;
    }
    const [rows, total] = await this.comments.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    const ids = [...new Set(rows.map((r) => r.articleId))];
    const arts = ids.length
      ? await this.articles.find({ where: { id: In(ids) }, select: { id: true, title: true, slug: true } })
      : [];
    const map = new Map(arts.map((a) => [a.id, a]));
    const items = rows.map((c) => {
      const art = map.get(c.articleId);
      return {
        id: c.id,
        articleId: c.articleId,
        article: art ? { title: art.title, slug: art.slug } : null,
        authorName: c.authorName,
        authorEmail: c.authorEmail,
        body: c.body,
        status: c.status,
        createdAt: c.createdAt,
      };
    });
    return { items, total, page, limit };
  }

  async pendingCount(): Promise<{ count: number }> {
    return { count: await this.comments.count({ where: { status: CommentStatus.PENDING } }) };
  }

  async setStatus(id: number, status: string): Promise<Comment> {
    const c = await this.comments.findOne({ where: { id } });
    if (!c) throw new NotFoundException('Comment not found');
    c.status = status as CommentStatus;
    return this.comments.save(c);
  }

  async remove(id: number): Promise<{ ok: true }> {
    const c = await this.comments.findOne({ where: { id } });
    if (!c) throw new NotFoundException('Comment not found');
    await this.comments.remove(c);
    return { ok: true };
  }
}
