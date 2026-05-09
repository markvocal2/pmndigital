-- AlterTable: add DEFAULT to updatedAt so TypeORM's repo.create() can use SQL DEFAULT keyword
ALTER TABLE "User" ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;
