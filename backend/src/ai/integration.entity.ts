import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

export enum IntegrationProvider {
  ANTHROPIC = 'ANTHROPIC',
  GEMINI = 'GEMINI',
  OPENAI = 'OPENAI',
}
export enum IntegrationMode {
  API_KEY = 'API_KEY',
  OAUTH = 'OAUTH',
}

/** One row per provider. `secretEnc` = AES-GCM JSON ({apiKey} or {accessToken,refreshToken,expiresAt,...}). */
@Entity({ name: 'Integration' })
export class Integration {
  @PrimaryGeneratedColumn() id: number;
  @Column({ type: 'enum', enum: IntegrationProvider, enumName: 'IntegrationProvider', unique: true })
  provider: IntegrationProvider;
  @Column({ type: 'enum', enum: IntegrationMode, enumName: 'IntegrationMode', default: IntegrationMode.API_KEY })
  mode: IntegrationMode;
  @Column({ type: 'boolean', default: false }) enabled: boolean;
  @Column({ type: 'text', nullable: true }) secretEnc: string | null;
  @Column({ type: 'jsonb', nullable: true }) meta: unknown;
  @Column({ type: 'text', nullable: true }) status: string | null;
  @Column({ type: 'text', nullable: true }) statusMsg: string | null;
  @Column({ type: 'timestamp', nullable: true }) lastTestedAt: Date | null;
  @CreateDateColumn() createdAt: Date;
  @UpdateDateColumn() updatedAt: Date;
}
