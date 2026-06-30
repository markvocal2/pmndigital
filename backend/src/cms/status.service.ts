import { Injectable, Logger } from '@nestjs/common';

export interface ServerStatus {
  operational: boolean;
  uptimePct: number; // 0–100, 30-day availability
  responseMs: number; // REAL http round-trip to own public API (incl. DB read)
  days: number[]; // 7 daily availability % (0–100)
  updatedAt: string;
  // performance — benefit-framed headroom (NOT raw load)
  cpuHeadroomPct: number; // % CPU idle = spare capacity
  memHeadroomPct: number; // % memory available = spare capacity
  // scale
  servicesHealthy: number;
  servicesTotal: number;
  continuousDays: number; // host uptime in days
  // security & backup
  backupOk: boolean;
  backupAgeHours: number | null; // hours since last successful backup
  backupStacks: number; // number of stacks backed up
  threatsBlocked: number; // cumulative blocked IPs + auth bans
}

/* ---------------- public status page (status.claude.com style) ---------------- */
export type StatusLevel = 'operational' | 'degraded' | 'partial' | 'major' | 'maintenance';
export interface StatusDay {
  t: number; // unix seconds (day)
  uptime: number | null; // 0–100, null = no data yet
}
export interface StatusComponent {
  key: string;
  name: string;
  description: string;
  status: StatusLevel;
  uptimePct: number | null; // avg over available days
  responseMs?: number;
  days: StatusDay[]; // up to windowDays, oldest→newest
}
export interface StatusIncident {
  date: string; // YYYY-MM-DD
  component: string;
  uptime: number;
}
export interface StatusPage {
  overall: StatusLevel;
  components: StatusComponent[];
  incidents: StatusIncident[];
  windowDays: number;
  updatedAt: string;
}

/**
 * Reads ONLY high-level, benefit-framed health from Prometheus (internal, proxy-net).
 * Public endpoint exposes nothing sensitive — no raw load totals, IPs, hostnames or container names.
 */
@Injectable()
export class ServerStatusService {
  private readonly logger = new Logger('ServerStatusService');
  private readonly prom = process.env.PROMETHEUS_URL || 'http://prometheus:9090';
  private cache: { at: number; data: ServerStatus } | null = null;
  private readonly TTL = 15000;

  async getStatus(): Promise<ServerStatus> {
    const now = Date.now();
    if (this.cache && now - this.cache.at < this.TTL) return this.cache.data;
    const data = await this.compute();
    this.cache = { at: now, data };
    return data;
  }

  private async query(promql: string, timeoutMs = 4000): Promise<number | null> {
    try {
      const r = await fetch(`${this.prom}/api/v1/query?query=${encodeURIComponent(promql)}`, {
        signal: AbortSignal.timeout(timeoutMs),
      });
      if (!r.ok) return null;
      const j = (await r.json()) as { data?: { result?: { value?: [number, string] }[] } };
      const v = j?.data?.result?.[0]?.value?.[1];
      return v != null && Number.isFinite(Number(v)) ? Number(v) : null;
    } catch {
      return null;
    }
  }

  private async queryRange(promql: string, start: number, end: number, step: number): Promise<number[]> {
    try {
      const url = `${this.prom}/api/v1/query_range?query=${encodeURIComponent(promql)}&start=${start}&end=${end}&step=${step}`;
      const r = await fetch(url, { signal: AbortSignal.timeout(5000) });
      if (!r.ok) return [];
      const j = (await r.json()) as { data?: { result?: { values?: [number, string][] }[] } };
      const values = j?.data?.result?.[0]?.values ?? [];
      return values.map((p) => Number(p[1])).filter((n) => Number.isFinite(n));
    } catch {
      return [];
    }
  }

  /** Real end-to-end latency: time a round-trip to our own public API (median of 3). */
  private async probeResponseMs(): Promise<number> {
    const port = process.env.PORT || '3001';
    const url = `http://localhost:${port}/api/public/settings`;
    const samples: number[] = [];
    for (let i = 0; i < 3; i++) {
      const t = Date.now();
      try {
        const r = await fetch(url, { signal: AbortSignal.timeout(3000) });
        await r.text();
        samples.push(Date.now() - t);
      } catch {
        /* skip */
      }
    }
    if (!samples.length) return 0;
    samples.sort((a, b) => a - b);
    return samples[Math.floor(samples.length / 2)];
  }

