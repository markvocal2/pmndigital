CREATE TYPE "IntegrationProvider" AS ENUM ('ANTHROPIC', 'GEMINI', 'OPENAI');
CREATE TYPE "IntegrationMode" AS ENUM ('API_KEY', 'OAUTH');

CREATE TABLE "Integration" (
    "id" SERIAL NOT NULL,
    "provider" "IntegrationProvider" NOT NULL,
    "mode" "IntegrationMode" NOT NULL DEFAULT 'API_KEY',
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "secretEnc" TEXT,
    "meta" JSONB,
    "status" TEXT,
    "statusMsg" TEXT,
    "lastTestedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Integration_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Integration_provider_key" ON "Integration"("provider");
