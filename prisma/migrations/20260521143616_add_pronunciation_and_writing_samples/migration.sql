-- CreateEnum
CREATE TYPE "WritingTaskType" AS ENUM ('TASK_1', 'TASK_2');

-- CreateTable
CREATE TABLE "pronunciation_topics" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "paragraph" TEXT NOT NULL,
    "videoUrl" TEXT,
    "audioUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pronunciation_topics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pronunciation_vocabs" (
    "id" TEXT NOT NULL,
    "topicId" TEXT NOT NULL,
    "word" TEXT NOT NULL,
    "ipa" TEXT NOT NULL,
    "meaning" TEXT NOT NULL,
    "audioUrl" TEXT,
    "example" TEXT NOT NULL,
    "exampleTranslation" TEXT NOT NULL,

    CONSTRAINT "pronunciation_vocabs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "writing_sample_topics" (
    "id" TEXT NOT NULL,
    "taskType" "WritingTaskType" NOT NULL,
    "category" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "imageUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "writing_sample_topics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "writing_sample_essays" (
    "id" TEXT NOT NULL,
    "topicId" TEXT NOT NULL,
    "bandScore" DOUBLE PRECISION NOT NULL,
    "essayText" TEXT NOT NULL,
    "essayTranslation" TEXT NOT NULL,
    "analysis" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "writing_sample_essays_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "pronunciation_vocabs" ADD CONSTRAINT "pronunciation_vocabs_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "pronunciation_topics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "writing_sample_essays" ADD CONSTRAINT "writing_sample_essays_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "writing_sample_topics"("id") ON DELETE CASCADE ON UPDATE CASCADE;
