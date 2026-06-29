import { Injectable, Logger } from '@nestjs/common';

export interface ServerStatus {
  operational: boolean;
  uptimePct: number; // 0–100, 30-day availability
  responseMs: number; // monitoring round-trip latency
  days: number[]; // 7 daily availability % (0–100)
  updatedAt: string;
}

/**
 * Reads ONLY high-level availability/health from Prometheus (internal, on proxy-net).
 * The public endpoint exposes nothing sensitive — no CPU/RAM/container/mail counts.
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

  private async queryRange(
    promql: string,
    start: number,
    end: number,
    step: number,
  ): Promise<number[]> {
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

  private async compute(): Promise<ServerStatus> {
    const t0 = Date.now();
    const upRatio = await this.query('count(up==1) / count(up)');
    const responseMs = Date.now() - t0;
    const uptime = await this.query('avg(avg_over_time(up[30d])) * 100');

    const end = Math.floor(Date.now() / 1000);
    const start = end - 7 * 86400;
    let days = (await this.queryRange('avg(avg_over_time(up[1d])) * 100', start, end, 86400)).map(
      (v) => Math.round(v * 10) / 10,
    );
    if (days.length > 7) days = days.slice(-7);
    const fill = uptime != null ? Math.round(uptime * 10) / 10 : 100;
    while (days.length < 7) days.unshift(days[0] ?? fill);

    return {
      operational: upRatio != null && upRatio >= 0.999,
      uptimePct: uptime != null ? Math.round(uptime * 100) / 100 : 0,
      responseMs,
      days,
      updatedAt: new Date().toISOString(),
    };
  }
}
