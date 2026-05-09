import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditEvent, AuthAuditLog } from './audit-log.entity';

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(
    @InjectRepository(AuthAuditLog)
    private readonly logs: Repository<AuthAuditLog>,
  ) {}

  async log(
    event: AuditEvent,
    options: {
      userId?: number | null;
      ip?: string | null;
      userAgent?: string | null;
      metadata?: Record<string, unknown> | null;
    } = {},
  ): Promise<void> {
    try {
      await this.logs.insert({
        event,
        userId: options.userId ?? null,
        ip: options.ip ?? null,
        userAgent: options.userAgent ?? null,
        metadata: options.metadata ?? null,
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      this.logger.warn(`audit log insert failed for ${event}: ${msg}`);
    }
  }
}
