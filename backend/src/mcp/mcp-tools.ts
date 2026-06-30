import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { generateArticleDraft } from '../ai/article-draft';
import type { AiService } from '../ai/ai.service';
import type { IntegrationsService } from '../ai/integrations.service';
import type { ArticlesService } from '../cms/articles.service';
import type { PromotionsService } from '../cms/promotions.service';
import type { CouponsService } from '../cms/coupons.service';
import type { LeadsService } from '../cms/leads.service';
import type { CommentsService } from '../cms/comments.service';
import type { CmsService } from '../cms/cms.service';
import type { ServerStatusService } from '../cms/status.service';

export interface McpDeps {
  ai: AiService;
  integrations: IntegrationsService;
  articles: ArticlesService;
  promotions: PromotionsService;
  coupons: CouponsService;
  leads: LeadsService;
  comments: CommentsService;
  cms: CmsService;
  status: ServerStatusService;
}

const ADMIN_EDIT = 'https://pmndigital.co/admin';

/** Read the authenticated admin's userId injected by requireBearerAuth → AuthInfo.extra. */
function uid(extra: unknown): number | null {
  const v = (extra as { authInfo?: { extra?: Record<string, unknown> } })?.authInfo?.extra?.userId;
  return typeof v === 'number' ? v : null;
}

const text = (s: string) => ({ content: [{ type: 'text' as const, text: s }] });
const json = (v: unknown) => text(JSON.stringify(v, null, 2));

