import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  Req,
  ServiceUnavailableException,
} from '@nestjs/common';
import type { Request } from 'express';
import { DataSource } from 'typeorm';
import { CmsService } from './cms.service';
import { ArticlesService } from './articles.service';
import { AnalyticsService } from './analytics.service';
import { LeadsService } from './leads.service';
import { CommentsService } from './comments.service';
import { ServerStatusService } from './status.service';
import { CreateCommentDto, CreateLeadDto, ViewEventDto } from './dto';

function clientMeta(req: Request) {
  const xff = req.headers['x-forwarded-for'];
  const ip =
    (typeof xff === 'string' ? xff.split(',')[0].trim() : undefined) ??
    req.socket?.remoteAddress ??
    undefined;
  const userAgent = (req.headers['user-agent'] as string) ?? undefined;
  const country = (req.headers['cf-ipcountry'] as string) ?? undefined;
  return { ip, userAgent, country };
}

@Controller('public')
export class CmsPublicController {
  constructor(
    private readonly cms: CmsService,
    private readonly articles: ArticlesService,
    private readonly analytics: AnalyticsService,
    private readonly leads: LeadsService,
    private readonly comments: CommentsService,
    private readonly status: ServerStatusService,
    private readonly db: DataSource,
  ) {}

  /** Liveness incl. the database (docker healthcheck + monitoring). 503 when the DB cannot answer in 3 s. */
  @Get('health')
  async health() {
    const t = Date.now();
    try {
      await Promise.race([
        this.db.query('SELECT 1'),
        new Promise((_r, reject) => setTimeout(() => reject(new Error('db timeout')), 3000)),
      ]);
      return { ok: true, dbMs: Date.now() - t };
    } catch (e) {
      throw new ServiceUnavailableException({ ok: false, db: e instanceof Error ? e.message : 'db error' });
    }
  }

  @Get('settings')
  async settings() {
    return { settings: await this.cms.getSettings() };
  }

  @Get('server-status')
  serverStatus() {
    return this.status.getStatus();
  }

  @Get('status-page')
  statusPage() {
    return this.status.getStatusPage();
  }

  @Get('home')
  async home() {
    return { home: await this.cms.getHome() };
  }

  @Get('articles')
  articles_list(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('category') category?: string,
    @Query('tag') tag?: string,
    @Query('sort') sort?: string,
  ) {
    return this.articles.listPublic({
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      category,
      tag,
      sort,
    });
  }

  @Get('articles/:slug')
  async article(@Param('slug') slug: string) {
    return { article: await this.articles.getPublicBySlug(slug) };
  }

  @Get('articles/:slug/related')
  async related(@Param('slug') slug: string, @Query('limit') limit?: string) {
    return { items: await this.articles.related(slug, limit ? parseInt(limit, 10) : 4) };
  }

  @Post('articles/:slug/view')
  @HttpCode(HttpStatus.OK)
  view(@Param('slug') slug: string, @Body() dto: ViewEventDto, @Req() req: Request) {
    return this.analytics.recordView(slug, dto, clientMeta(req));
  }

  @Get('articles/:slug/comments')
  comments_list(@Param('slug') slug: string) {
    return this.comments.listPublic(slug);
  }

  @Post('articles/:slug/comments')
  @HttpCode(HttpStatus.CREATED)
  createComment(
    @Param('slug') slug: string,
    @Body() dto: CreateCommentDto,
    @Req() req: Request,
  ) {
    return this.comments.createPublic(slug, dto, clientMeta(req));
  }

  @Get('categories')
  async categories() {
    return { items: await this.articles.listCategories() };
  }

  @Post('leads')
  @HttpCode(HttpStatus.CREATED)
  createLead(@Body() dto: CreateLeadDto, @Req() req: Request) {
    return this.leads.create(dto, clientMeta(req));
  }
}
