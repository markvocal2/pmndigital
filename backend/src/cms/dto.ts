import {
  IsArray,
  IsBoolean,
  IsEmail,
  IsIn,
  IsInt,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class UpdateSettingsDto {
  @IsOptional() @IsString() @MaxLength(120) siteName?: string;
  @IsOptional() @IsString() @MaxLength(120) siteNameEn?: string;
  @IsOptional() @IsString() @MaxLength(240) tagline?: string;
  @IsOptional() @IsString() @MaxLength(500) logoLightUrl?: string;
  @IsOptional() @IsString() @MaxLength(500) logoDarkUrl?: string;
  @IsOptional() @IsString() @MaxLength(500) faviconUrl?: string;
  @IsOptional() @IsString() @MaxLength(500) ogDefaultUrl?: string;
  @IsOptional() @IsString() @MaxLength(64) timezone?: string;
  @IsOptional() @IsString() @MaxLength(10) defaultLocale?: string;
  @IsOptional() @IsIn(['light', 'dark']) themeDefault?: string;
  @IsOptional() @IsString() @MaxLength(160) contactEmail?: string;
  @IsOptional() @IsString() @MaxLength(60) contactPhone?: string;
  @IsOptional() @IsString() @MaxLength(300) contactAddress?: string;
  @IsOptional() @IsNumber() geoLat?: number;
  @IsOptional() @IsNumber() geoLng?: number;
  @IsOptional() @IsString() @MaxLength(500) mapUrl?: string;
  @IsOptional() @IsObject() socials?: Record<string, unknown>;
  @IsOptional() @IsString() @MaxLength(160) defaultMetaTitle?: string;
  @IsOptional() @IsString() @MaxLength(320) defaultMetaDesc?: string;
  @IsOptional() @IsString() @MaxLength(320) defaultKeywords?: string;
  @IsOptional() @IsString() @MaxLength(40) gaId?: string;
  @IsOptional() @IsString() @MaxLength(40) gtmId?: string;
  @IsOptional() @IsBoolean() maintenanceMode?: boolean;
  @IsOptional() @IsObject() extra?: Record<string, unknown>;
}

export class UpdateHomeDto {
  @IsOptional() @IsObject() data?: Record<string, unknown>;
  @IsOptional() @IsObject() seo?: Record<string, unknown>;
}

export class ArticleDto {
  @IsString() @MinLength(1) @MaxLength(200) title: string;
  @IsString() @Matches(/^[a-z0-9฀-๿-]+$/, { message: 'slug ใช้ได้เฉพาะ a-z, 0-9, อักษรไทย และ -' }) @MaxLength(160)
  slug: string;
  @IsOptional() @IsString() @MaxLength(400) excerpt?: string;
  @IsOptional() @IsString() bodyMarkdown?: string;
  @IsOptional() @IsString() @MaxLength(500) coverImageUrl?: string;
  @IsOptional() @IsIn(['DRAFT', 'PUBLISHED']) status?: string;
  @IsOptional() @IsInt() categoryId?: number | null;
  @IsOptional() @IsArray() @IsString({ each: true }) tags?: string[];
  @IsOptional() @IsString() @MaxLength(200) metaTitle?: string;
  @IsOptional() @IsString() @MaxLength(400) metaDesc?: string;
  @IsOptional() @IsString() @MaxLength(500) canonicalUrl?: string;
  @IsOptional() @IsString() @MaxLength(500) ogImageUrl?: string;
  @IsOptional() @IsBoolean() noindex?: boolean;
  @IsOptional() @IsString() @MaxLength(160) keyphrase?: string;
  @IsOptional() @IsArray() faq?: { q: string; a: string }[];
  @IsOptional() @IsArray() @IsString({ each: true }) takeaways?: string[];
  @IsOptional() @IsString() @MaxLength(40) schemaType?: string;
}

export class CategoryDto {
  @IsString() @Matches(/^[a-z0-9฀-๿-]+$/) @MaxLength(60) slug: string;
  @IsString() @MinLength(1) @MaxLength(120) name: string;
  @IsOptional() @IsString() @MaxLength(120) nameEn?: string;
}

export class CreateLeadDto {
  @IsIn(['REGISTER', 'CONTACT']) type: string;
  @IsString() @MinLength(1) @MaxLength(120) name: string;
  @IsEmail() @MaxLength(160) email: string;
  @IsOptional() @IsString() @MaxLength(40) phone?: string;
  @IsOptional() @IsString() @MaxLength(160) company?: string;
  @IsOptional() @IsString() @MaxLength(160) service?: string;
  @IsOptional() @IsString() @MaxLength(4000) message?: string;
  @IsOptional() @IsString() @MaxLength(60) source?: string;
  @IsOptional() @IsString() @MaxLength(200) hp?: string; // honeypot
}

export class LeadStatusDto {
  @IsIn(['NEW', 'CONTACTED', 'CLOSED']) status: string;
}

export class TestMailDto {
  @IsEmail() @MaxLength(160) to: string;
}
