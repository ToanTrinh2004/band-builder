CREATE TABLE "pronunciation_sentences" (
    "id" TEXT NOT NULL,
    "topicId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "startTime" DOUBLE PRECISION NOT NULL,
    "endTime" DOUBLE PRECISION NOT NULL,
    "orderIndex" INTEGER NOT NULL,

    CONSTRAINT "pronunciation_sentences_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "pronunciation_sentences" ADD CONSTRAINT "pronunciation_sentences_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "pronunciation_topics"("id") ON DELETE CASCADE ON UPDATE CASCADE;
