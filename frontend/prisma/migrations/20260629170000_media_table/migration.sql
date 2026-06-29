CREATE TABLE "Media" (
    "id" SERIAL NOT NULL,
    "driveName" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "origName" TEXT,
    "mime" TEXT,
    "size" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Media_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "Media_createdAt_idx" ON "Media"("createdAt");
