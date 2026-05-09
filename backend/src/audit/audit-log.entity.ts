import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  JoinColumn,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../users/user.entity';

@Entity({ name: 'AuthAuditLog' })
@Index(['userId', 'createdAt'])
@Index(['event', 'createdAt'])
export class AuthAuditLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'integer', nullable: true })
  userId: number | null;

  @Column()
  event: string;

  @Column({ type: 'text', nullable: true })
  ip: string | null;

  @Column({ type: 'text', nullable: true })
  userAgent: string | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, unknown> | null;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'userId' })
  user: User | null;
}

export type AuditEvent =
  | 'login_success'
  | 'login_failed'
  | 'login_2fa_required'
  | 'login_2fa_succeeded'
  | 'login_2fa_failed'
  | 'password_changed'
  | 'profile_updated'
  | 'avatar_updated'
  | 'avatar_deleted'
  | '2fa_enabled'
  | '2fa_disabled'
  | '2fa_backup_used'
  | 'erp_sync_success'
  | 'erp_sync_failed';
