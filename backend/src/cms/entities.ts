import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

/* ---------------- enums (PG enum types owned by Prisma) ---------------- */
export enum ArticleStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
}
export enum LeadType {
  REGISTER = 'REGISTER',
  CONTACT = 'CONTACT',
}
export enum LeadStatus {
  NEW = 'NEW',
  CONTACTED = 'CONTACTED',
  CLOSED = 'CLOSED',
}

/* ---------------- SiteSetting (singleton key="default") ---------------- */
@Entity({ name: 'SiteSetting' })
export class SiteSetting {
  @PrimaryGeneratedColumn() id: number;
  @Column({ type: 'text', default: 'default' }) key: string;
  @Column({ type: 'text', default: 'PMN Digital' }) siteName: string;
  @Column({ type: 'text', nullable: true }) siteNameEn: string | null;
  @Column({ type: 'text', nullable: true }) tagline: string | null;
  @Column({ type: 'text', nullable: true }) logoLightUrl: string | null;
  @Column({ type: 'text', nullable: true }) logoDarkUrl: string | null;
  @Column({ type: 'text', nullable: true }) faviconUrl: string | null;
  @Column({ type: 'text', nullable: true }) ogDefaultUrl: string | null;
  @Column({ type: 'text', default: 'Asia/Bangkok' }) timezone: string;
  @Column({ type: 'text', default: 'th' }) defaultLocale: string;
  @Column({ type: 'text', default: 'dark' }) themeDefault: string;
  @Column({ type: 'text', nullable: true }) contactEmail: string | null;
  @Column({ type: 'text', nullable: true }) contactPhone: string | null;
  @Column({ type: 'text', nullable: true }) contactAddress: string | null;
  @Column({ type: 'double precision', nullable: true }) geoLat: number | null;
  @Column({ type: 'double precision', nullable: true }) geoLng: number | null;
  @Column({ type: 'text', nullable: true }) mapUrl: string | null;
  @Column({ type: 'jsonb', nullable: true }) socials: unknown;
  @Column({ type: 'text', nullable: true }) defaultMetaTitle: string | null;
  @Column({ type: 'text', nullable: true }) defaultMetaDesc: string | null;
  @Column({ type: 'text', nullable: true }) defaultKeywords: string | null;
  @Column({ type: 'text', nullable: true }) gaId: string | null;
  @Column({ type: 'text', nullable: true }) gtmId: string | null;
  @Column({ type: 'boolean', default: false }) maintenanceMode: boolean;
  @Column({ type: 'jsonb', nullable: true }) extra: unknown;
  @UpdateDateColumn() updatedAt: Date;
}

/* ---------------- HomeContent (singleton key="home") ---------------- */
@Entity({ name: 'HomeContent' })
export class HomeContent {
  @PrimaryGeneratedColumn() id: number;
  @Column({ type: 'text', default: 'home' }) key: string;
  @Column({ type: 'jsonb' }) data: unknown;
  @Column({ type: 'jsonb', nullable: true }) seo: unknown;
  @UpdateDateColumn() updatedAt: Date;
}

/* ---------------- ArticleCategory ---------------- */
@Entity({ name: 'ArticleCategory' })
export class ArticleCategory {
  @PrimaryGeneratedColumn() id: number;
  @Column({ type: 'text', unique: true }) slug: string;
  @Column({ type: 'text' }) name: string;
  @Column({ type: 'text', nullable: true }) nameEn: string | null;
  @CreateDateColumn() createdAt: Date;
}

/* ---------------- Article ---------------- */
@Entity({ name: 'Article' })
@Index(['status', 'publishedAt'])
@Index(['categoryId'])
export class Article {
  @PrimaryGeneratedColumn() id: number;
  @Column({ type: 'text', unique: true }) slug: string;
  @Column({ type: 'text' }) title: string;
  @Column({ type: 'text', nullable: true }) excerpt: string | null;
  @Column({ type: 'text', default: '' }) bodyMarkdown: string;
  @Column({ type: 'text', nullable: true }) coverImageUrl: string | null;
  @Column({ type: 'enum', enum: ArticleStatus, enumName: 'ArticleStatus', default: ArticleStatus.DRAFT })
  status: ArticleStatus;
  @Column({ type: 'timestamp', nullable: true }) publishedAt: Date | null;
  @Column({ type: 'integer', nullable: true }) authorId: number | null;
  @Column({ type: 'integer', nullable: true }) categoryId: number | null;
  @Column({ type: 'text', array: true, default: () => "'{}'" }) tags: string[];
  @Column({ type: 'integer', default: 1 }) readingMins: number;
  @Column({ type: 'text', nullable: true }) metaTitle: string | null;
  @Column({ type: 'text', nullable: true }) metaDesc: string | null;
  @Column({ type: 'text', nullable: true }) canonicalUrl: string | null;
  @Column({ type: 'text', nullable: true }) ogImageUrl: string | null;
  @Column({ type: 'boolean', default: false }) noindex: boolean;
  @Column({ type: 'text', nullable: true }) keyphrase: string | null;
  @Column({ type: 'jsonb', nullable: true }) faq: unknown;
  @Column({ type: 'text', array: true, default: () => "'{}'" }) takeaways: string[];
  @Column({ type: 'text', default: 'Article' }) schemaType: string;
  @CreateDateColumn() createdAt: Date;
  @UpdateDateColumn() updatedAt: Date;
}

/* ---------------- Lead ---------------- */
@Entity({ name: 'Lead' })
@Index(['type', 'createdAt'])
@Index(['status', 'createdAt'])
export class Lead {
  @PrimaryGeneratedColumn() id: number;
  @Column({ type: 'enum', enum: LeadType, enumName: 'LeadType' }) type: LeadType;
  @Column({ type: 'text' }) name: string;
  @Column({ type: 'text' }) email: string;
  @Column({ type: 'text', nullable: true }) phone: string | null;
  @Column({ type: 'text', nullable: true }) company: string | null;
  @Column({ type: 'text', nullable: true }) service: string | null;
  @Column({ type: 'text', nullable: true }) message: string | null;
  @Column({ type: 'enum', enum: LeadStatus, enumName: 'LeadStatus', default: LeadStatus.NEW })
  status: LeadStatus;
  @Column({ type: 'text', nullable: true }) source: string | null;
  @Column({ type: 'text', nullable: true }) ip: string | null;
  @Column({ type: 'text', nullable: true }) userAgent: string | null;
  @CreateDateColumn() createdAt: Date;
}