/** Build a fresh MCP server exposing the PMN Digital tool catalog (Full Option). */
export function buildMcpServer(deps: McpDeps): McpServer {
  const server = new McpServer({ name: 'pmndigital', version: '1.0.0' });
  const reg = server.registerTool.bind(server);

  /* ---------------- meta / AI ---------------- */
  reg(
    'list_ai_providers',
    { title: 'รายการผู้ให้บริการ AI', description: 'ผู้ให้บริการ AI ที่ตั้งค่าไว้ + สถานะการเชื่อมต่อ', inputSchema: {} },
    async () => json(await deps.integrations.listStatus()),
  );
  reg(
    'ai_health',
    { title: 'ตรวจสถานะ AI', description: 'ตรวจว่า Claude/Gemini พร้อมใช้งานฝั่งเซิร์ฟเวอร์หรือไม่', inputSchema: {} },
    async () => json({ anthropic: await deps.ai.anthropicReady(), gemini: await deps.ai.geminiReady() }),
  );

  /* ---------------- content ---------------- */
  reg(
    'draft_article',
    {
      title: 'ร่างบทความด้วย Claude',
      description: 'ร่างบทความภาษาไทยจากหัวข้อ (Claude) — คืน Markdown ไม่บันทึกลงระบบ',
      inputSchema: {
        topic: z.string().describe('หัวข้อ/ประเด็น'),
        tone: z.string().optional().describe('โทน เช่น มืออาชีพ/เป็นกันเอง'),
        words: z.number().optional().describe('ความยาวโดยประมาณ (คำ)'),
      },
    },
    async ({ topic, tone, words }) =>
      text(
        await deps.ai.generateText({
          system:
            "คุณเป็นนักเขียนคอนเทนต์การตลาดของ PMN Digital เขียนภาษาไทยที่เป็นธรรมชาติ ไม่ใส่ช่องไฟแปลก ๆ และไม่ดูเป็น AI",
          prompt: `เขียนร่างบทความเรื่อง "${topic}"${tone ? ` โทน ${tone}` : ''} ประมาณ ${
            words ?? 600
          } คำ มีหัวเรื่อง เกริ่นนำ หัวข้อย่อย และบทสรุป ตอบเป็น Markdown`,
          maxTokens: 4000,
        }),
      ),
  );

  reg(
    'write_and_publish_article',
    {
      title: 'เขียน + บันทึกบทความ (ฉบับร่าง)',
      description:
        'ให้ Claude เขียนบทความฉบับเต็มจากหัวข้อ (ออปชัน: สร้างภาพปกด้วย Gemini) แล้วบันทึกเป็น "ฉบับร่าง (DRAFT)" ในระบบ คืนลิงก์แก้ไข',
      inputSchema: {
        topic: z.string().describe('หัวข้อบทความ'),
        withCover: z.boolean().optional().describe('สร้างภาพปกด้วย Gemini ด้วยหรือไม่ (ค่าเริ่มต้น false)'),
        categoryId: z.number().optional().describe('id หมวดหมู่ (ถ้ามี)'),
        tone: z.string().optional(),
        words: z.number().optional().describe('ความยาวโดยประมาณ (ค่าเริ่มต้น 700)'),
      },
    },
    async ({ topic, withCover, categoryId, tone, words }, extra) => {
      const d = await generateArticleDraft(deps.ai, { topic, tone, words });
      let coverImageUrl: string | undefined;
      if (withCover && (await deps.ai.geminiReady())) {
        try {
          const img = await deps.ai.generateImageToDrive(
            `Professional blog cover illustration for an article titled "${d.title}", modern, clean, corporate, no text`,
          );
          coverImageUrl = img.url;
        } catch {
          /* cover optional */
        }
      }
      const article = await deps.articles.create(
        {
          title: d.title,
          slug: d.slug,
          excerpt: d.excerpt,
          bodyMarkdown: d.bodyMarkdown,
          coverImageUrl,
          status: 'DRAFT',
          categoryId: categoryId ?? undefined,
          tags: d.tags,
          metaTitle: d.metaTitle,
          metaDesc: d.metaDesc,
        },
        uid(extra),
      );
      return json({
        ok: true,
        id: article.id,
        slug: article.slug,
        status: article.status,
        coverImageUrl: coverImageUrl ?? null,
        editUrl: `${ADMIN_EDIT}/articles`,
        note: 'บันทึกเป็นฉบับร่างแล้ว — ตรวจทานและกดเผยแพร่ที่หน้าแอดมิน',
      });
    },
  );

  reg(
    'list_articles',
    {
      title: 'รายการบทความ',
      description: 'ดูบทความทั้งหมด (กรองสถานะ/ค้นหาได้)',
      inputSchema: {
        status: z.enum(['DRAFT', 'PUBLISHED']).optional(),
        q: z.string().optional().describe('คำค้น'),
        limit: z.number().optional(),
        page: z.number().optional(),
      },
    },
    async ({ status, q, limit, page }) => json(await deps.articles.listAll({ status, q, limit, page })),
  );

  reg(
    'set_article_status',
    {
      title: 'เปลี่ยนสถานะบทความ (เผยแพร่/ถอน)',
      description: 'ตั้งสถานะบทความเป็น PUBLISHED (เผยแพร่) หรือ DRAFT (ถอนกลับเป็นร่าง)',
      inputSchema: { id: z.number().describe('id บทความ'), status: z.enum(['DRAFT', 'PUBLISHED']) },
    },
    async ({ id, status }) => {
      const a = await deps.articles.getOne(id);
      await deps.articles.update(id, {
        title: a.title,
        slug: a.slug,
        excerpt: a.excerpt ?? undefined,
        bodyMarkdown: a.bodyMarkdown,
        coverImageUrl: a.coverImageUrl ?? undefined,
        status,
        categoryId: a.categoryId ?? undefined,
        tags: a.tags,
        metaTitle: a.metaTitle ?? undefined,
        metaDesc: a.metaDesc ?? undefined,
        canonicalUrl: a.canonicalUrl ?? undefined,
      });
      return json({ ok: true, id, status });
    },
  );

  reg(
    'list_article_categories',
    { title: 'หมวดหมู่บทความ', description: 'รายการหมวดหมู่บทความทั้งหมด', inputSchema: {} },
    async () => json(await deps.articles.listCategories()),
  );

  /* ---------------- media ---------------- */
  reg(
    'generate_image',
    {
      title: 'สร้างภาพด้วย Gemini',
      description: 'สร้างภาพจากคำอธิบายด้วย Gemini (Imagen) แล้วอัปโหลดขึ้น PMN Drive — คืน URL บน CDN',
      inputSchema: { prompt: z.string().describe('คำอธิบายภาพ (ภาษาอังกฤษมักได้ผลดีที่สุด)') },
    },
    async ({ prompt }) => text((await deps.ai.generateImageToDrive(prompt)).url),
  );

  /* ---------------- marketing ---------------- */
  reg(
    'list_promotions',
    { title: 'รายการโปรโมชั่น', description: 'โปรโมชั่นทั้งหมด + สถานะ live', inputSchema: {} },
    async () => json(await deps.promotions.listAll()),
  );
  reg(
    'create_promotion',
    {
      title: 'สร้างโปรโมชั่น (ปิดไว้ก่อน)',
      description: 'สร้างโปรโมชั่นใหม่ (ยังไม่เปิดแสดง — ใช้ set_promotion_state เพื่อเปิด)',
      inputSchema: {
        title: z.string(),
        subtitle: z.string().optional(),
        description: z.string().optional(),
        badge: z.string().optional(),
        discountType: z.enum(['PERCENT', 'FIXED', 'BUNDLE', 'FREE', 'OTHER']).optional(),
        discountValue: z.number().optional(),
        ctaText: z.string().optional(),
        ctaUrl: z.string().optional(),
        couponCode: z.string().optional(),
      },
    },
    async (a) => {
      const p = await deps.promotions.create({
        title: a.title,
        subtitle: a.subtitle,
        description: a.description,
        badge: a.badge,
        discountType: a.discountType,
        discountValue: a.discountValue,
        ctaText: a.ctaText,
        ctaUrl: a.ctaUrl,
        couponCode: a.couponCode,
      });
      return json({ ok: true, id: p.id, note: 'สร้างแล้ว (ปิดอยู่) — เปิดด้วย set_promotion_state' });
    },
  );
  reg(
    'set_promotion_state',
    {
      title: 'เปิด/ปิดโปรโมชั่น',
      description: 'ตั้งสถานะแสดงผล (active) และโปรเด็ด (featured) ของโปรโมชั่น',
      inputSchema: { id: z.number(), active: z.boolean().optional(), featured: z.boolean().optional() },
    },
    async ({ id, active, featured }) => json(await deps.promotions.setState(id, { active, featured })),
  );
  reg(
    'list_coupons',
    { title: 'รายการคูปอง', description: 'คูปองทั้งหมด + จำนวนคงเหลือ', inputSchema: {} },
    async () => json(await deps.coupons.listAll()),
  );
  reg(
    'create_coupon',
    {
      title: 'สร้างคูปอง',
      description: 'สร้างคูปองส่วนลด (จำกัดจำนวนได้)',
      inputSchema: {
        code: z.string().describe('รหัสคูปอง A-Z 0-9 _ - (2-40 ตัว)'),
        description: z.string().optional(),
        discountType: z.enum(['PERCENT', 'FIXED']),
        discountValue: z.number(),
        maxRedemptions: z.number().optional().describe('จำนวนสิทธิ์รวม'),
        perEmailLimit: z.number().optional(),
        active: z.boolean().optional(),
      },
    },
    async (a) => {
      const c = await deps.coupons.create({
        code: a.code,
        description: a.description,
        discountType: a.discountType,
        discountValue: a.discountValue,
        maxRedemptions: a.maxRedemptions,
        perEmailLimit: a.perEmailLimit,
        active: a.active,
      });
      return json({ ok: true, id: c.id, code: c.code });
    },
  );
  reg(
    'coupon_redemptions',
    { title: 'การใช้คูปอง', description: 'ดูประวัติการใช้คูปองตาม id', inputSchema: { couponId: z.number() } },
    async ({ couponId }) => json(await deps.coupons.listRedemptions(couponId)),
  );

  /* ---------------- leads ---------------- */
  reg(
    'list_leads',
    {
      title: 'รายชื่อผู้ติดต่อ (Leads)',
      description: 'ดู leads (กรองชนิด/สถานะได้)',
      inputSchema: {
        type: z.enum(['REGISTER', 'CONTACT']).optional(),
        status: z.enum(['NEW', 'CONTACTED', 'CLOSED']).optional(),
        limit: z.number().optional(),
        page: z.number().optional(),
      },
    },
    async ({ type, status, limit, page }) => json(await deps.leads.list({ type, status, limit, page })),
  );
  reg(
    'update_lead_status',
    {
      title: 'อัปเดตสถานะ Lead',
      description: 'เปลี่ยนสถานะ lead เป็น NEW / CONTACTED / CLOSED',
      inputSchema: { id: z.number(), status: z.enum(['NEW', 'CONTACTED', 'CLOSED']) },
    },
    async ({ id, status }) => json(await deps.leads.setStatus(id, status)),
  );
  reg(
    'lead_insights',
    {
      title: 'วิเคราะห์ Leads ด้วย Claude',
      description: 'สรุปเทรนด์/ลูกค้าน่าสนใจจาก leads ล่าสุดด้วย Claude',
      inputSchema: { limit: z.number().optional().describe('จำนวน leads ที่นำมาวิเคราะห์ (ค่าเริ่มต้น 100)') },
    },
    async ({ limit }) => {
      const data = await deps.leads.list({ limit: limit ?? 100, page: 1 });
      const summary = await deps.ai.generateText({
        system: 'คุณเป็นนักวิเคราะห์การตลาด สรุปเป็นภาษาไทย กระชับ เป็นหัวข้อ',
        prompt: `วิเคราะห์ข้อมูล leads ต่อไปนี้: เทรนด์, ชนิดที่เข้ามามาก, ลูกค้าที่ควรรีบติดตาม, ข้อเสนอแนะ\n\n${JSON.stringify(
          data,
        ).slice(0, 12000)}`,
        maxTokens: 2000,
      });
      return text(summary);
    },
  );

  /* ---------------- comments ---------------- */
  reg(
    'list_pending_comments',
    {
      title: 'คอมเมนต์รอตรวจ',
      description: 'รายการความคิดเห็นที่รอการอนุมัติ',
      inputSchema: { limit: z.number().optional() },
    },
    async ({ limit }) => json(await deps.comments.listAdmin({ status: 'PENDING', limit: limit ?? 50, page: 1 })),
  );
  reg(
    'moderate_comment',
    {
      title: 'จัดการคอมเมนต์',
      description: 'อนุมัติ (approve), ปฏิเสธ (reject) หรือลบ (delete) ความคิดเห็น',
      inputSchema: { id: z.number(), action: z.enum(['approve', 'reject', 'delete']) },
    },
    async ({ id, action }) => {
      if (action === 'delete') return json(await deps.comments.remove(id));
      return json(await deps.comments.setStatus(id, action === 'approve' ? 'APPROVED' : 'REJECTED'));
    },
  );

  /* ---------------- site ---------------- */
  reg(
    'get_site_settings',
    { title: 'ตั้งค่าเว็บไซต์', description: 'อ่านการตั้งค่าเว็บไซต์ปัจจุบัน', inputSchema: {} },
    async () => json(await deps.cms.getSettings()),
  );
  reg(
    'get_home_content',
    { title: 'เนื้อหาหน้าหลัก', description: 'อ่านเนื้อหา/บล็อกของหน้าหลัก', inputSchema: {} },
    async () => json(await deps.cms.getHome()),
  );
  reg(
    'get_server_status',
    { title: 'สถานะเซิร์ฟเวอร์', description: 'สถานะระบบ/ความปลอดภัย/สแต็ก', inputSchema: {} },
    async () => json(await deps.status.getStatus()),
  );

  return server;
}
