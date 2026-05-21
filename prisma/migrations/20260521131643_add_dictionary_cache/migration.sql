-- CreateTable
CREATE TABLE "listening_reading_explanations" (
    "id" TEXT NOT NULL,
    "attemptId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "explanations" JSONB NOT NULL,
    "creditsCharged" INTEGER NOT NULL DEFAULT 1,
    "transactionId" TEXT,

    CONSTRAINT "listening_reading_explanations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dictionary_caches" (
    "id" TEXT NOT NULL,
    "word" TEXT NOT NULL,
    "phonetic" TEXT,
    "audioUrl" TEXT,
    "meaning" TEXT,
    "synonyms" TEXT,
    "explainVN" TEXT,
    "example" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dictionary_caches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sentence_translation_caches" (
    "id" TEXT NOT NULL,
    "sentence" TEXT NOT NULL,
    "translation" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sentence_translation_caches_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "listening_reading_explanations_attemptId_key" ON "listening_reading_explanations"("attemptId");

-- CreateIndex
CREATE UNIQUE INDEX "dictionary_caches_word_key" ON "dictionary_caches"("word");

-- CreateIndex
CREATE UNIQUE INDEX "sentence_translation_caches_sentence_key" ON "sentence_translation_caches"("sentence");

-- AddForeignKey
ALTER TABLE "listening_reading_explanations" ADD CONSTRAINT "listening_reading_explanations_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "test_skill_attempts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
