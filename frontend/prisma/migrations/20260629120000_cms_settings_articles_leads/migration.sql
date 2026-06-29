-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('USER', 'ADMIN');
CREATE TYPE "ArticleStatus" AS ENUM ('DRAFT', 'PUBLISHED');
CREATE TYPE "LeadType" AS ENUM ('REGISTER', 'CONTACT');
CREATE TYPE "LeadStatus" AS ENUM ('NEW', 'CONTACTED', 'CLOSED');

-- AlterTable User: add role
ALTER TABLE "User" ADD COLUMN "role" "UserRole" NOT NULL DEFAULT 'USER';

-- CreateTable SiteSetting (singleton, key="default")
CREATE TABLE "SiteSetting" (
    "id" SERIAL NOT NULL,
    "key" TEXT NOT NULL DEFAULT 'default',
    "siteName" TEXT NOT NULL DEFAULT 'PMN Digital',
    "siteNameEn" TEXT,
    "tagline" TEXT,
    "logoLightUrl" TEXT,
    "logoDarkUrl" TEXT,
    "faviconUrl" TEXT,
    "ogDefaultUrl" TEXT,
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Bangkok',
    "defaultLocale" TEXT NOT NULL DEFAULT 'th',
    "themeDefault" TEXT NOT NULL DEFAULT 'dark',
    "contactEmail" TEXT,
    "contactPhone" TEXT,
    "contactAddress" TEXT,
    "geoLat" DOUBLE PRECISION,
    "geoLng" DOUBLE PRECISION,
    "mapUrl" TEXT,
    "socials" JSONB,
    "defaultMetaTitle" TEXT,
    "defaultMetaDesc" TEXT,
    "defaultKeywords" TEXT,
    "gaId" TEXT,
    "gtmId" TEXT,
    "maintenanceMode" BOOLEAN NOT NULL DEFAULT false,
    "extra" JSONB,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SiteSetting_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "SiteSetting_key_key" ON "SiteSetting"("key");

-- CreateTable HomeContent (singleton, key="home")
CREATE TABLE "HomeContent" (
    "id" SERIAL NOT NULL,
    "key" TEXT NOT NULL DEFAULT 'home',
    "data" JSONB NOT NULL,
    "seo" JSONB,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "HomeContent_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "HomeContent_key_key" ON "HomeContent"("key");

-- CreateTable ArticleCategory
CREATE TABLE "ArticleCategory" (
    "id" SERIAL NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameEn" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ArticleCategory_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "ArticleCategory_slug_key" ON "ArticleCategory"("slug");

-- CreateTable Article
CREATE TABLE "Article" (
    "id" SERIAL NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "excerpt" TEXT,
    "bodyMarkdown" TEXT NOT NULL DEFAULT '',
    "coverImageUrl" TEXT,
    "status" "ArticleStatus" NOT NULL DEFAULT 'DRAFT',
    "publishedAt" TIMESTAMP(3),
    "authorId" INTEGER,
    "categoryId" INTEGER,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "readingMins" INTEGER NOT NULL DEFAULT 1,
    "metaTitle" TEXT,
    "metaDesc" TEXT,
    "canonicalUrl" TEXT,
    "ogImageUrl" TEXT,
    "noindex" BOOLEAN NOT NULL DEFAULT false,
    "keyphrase" TEXT,
    "faq" JSONB,
    "takeaways" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "schemaType" TEXT NOT NULL DEFAULT 'Article',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Article_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Article_slug_key" ON "Article"("slug");
CREATE INDEX "Article_status_publishedAt_idx" ON "Article"("status", "publishedAt");
CREATE INDEX "Article_categoryId_idx" ON "Article"("categoryId");
ALTER TABLE "Article" ADD CONSTRAINT "Article_authorId_fkey"
    FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Article" ADD CONSTRAINT "Article_categoryId_fkey"
    FOREIGN KEY ("categoryId") REFERENCES "ArticleCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateTable Lead
CREATE TABLE "Lead" (
    "id" SERIAL NOT NULL,
    "type" "LeadType" NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "company" TEXT,
    "service" TEXT,
    "message" TEXT,
    "status" "LeadStatus" NOT NULL DEFAULT 'NEW',
    "source" TEXT,
    "ip" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "Lead_type_createdAt_idx" ON "Lead"("type", "createdAt");
CREATE INDEX "Lead_status_createdAt_idx" ON "Lead"("status", "createdAt");

-- Seed singletons
INSERT INTO "SiteSetting" ("key", "siteName", "siteNameEn", "logoDarkUrl", "timezone")
VALUES ('default', 'PMN Digital', 'PMN Digital', '/assets/logo-white.png', 'Asia/Bangkok');
INSERT INTO "HomeContent" ("key", "data") VALUES ('home', '{}'::jsonb);
