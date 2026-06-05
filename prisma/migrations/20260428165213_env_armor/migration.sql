-- AlterTable
ALTER TABLE "User" ALTER COLUMN "apiKey" SET DEFAULT md5(random()::text || clock_timestamp()::text);
