-- CreateEnum
CREATE TYPE "VocabType" AS ENUM ('TOPIC', 'BAND_LR', 'BAND_SW');

-- AlterTable
ALTER TABLE "users" ADD COLUMN "role" TEXT NOT NULL DEFAULT 'STUDENT';

-- AlterTable
ALTER TABLE "writing_sample_topics" ADD COLUMN "chartDescription" TEXT;

-- CreateTable
CREATE TABLE "vocab_topics" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "VocabType" NOT NULL DEFAULT 'TOPIC',
    "bandLevel" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vocab_topics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vocab_words" (
    "id" TEXT NOT NULL,
    "topicId" TEXT NOT NULL,
    "word" TEXT NOT NULL,
    "meaning" TEXT NOT NULL,
    "pronunciation" TEXT,
    "example" TEXT,
    "synonyms" TEXT[],

    CONSTRAINT "vocab_words_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "grammar_sections" (
    "id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "subCategory" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "ruleSummary" TEXT NOT NULL,
    "content" JSONB NOT NULL,
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "grammar_sections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "grammar_mistakes" (
    "id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "incorrect" TEXT NOT NULL,
    "correct" TEXT NOT NULL,
    "note" TEXT NOT NULL,
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "grammar_mistakes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "vocab_topics_name_key" ON "vocab_topics"("name");

-- AddForeignKey
ALTER TABLE "vocab_words" ADD CONSTRAINT "vocab_words_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "vocab_topics"("id") ON DELETE CASCADE ON UPDATE CASCADE;
