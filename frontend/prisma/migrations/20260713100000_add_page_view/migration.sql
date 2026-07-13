-- Per-view analytics events powering the admin sparkline (view growth) and the
-- traffic-source + human/bot breakdown. Additive & non-destructive: does not
-- touch Article.viewCount (kept as the cumulative total). One row per view.
CREATE TABLE IF NOT EXISTS "PageView" (
  "id"           SERIAL PRIMARY KEY,
  "articleId"    INTEGER NOT NULL,
  "isBot"        BOOLEAN NOT NULL DEFAULT false,
  "source"       TEXT    NOT NULL DEFAULT 'direct',
  "referrerHost" TEXT,
  "utmSource"    TEXT,
  "country"      TEXT,
  "ipHash"       TEXT,
  "userAgent"    TEXT,
  "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'PageView_articleId_fkey') THEN
    ALTER TABLE "PageView"
      ADD CONSTRAINT "PageView_articleId_fkey"
      FOREIGN KEY ("articleId") REFERENCES "Article"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "PageView_articleId_createdAt_idx" ON "PageView" ("articleId", "createdAt");
CREATE INDEX IF NOT EXISTS "PageView_createdAt_idx" ON "PageView" ("createdAt");
CREATE INDEX IF NOT EXISTS "PageView_isBot_idx" ON "PageView" ("isBot");
