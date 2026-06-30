import { randomBytes } from 'node:crypto';
import type { AiService } from './ai.service';

/** Best-effort slug from a title (allows a-z 0-9 Thai + hyphen) with a uniqueness suffix. */
export function slugify(title: string): string {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9฀-๿]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 140);
  return `${base || 'article'}-${randomBytes(3).toString('hex')}`;
}

/** Extract the first JSON object from a possibly fenced/whitespaced LLM reply. */
export function parseJsonLoose(raw: string): Record<string, unknown> | null {
  const fence = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  const body = fence ? fence[1] : raw;
  const a = body.indexOf('{');
  const b = body.lastIndexOf('}');
  if (a >= 0 && b > a) {
    try {
      return JSON.parse(body.slice(a, b + 1)) as Record<string, unknown>;
    } catch {
      /* fall through */
    }
  }
  return null;
}

export interface DraftedArticle {
  title: string;
  slug: string;
  excerpt?: string;
  bodyMarkdown: string;
  tags?: string[];
  metaTitle?: string;
  metaDesc?: string;
}

/** Ask Claude for a full article as JSON and normalize it into ArticleDto-shaped fields. */
export async function generateArticleDraft(
  ai: AiService,
  opts: { topic: string; tone?: string; words?: number },
): Promise<DraftedArticle> {
  const raw = await ai.generateText({
    system: 'คุณเป็นบรรณาธิการคอนเทนต์ของ PMN Digital ตอบกลับเป็น JSON เท่านั้น ไม่ต้องมีคำอธิบายนอก JSON',
    prompt:
      `เขียนบทความภาษาไทยเรื่อง "${opts.topic}"${opts.tone ? ` โทน ${opts.tone}` : ''} ประมาณ ${
        opts.words ?? 700
      } คำ ` +
      `ตอบเป็น JSON object ที่มี key: title (พาดหัว), excerpt (สรุปสั้น ≤300 ตัวอักษร), bodyMarkdown (เนื้อหา Markdown เต็ม), ` +
      `tags (อาเรย์ของคำ ≤6 คำ), metaTitle (≤60 ตัวอักษร), metaDesc (≤155 ตัวอักษร), keyphrase (คีย์เวิร์ดหลัก)`,
    maxTokens: 6000,
  });
  const j = parseJsonLoose(raw) ?? {};
  const title = (typeof j.title === 'string' && j.title.trim()) || opts.topic;
  return {
    title: String(title).slice(0, 200),
    slug: slugify(String(title)),
    excerpt: typeof j.excerpt === 'string' ? j.excerpt.slice(0, 400) : undefined,
    bodyMarkdown: typeof j.bodyMarkdown === 'string' ? j.bodyMarkdown : raw,
    tags: Array.isArray(j.tags) ? (j.tags as unknown[]).map(String).slice(0, 8) : undefined,
    metaTitle: typeof j.metaTitle === 'string' ? j.metaTitle.slice(0, 200) : undefined,
    metaDesc: typeof j.metaDesc === 'string' ? j.metaDesc.slice(0, 400) : undefined,
  };
}
