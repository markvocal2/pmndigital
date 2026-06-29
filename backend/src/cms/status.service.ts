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
}
