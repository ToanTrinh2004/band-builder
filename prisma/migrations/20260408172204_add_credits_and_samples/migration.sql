-- CreateEnum
CREATE TYPE "CreditTransactionType" AS ENUM ('PURCHASE', 'SPEND', 'REFUND', 'BONUS', 'EXPIRY');

-- CreateEnum
CREATE TYPE "CreditTxStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED');

-- CreateTable
CREATE TABLE "speaking_samples" (
    "id" TEXT NOT NULL,
    "skillContentId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "band" INTEGER NOT NULL,
    "answerText" TEXT NOT NULL,
    "tip" TEXT NOT NULL,
    "vocabularyHighlights" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "speaking_samples_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "speaking_sample_accesses" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sampleId" TEXT NOT NULL,
    "transactionId" TEXT,
    "accessedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "speaking_sample_accesses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "credit_packages" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "credits" INTEGER NOT NULL,
    "priceVnd" INTEGER NOT NULL,
    "bonusCredit" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "credit_packages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_credits" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "balance" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_credits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "credit_transactions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "packageId" TEXT,
    "type" "CreditTransactionType" NOT NULL,
    "amount" INTEGER NOT NULL,
    "balanceBefore" INTEGER NOT NULL,
    "balanceAfter" INTEGER NOT NULL,
    "description" TEXT,
    "referenceId" TEXT,
    "provider" TEXT DEFAULT 'sepay',
    "transferMemo" TEXT,
    "bankCode" TEXT,
    "bankAccount" TEXT,
    "amountVnd" INTEGER,
    "sePayTxId" TEXT,
    "sePayWebhookRaw" JSONB,
    "paidAt" TIMESTAMP(3),
    "expiredAt" TIMESTAMP(3),
    "status" "CreditTxStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "credit_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "speaking_samples_skillContentId_questionId_band_key" ON "speaking_samples"("skillContentId", "questionId", "band");

-- CreateIndex
CREATE UNIQUE INDEX "speaking_sample_accesses_userId_sampleId_key" ON "speaking_sample_accesses"("userId", "sampleId");

-- CreateIndex
CREATE UNIQUE INDEX "user_credits_userId_key" ON "user_credits"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "credit_transactions_transferMemo_key" ON "credit_transactions"("transferMemo");

-- CreateIndex
CREATE UNIQUE INDEX "credit_transactions_sePayTxId_key" ON "credit_transactions"("sePayTxId");

-- AddForeignKey
ALTER TABLE "speaking_samples" ADD CONSTRAINT "speaking_samples_skillContentId_fkey" FOREIGN KEY ("skillContentId") REFERENCES "skill_contents"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "speaking_sample_accesses" ADD CONSTRAINT "speaking_sample_accesses_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "speaking_sample_accesses" ADD CONSTRAINT "speaking_sample_accesses_sampleId_fkey" FOREIGN KEY ("sampleId") REFERENCES "speaking_samples"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "speaking_sample_accesses" ADD CONSTRAINT "speaking_sample_accesses_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "credit_transactions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_credits" ADD CONSTRAINT "user_credits_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credit_transactions" ADD CONSTRAINT "credit_transactions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credit_transactions" ADD CONSTRAINT "credit_transactions_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "credit_packages"("id") ON DELETE SET NULL ON UPDATE CASCADE;