  private async compute(): Promise<ServerStatus> {
    const [
      responseMs,
      upRatio,
      uptime,
      cpuIdle,
      memAvail,
      healthy,
      total,
      uptimeDays,
      backupFailed,
      backupLast,
      backupStacks,
      threats,
      daysRaw,
    ] = await Promise.all([
      this.probeResponseMs(),
      this.query('count(up==1) / count(up)'),
      this.query('avg(avg_over_time(up[30d])) * 100'),
      this.query('avg(rate(node_cpu_seconds_total{mode="idle"}[5m])) * 100'),
      this.query('avg(node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes) * 100'),
      this.query('count(up==1)'),
      this.query('count(up)'),
      this.query('max((node_time_seconds - node_boot_time_seconds) / 86400)'),
      this.query('sum(backup_stacks_failed)'),
      this.query('max(backup_last_success_timestamp_seconds)'),
      this.query('max(backup_stacks_total)'),
      this.query('sum(security_ip_blocked) + sum(security_authentication_ban)'),
      this.queryRange(
        'avg(avg_over_time(up[1d])) * 100',
        Math.floor(Date.now() / 1000) - 7 * 86400,
        Math.floor(Date.now() / 1000),
        86400,
      ),
    ]);

    let days = daysRaw.map((v) => Math.round(v * 10) / 10);
    if (days.length > 7) days = days.slice(-7);
    const fill = uptime != null ? Math.round(uptime * 10) / 10 : 100;
    while (days.length < 7) days.unshift(days[0] ?? fill);

    const backupAgeHours =
      backupLast != null && backupLast > 0 ? Math.max(0, (Date.now() / 1000 - backupLast) / 3600) : null;

    return {
      operational: upRatio != null && upRatio >= 0.999,
      uptimePct: uptime != null ? Math.round(uptime * 100) / 100 : 0,
      responseMs,
      days,
      updatedAt: new Date().toISOString(),
      cpuHeadroomPct: cpuIdle != null ? Math.round(Math.min(100, Math.max(0, cpuIdle))) : 0,
      memHeadroomPct: memAvail != null ? Math.round(Math.min(100, Math.max(0, memAvail))) : 0,
      servicesHealthy: healthy != null ? Math.round(healthy) : 0,
      servicesTotal: total != null ? Math.round(total) : 0,
      continuousDays: uptimeDays != null ? Math.floor(uptimeDays) : 0,
      // "ok" requires BOTH no failures AND a recent successful run (stale metric must not show green)
      backupOk: (backupFailed ?? 0) === 0 && backupAgeHours != null && backupAgeHours < 36,
      backupAgeHours: backupAgeHours != null ? Math.round(backupAgeHours * 10) / 10 : null,
      backupStacks: backupStacks != null ? Math.round(backupStacks) : 0,
      threatsBlocked: threats != null ? Math.round(threats) : 0,
    };
  }

  /* ---------------- status page ---------------- */
  private pageCache: { at: number; data: StatusPage } | null = null;

  private async queryRangePairs(promql: string, start: number, end: number, step: number): Promise<[number, number][]> {
    try {
      const url = `${this.prom}/api/v1/query_range?query=${encodeURIComponent(promql)}&start=${start}&end=${end}&step=${step}`;
      const r = await fetch(url, { signal: AbortSignal.timeout(6000) });
      if (!r.ok) return [];
      const j = (await r.json()) as { data?: { result?: { values?: [number, string][] }[] } };
      const values = j?.data?.result?.[0]?.values ?? [];
      return values
        .map(([t, v]) => [Number(t), Number(v)] as [number, number])
        .filter(([, v]) => Number.isFinite(v));
    } catch {
      return [];
    }
  }

  /** `days` daily uptime% slots (oldest→newest); null where no data exists yet. */
  private async dailySeries(promql: string, days: number): Promise<StatusDay[]> {
    const end = Math.floor(Date.now() / 1000);
    const start = end - days * 86400;
    const pairs = await this.queryRangePairs(promql, start, end, 86400);
    const byDay = new Map<string, number>();
    for (const [t, v] of pairs) byDay.set(new Date(t * 1000).toISOString().slice(0, 10), v);
    const out: StatusDay[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const ts = end - i * 86400;
      const key = new Date(ts * 1000).toISOString().slice(0, 10);
      const v = byDay.get(key);
      out.push({ t: ts, uptime: v != null ? Math.round(v * 10) / 10 : null });
    }
    return out;
  }

