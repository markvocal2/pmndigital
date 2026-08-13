-- Optional YouTube video attached to an article. Additive and nullable: existing rows stay
-- NULL and simply render no video block. Written with IF NOT EXISTS because the column is
-- applied to prod ahead of the deploy — the backend image ships an entity that selects it,
-- and it boots alongside (not after) the frontend that runs `prisma migrate deploy`.
ALTER TABLE "Article" ADD COLUMN IF NOT EXISTS "youtubeUrl" TEXT;