-- AlterTable User: add profile + 2FA + ERP linkage columns
ALTER TABLE "User"
  ADD COLUMN "firstName" TEXT,
  ADD COLUMN "lastName" TEXT,
  ADD COLUMN "displayName" TEXT,
  ADD COLUMN "avatarUrl" TEXT,
  ADD COLUMN "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "twoFactorSecret" TEXT,
  ADD COLUMN "twoFactorBackupCodes" JSONB,
  ADD COLUMN "erpCustomerId" INTEGER,
  ADD COLUMN "erpSyncedAt" TIMESTAMP(3);

CREATE INDEX "User_erpCustomerId_idx" ON "User"("erpCustomerId");

-- CreateTable AuthAuditLog
CREATE TABLE "AuthAuditLog" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER,
    "event" TEXT NOT NULL,
    "ip" TEXT,
    "userAgent" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuthAuditLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AuthAuditLog_userId_createdAt_idx" ON "AuthAuditLog"("userId", "createdAt");
CREATE INDEX "AuthAuditLog_event_createdAt_idx" ON "AuthAuditLog"("event", "createdAt");

ALTER TABLE "AuthAuditLog" ADD CONSTRAINT "AuthAuditLog_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