  private avgUptime(days: StatusDay[]): number | null {
    const vals = days.map((d) => d.uptime).filter((v): v is number => v != null);
    if (!vals.length) return null;
    return Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 100) / 100;
  }

  private async probe(url: string): Promise<{ ok: boolean; ms: number }> {
    const t = Date.now();
    try {
      const r = await fetch(url, { signal: AbortSignal.timeout(4000) });
      await r.text();
      return { ok: r.ok, ms: Date.now() - t };
    } catch {
      return { ok: false, ms: 0 };
    }
  }

  async getStatusPage(): Promise<StatusPage> {
    const now = Date.now();
    if (this.pageCache && now - this.pageCache.at < 30000) return this.pageCache.data;
    const data = await this.computePage();
    this.pageCache = { at: now, data };
    return data;
  }

  private async computePage(): Promise<StatusPage> {
    const WINDOW = 90;
    const port = process.env.PORT || '3001';
    const feUrl = process.env.FRONTEND_PROBE_URL || 'http://frontend:3000/';
    const [nodeDays, stalwartDays, promDays, nodeUp, stalwartUp, promUp, webProbe, apiProbe] =
      await Promise.all([
        this.dailySeries('avg(avg_over_time(up{job="node"}[1d])) * 100', WINDOW),
        this.dailySeries('avg(avg_over_time(up{job="stalwart"}[1d])) * 100', WINDOW),
        this.dailySeries('avg(avg_over_time(up{job="prometheus"}[1d])) * 100', WINDOW),
        this.query('min(up{job="node"})'),
        this.query('min(up{job="stalwart"})'),
        this.query('min(up{job="prometheus"})'),
        this.probe(feUrl),
        this.probe(`http://localhost:${port}/api/public/settings`),
      ]);

    const lvl = (ok: boolean): StatusLevel => (ok ? 'operational' : 'major');

    const components: StatusComponent[] = [
      {
        key: 'website',
        name: 'เว็บไซต์ (Website)',
        description: 'หน้าเว็บหลักและบล็อก',
        status: lvl(webProbe.ok),
        uptimePct: this.avgUptime(nodeDays),
        responseMs: webProbe.ms || undefined,
        days: nodeDays,
      },
      {
        key: 'api',
        name: 'API & ฐานข้อมูล (API & Database)',
        description: 'ระบบหลังบ้าน ฟอร์มติดต่อ และฐานข้อมูล',
        status: lvl(apiProbe.ok),
        uptimePct: this.avgUptime(nodeDays),
        responseMs: apiProbe.ms || undefined,
        days: nodeDays,
      },
      {
        key: 'email',
        name: 'ระบบอีเมล (Email Delivery)',
        description: 'การส่งอีเมลและการแจ้งเตือน',
        status: lvl(stalwartUp != null && stalwartUp >= 1),
        uptimePct: this.avgUptime(stalwartDays),
        days: stalwartDays,
      },
      {
        key: 'infra',
        name: 'เซิร์ฟเวอร์ (Server Infrastructure)',
        description: 'เครื่องแม่ข่ายและทรัพยากรระบบ',
        status: lvl(nodeUp != null && nodeUp >= 1),
        uptimePct: this.avgUptime(nodeDays),
        days: nodeDays,
      },
      {
        key: 'monitoring',
        name: 'ระบบมอนิเตอร์ (Monitoring)',
        description: 'การเฝ้าระวังและเก็บเมตริก',
        status: lvl(promUp != null && promUp >= 1),
        uptimePct: this.avgUptime(promDays),
        days: promDays,
      },
    ];

    const order: StatusLevel[] = ['operational', 'maintenance', 'degraded', 'partial', 'major'];
    let overall: StatusLevel = 'operational';
    for (const c of components) if (order.indexOf(c.status) > order.indexOf(overall)) overall = c.status;

    // incidents derived from real dips (< 99.5%) on the distinct monitored series
    const incidentSeries: { name: string; days: StatusDay[] }[] = [
      { name: 'เซิร์ฟเวอร์ (Server Infrastructure)', days: nodeDays },
      { name: 'ระบบอีเมล (Email Delivery)', days: stalwartDays },
      { name: 'ระบบมอนิเตอร์ (Monitoring)', days: promDays },
    ];
    const incidents: StatusIncident[] = [];
    for (const s of incidentSeries)
      for (const d of s.days)
        if (d.uptime != null && d.uptime < 99.5)
          incidents.push({ date: new Date(d.t * 1000).toISOString().slice(0, 10), component: s.name, uptime: d.uptime });
    incidents.sort((a, b) => b.date.localeCompare(a.date));

    return {
      overall,
      components,
      incidents: incidents.slice(0, 30),
      windowDays: WINDOW,
      updatedAt: new Date().toISOString(),
    };
  }
}
