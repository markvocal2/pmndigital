import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

/** A registered OAuth client (claude.ai registers itself via Dynamic Client Registration). */
@Entity({ name: 'OAuthClient' })
export class OAuthClient {
  @PrimaryGeneratedColumn() id: number;
  @Index({ unique: true }) @Column({ type: 'text' }) clientId: string;
  @Column({ type: 'text', nullable: true }) clientSecret: string | null;
  @Column({ type: 'text', nullable: true }) clientName: string | null;
  @Column({ type: 'text', array: true, default: () => "'{}'" }) redirectUris: string[];
  @Column({ type: 'text', nullable: true }) scope: string | null;
  /** Full OAuthClientInformationFull JSON as registered. */
  @Column({ type: 'jsonb', nullable: true }) metadata: unknown;
  @CreateDateColumn() createdAt: Date;
}

/** Short-lived authorization code (PKCE). */
@Entity({ name: 'OAuthCode' })
export class OAuthCode {
  @PrimaryGeneratedColumn() id: number;
  @Index({ unique: true }) @Column({ type: 'text' }) code: string;
  @Column({ type: 'text' }) clientId: string;
  @Column({ type: 'int' }) userId: number;
  @Column({ type: 'text' }) codeChallenge: string;
  @Column({ type: 'text' }) redirectUri: string;
  @Column({ type: 'text', nullable: true }) resource: string | null;
  @Column({ type: 'text', nullable: true }) scope: string | null;
  @Column({ type: 'timestamp' }) expiresAt: Date;
  @CreateDateColumn() createdAt: Date;
}

/** Issued access/refresh tokens (DB-backed so they survive backend redeploys). */
@Entity({ name: 'OAuthToken' })
export class OAuthToken {
  @PrimaryGeneratedColumn() id: number;
  @Index({ unique: true }) @Column({ type: 'text' }) accessToken: string;
  @Index() @Column({ type: 'text', nullable: true }) refreshToken: string | null;
  @Column({ type: 'text' }) clientId: string;
  @Column({ type: 'int' }) userId: number;
  @Column({ type: 'text', nullable: true }) scope: string | null;
  @Column({ type: 'text', nullable: true }) resource: string | null;
  @Column({ type: 'timestamp' }) expiresAt: Date;
  @Column({ type: 'boolean', default: false }) revoked: boolean;
  @CreateDateColumn() createdAt: Date;
}
