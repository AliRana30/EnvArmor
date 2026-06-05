-- AlterTable
ALTER TABLE "Subscription" ALTER COLUMN "lemonsqueezyId" DROP NOT NULL,
ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "apiKey" SET DEFAULT md5(random()::text || clock_timestamp()::text);
