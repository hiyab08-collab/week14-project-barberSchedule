ALTER TABLE "Appointment"
ADD COLUMN "cardBrand" TEXT,
ADD COLUMN "cardLast4" TEXT,
ADD COLUMN "receiptSentAt" TIMESTAMP(3),
ADD COLUMN "reminderSentAt" TIMESTAMP(3);
