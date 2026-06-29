import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  Query,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Request } from 'express';
import { AdminGuard } from './admin.guard';
import { CmsService } from './cms.service';
import { ArticlesService } from './articles.service';
import { LeadsService } from './leads.service';
import { CommentsService } from './comments.service';
import { MailService } from '../mail/mail.service';
import {
  ArticleDto,
  CategoryDto,
  CommentStatusDto,
  LeadStatusDto,
  TestMailDto,
  UpdateHomeDto,
  UpdateSettingsDto,
} from './dto';

function userId(req: Request): number | null {
  const raw = req.headers['x-user-id'];
  const id = parseInt(typeof raw === 'string' ? raw : '', 10);
  return Number.isFinite(id) && id > 0 ? id : null;
}

@Controller('admin')
@UseGuards(AdminGuard)
export class CmsAdminController {
  constructor(
    private readonly cms: CmsService,
    private readonly articles: ArticlesService,
    private readonly leads: LeadsService,
    private readonly comments: CommentsService,
    private readonly mail: MailService,
  ) {}

  /* settings */
  @Get('settings')
  async getSettings() {
    return { settings: await this.cms.getSettings() };
  }
  @Put('settings')
  async putSettings(@Body() dto: UpdateSettingsDto) {
    return { settings: await this.cms.updateSettings(dto) };
  }

  /* home */
  @Get('home')
  async getHome() {
    return { home: await this.cms.getHome() };
  }
  @Put('home')
  async putHome(@Body() dto: UpdateHomeDto) {
    return { home: await this.cms.updateHome(dto) };
  }

  /* articles */
  @Get('articles')
  listArticles(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
    @Query('q') q?: string,
  ) {
    return this.articles.listAll({
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      status,
      q,
    });
  }
  @Get('articles/:id')
  async getArticle(@Param('id', ParseIntPipe) id: number) {
    return { article: await this.articles.getOne(id) };
  }
  @Post('articles')
  async createArticle(@Body() dto: ArticleDto, @Req() req: Request) {
    return { article: await this.articles.create(dto, userId(req)) };
  }
  @Patch('articles/:id')
  async updateArticle(@Param('id', ParseIntPipe) id: number, @Body() dto: ArticleDto) {
    return { article: await this.articles.update(id, dto) };
  }
  @Delete('articles/:id')
  deleteArticle(@Param('id', ParseIntPipe) id: number) {
    return this.articles.remove(id);
  }

  /* categories */
  @Get('categories')
  async listCategories() {
    return { items: await this.articles.listCategories() };
  }
  @Post('categories')
  async createCategory(@Body() dto: CategoryDto) {
    return { category: await this.articles.createCategory(dto) };
  }

  /* comments (moderation) */
  @Get('comments')
  listComments(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
  ) {
    return this.comments.listAdmin({
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      status,
    });
  }
  @Get('comments/pending-count')
  pendingComments() {
    return this.comments.pendingCount();
  }
  @Patch('comments/:id')
  async setCommentStatus(@Param('id', ParseIntPipe) id: number, @Body() dto: CommentStatusDto) {
    return { comment: await this.comments.setStatus(id, dto.status) };
  }
  @Delete('comments/:id')
  deleteComment(@Param('id', ParseIntPipe) id: number) {
    return this.comments.remove(id);
  }

  /* leads */
  @Get('leads')
  listLeads(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('type') type?: string,
    @Query('status') status?: string,
  ) {
    return this.leads.list({
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      type,
      status,
    });
  }
  @Patch('leads/:id')
  async setLeadStatus(@Param('id', ParseIntPipe) id: number, @Body() dto: LeadStatusDto) {
    return { lead: await this.leads.setStatus(id, dto.status) };
  }
  @Delete('leads/:id')
  deleteLead(@Param('id', ParseIntPipe) id: number) {
    return this.leads.remove(id);
  }

  /* mail / notifications */
  @Get('mail/status')
  mailStatus() {
    return this.mail.status();
  }
  @Post('mail/test')
  sendTestMail(@Body() dto: TestMailDto) {
    return this.mail.sendTest(dto.to);
  }

  /* media library */
  @Post('media')
  @UseInterceptors(FileInterceptor('file'))
  uploadMedia(@UploadedFile() file: Express.Multer.File | undefined) {
    if (!file) throw new BadRequestException('file missing');
    return this.cms.saveImage({
      buffer: file.buffer,
      mimetype: file.mimetype,
      size: file.size,
    });
  }
  @Get('media/list')
  listMedia() {
    return this.cms.listMedia();
  }
  @Delete('media/:filename')
  deleteMedia(@Param('filename') filename: string) {
    return this.cms.deleteMedia(filename);
  }
}
