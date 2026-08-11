import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { createHash } from 'node:crypto';
import { Article, PageView } from './entities';
import { livePublicWhere } from './articles.service';
import { ViewEventDto } from './dto';

const SITE_HOST = 'pmndigital.co';
const SALT = process.env.ANALYTICS_SALT || 'pmn-analytics';

/**
 * UA-based bot detection (curated regex). The view beacon only fires after
 * client JS runs, so non-JS crawlers never reach here at all; this flags the
 * JS-capable declared bots (Googlebot render, headless, monitors, previewers).
 * Swap for the `isbot` library later if a broader list is needed.
 */
const BOT_RE =
  /bot|crawl|spider|slurp|mediapartners|facebookexternalhit|facebot|ia_archiver|bingpreview|feedfetcher|scrapy|curl|wget|python-requests|axios|node-fetch|go-http|java\/|okhttp|headless|phantomjs|puppeteer|playwright|lighthouse|gtmetrix|pingdom|uptimerobot|monitoring|semrush|ahrefs|mj12|dotbot|petalbot|yandex|baidu|duckduck|applebot|googlebot|bingbot|preview|whatsapp|telegram|discord|embedly|vkshare|validator|archive\.org/i;

function isBotUA(ua?: string | null): boolean {
  if (!ua || ua.trim().length < 3) return true; // empty/tiny UA ~ script/bot
  return BOT_RE.test(ua);
}

function hostOf(url?: string | null): string | null {
  if (!url) return null;
  try {
    return new URL(url).hostname.replace(/^www\./, '').toLowerCase();
  } catch {
    return null;
  }
}

export type ViewSource = 'direct' | 'organic' | 'social' | 'referral' | 'internal' | 'campaign';

function deriveSource(
  referrer?: string | null,
  utmSource?: string | null,
): { source: ViewSource; referrerHost: string | null } {
  if (utmSource && utmSource.trim()) return { source: 'campaign', referrerHost: hostOf(referrer) };
  const host = hostOf(referrer);
  if (!host) return { source: 'direct', referrerHost: null };
  if (host === SITE_HOST || host.endsWith('.' + SITE_HOST)) return { source: 'internal', referrerHost: host };
  if (/google|bing|duckduckgo|yahoo|baidu|yandex|ecosia|qwant|brave/.test(host))
    return { source: 'organic', referrerHost: host };
  if (/facebook|fb\.com|instagram|t\.co|twitter|x\.com|line|lin\.ee|youtube|linkedin|tiktok|pinterest|reddit/.test(host))
    return { source: 'social', referrerHost: host };
  return { source: 'referral', referrerHost: host };
}

function normCountry(c?: string | null): string | null {
  if (!c) return null;
  const s = c.trim().toUpperCase();
  if (s.length !== 2 || s === 'XX' || s === 'T1') return null;
  return s;
}

function hashIp(ip?: string | null): string | null {
  if (!ip) return null;
  return createHash('sha256').update(SALT + '|' + ip).digest('hex').slice(0, 32);
}

export interface TrafficBreakdown {
  days: number;
  total: number;
  human: number;
  bot: number;
  sources: { key: string; count: number }[];
  countries: { key: string; count: number }[];
  referrers: { key: string; count: number }[];
}

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(PageView) private readonly views: Repository<PageView>,
    @InjectRepository(Article) private readonly articles: Repository<Article>,
  ) {}

  /** Record one view: classify bot, derive source/country, store event, bump viewCount. */
  async recordView(
    slug: string,
    dto: ViewEventDto,
    meta: { ip?: string; userAgent?: string; country?: string },
  ): Promise<{ viewCount: number }> {
    const a = await this.articles.findOne({
      where: livePublicWhere({ slug }),
      select: { id: true },
    });
    if (!a) return { viewCount: 0 };
    const { source, referrerHost } = deriveSource(dto.referrer, dto.utmSource);
    const pv = this.views.create({
      articleId: a.id,
      isBot: isBotUA(meta.userAgent),
      source,
      referrerHost,
      utmSource: dto.utmSource ? dto.utmSource.slice(0, 120) : null,
      country: normCountry(meta.country),
      ipHash: hashIp(meta.ip),
      userAgent: meta.userAgent ? meta.userAgent.slice(0, 512) : null,
    });
    await this.views.save(pv);
    await this.articles.increment({ id: a.id }, 'viewCount', 1);
    const fresh = await this.articles.findOne({ where: { id: a.id }, select: { viewCount: true } });
    return { viewCount: fresh?.viewCount ?? 0 };
  }

  /** Per-article daily HUMAN view counts for the last `days` days (oldest→newest). */
  async sparklines(days = 30): Promise<Record<number, number[]>> {
    const n = Math.min(90, Math.max(7, days || 30));
    const rows: { articleId: number; ago: number; c: number }[] = await this.views.query(
      `SELECT "articleId",
              floor(extract(epoch from (now() - "createdAt")) / 86400)::int AS ago,
              count(*)::int AS c
       FROM "PageView"
       WHERE "createdAt" >= now() - ($1 * interval '1 day') AND NOT "isBot"
       GROUP BY "articleId", ago`,
      [n],
    );
    const out: Record<number, number[]> = {};
    for (const r of rows) {
      const ago = Number(r.ago);
      const i = n - 1 - ago;
      if (i < 0 || i >= n) continue;
      if (!out[r.articleId]) out[r.articleId] = new Array(n).fill(0);
      out[r.articleId][i] = Number(r.c) || 0;
    }
    return out;
  }

  /** Traffic breakdown (human/bot totals + top sources/countries/referrers). */
  async traffic(days = 30, slug?: string): Promise<TrafficBreakdown> {
    const n = Math.min(90, Math.max(1, days || 30));
    let articleId: number | null = null;
    if (slug) {
      const a = await this.articles.findOne({ where: { slug }, select: { id: true } });
      articleId = a?.id ?? -1;
    }
    const where =
      `"createdAt" >= now() - ($1 * interval '1 day')` + (articleId !== null ? ` AND "articleId" = $2` : '');
    const params: unknown[] = articleId !== null ? [n, articleId] : [n];

    const totals: { total: number; human: number; bot: number }[] = await this.views.query(
      `SELECT count(*)::int AS total,
              count(*) FILTER (WHERE NOT "isBot")::int AS human,
              count(*) FILTER (WHERE "isBot")::int AS bot
       FROM "PageView" WHERE ${where}`,
      params,
    );
    const grouped = async (col: string, extra = '') =>
      (await this.views.query(
        `SELECT ${col} AS key, count(*)::int AS count FROM "PageView"
         WHERE ${where} AND NOT "isBot" ${extra} GROUP BY ${col} ORDER BY count DESC LIMIT 8`,
        params,
      )) as { key: string; count: number }[];

    const sources = await grouped('source');
    const countries = await grouped('country', 'AND country IS NOT NULL');
    const referrers = await grouped('"referrerHost"', 'AND "referrerHost" IS NOT NULL');

    const t = totals[0] || { total: 0, human: 0, bot: 0 };
    const num = (rows: { key: string; count: number }[]) =>
      rows.map((r) => ({ key: r.key, count: Number(r.count) || 0 }));
    return {
      days: n,
      total: Number(t.total) || 0,
      human: Number(t.human) || 0,
      bot: Number(t.bot) || 0,
      sources: num(sources),
      countries: num(countries),
      referrers: num(referrers),
    };
  }
}
