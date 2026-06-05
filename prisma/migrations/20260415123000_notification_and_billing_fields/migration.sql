-- Add enum value for subscription status
ALTER TYPE "SubscriptionStatus" ADD VALUE IF NOT EXISTS 'EXPIRED';

-- Add payment provider enum
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'PaymentProvider') THEN
    CREATE TYPE "PaymentProvider" AS ENUM ('LEMONSQUEEZY', 'XPAY');
  END IF;
END $$;

-- Add new user notification preference columns
ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS "emailOnDetection" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS "emailWeeklyDigest" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS "emailRotationReminder" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS "slackWebhookUrl" TEXT;

-- Add subscription billing/provider columns
ALTER TABLE "Subscription"
  ADD COLUMN IF NOT EXISTS "xpayTransactionId" TEXT,
  ADD COLUMN IF NOT EXISTS "paymentProvider" "PaymentProvider" NOT NULL DEFAULT 'LEMONSQUEEZY',
  ADD COLUMN IF NOT EXISTS "currency" TEXT NOT NULL DEFAULT 'USD',
  ADD COLUMN IF NOT EXISTS "amountPaid" DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Keep updatedAt current for existing rows
UPDATE "Subscription"
SET "updatedAt" = CURRENT_TIMESTAMP
WHERE "updatedAt" IS NULL;

-- Add optional unique index for xpay IDs
CREATE UNIQUE INDEX IF NOT EXISTS "Subscription_xpayTransactionId_key" ON "Subscription"("xpayTransactionId");

-- Add bypass event table
CREATE TABLE IF NOT EXISTS "BypassEvent" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "reason" TEXT NOT NULL,
  "source" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "BypassEvent_pkey" PRIMARY KEY ("id")
);

-- Add bypass event relationship
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_name = 'BypassEvent_userId_fkey'
      AND table_name = 'BypassEvent'
  ) THEN
    ALTER TABLE "BypassEvent"
      ADD CONSTRAINT "BypassEvent_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "User"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
