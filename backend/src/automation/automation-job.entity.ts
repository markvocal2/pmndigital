import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity({ name: 'AutomationJob' })
export class AutomationJob {
  @PrimaryGeneratedColumn() id: number;
  @Index({ unique: true }) @Column({ type: 'text' }) jobKey: string;
  @Column({ type: 'boolean', default: false }) enabled: boolean;
  @Column({ type: 'jsonb', nullable: true }) config: unknown;
  @Column({ type: 'timestamp', nullable: true }) lastRunAt: Date | null;
  @Column({ type: 'text', nullable: true }) lastStatus: string | null;
  @Column({ type: 'text', nullable: true }) lastMessage: string | null;
  @CreateDateColumn() createdAt: Date;
  @UpdateDateColumn() updatedAt: Date;
}
