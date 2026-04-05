-- CreateTable
CREATE TABLE "writing_evaluations" (
    "id" TEXT NOT NULL,
    "attemptId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "overallBand" DOUBLE PRECISION NOT NULL,
    "task1Band" DOUBLE PRECISION NOT NULL,
    "task1TaskAchievement" DOUBLE PRECISION NOT NULL,
    "task1CoherenceCohesion" DOUBLE PRECISION NOT NULL,
    "task1LexicalResource" DOUBLE PRECISION NOT NULL,
    "task1GrammaticalRange" DOUBLE PRECISION NOT NULL,
    "task1TaskAchievementFb" TEXT NOT NULL,
    "task1CoherenceCohesionFb" TEXT NOT NULL,
    "task1LexicalResourceFb" TEXT NOT NULL,
    "task1GrammaticalRangeFb" TEXT NOT NULL,
    "task1Essay" TEXT NOT NULL,
    "task1WordCount" INTEGER NOT NULL,
    "task2Band" DOUBLE PRECISION NOT NULL,
    "task2TaskAchievement" DOUBLE PRECISION NOT NULL,
    "task2CoherenceCohesion" DOUBLE PRECISION NOT NULL,
    "task2LexicalResource" DOUBLE PRECISION NOT NULL,
    "task2GrammaticalRange" DOUBLE PRECISION NOT NULL,
    "task2TaskAchievementFb" TEXT NOT NULL,
    "task2CoherenceCohesionFb" TEXT NOT NULL,
    "task2LexicalResourceFb" TEXT NOT NULL,
    "task2GrammaticalRangeFb" TEXT NOT NULL,
    "task2Essay" TEXT NOT NULL,
    "task2WordCount" INTEGER NOT NULL,
    "task1Improvements" TEXT[],
    "task2Improvements" TEXT[],

    CONSTRAINT "writing_evaluations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "writing_evaluations_attemptId_key" ON "writing_evaluations"("attemptId");

-- AddForeignKey
ALTER TABLE "writing_evaluations" ADD CONSTRAINT "writing_evaluations_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "test_skill_attempts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
