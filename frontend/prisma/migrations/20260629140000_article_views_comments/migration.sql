-- Article view counter
ALTER TABLE "Article" ADD COLUMN "viewCount" INTEGER NOT NULL DEFAULT 0;

-- Comment moderation status
CREATE TYPE "CommentStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- Comments (admin-moderated before display)
CREATE TABLE "Comment" (
    "id" SERIAL NOT NULL,
    "articleId" INTEGER NOT NULL,
    "authorName" TEXT NOT NULL,
    "authorEmail" TEXT,
    "body" TEXT NOT NULL,
    "status" "CommentStatus" NOT NULL DEFAULT 'PENDING',
    "ip" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Comment_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Comment_articleId_status_idx" ON "Comment"("articleId", "status");
CREATE INDEX "Comment_status_createdAt_idx" ON "Comment"("status", "createdAt");

ALTER TABLE "Comment" ADD CONSTRAINT "Comment_articleId_fkey"
    FOREIGN KEY ("articleId") REFERENCES "Article"("id") ON DELETE CASCADE ON UPDATE CASCADE;
