/*
  Warnings:

  - You are about to drop the column `task1CoherenceCohesionFb` on the `writing_evaluations` table. All the data in the column will be lost.
  - You are about to drop the column `task1GrammaticalRangeFb` on the `writing_evaluations` table. All the data in the column will be lost.
  - You are about to drop the column `task1Improvements` on the `writing_evaluations` table. All the data in the column will be lost.
  - You are about to drop the column `task1LexicalResourceFb` on the `writing_evaluations` table. All the data in the column will be lost.
  - You are about to drop the column `task1TaskAchievementFb` on the `writing_evaluations` table. All the data in the column will be lost.
  - You are about to drop the column `task2CoherenceCohesionFb` on the `writing_evaluations` table. All the data in the column will be lost.
  - You are about to drop the column `task2GrammaticalRangeFb` on the `writing_evaluations` table. All the data in the column will be lost.
  - You are about to drop the column `task2Improvements` on the `writing_evaluations` table. All the data in the column will be lost.
  - You are about to drop the column `task2LexicalResourceFb` on the `writing_evaluations` table. All the data in the column will be lost.
  - You are about to drop the column `task2TaskAchievement` on the `writing_evaluations` table. All the data in the column will be lost.
  - You are about to drop the column `task2TaskAchievementFb` on the `writing_evaluations` table. All the data in the column will be lost.
  - Added the required column `task1CoherenceCohesionExamples` to the `writing_evaluations` table without a default value. This is not possible if the table is not empty.
  - Added the required column `task1CoherenceCohesionRationale` to the `writing_evaluations` table without a default value. This is not possible if the table is not empty.
  - Added the required column `task1CoherenceCohesionSuggestions` to the `writing_evaluations` table without a default value. This is not possible if the table is not empty.
  - Added the required column `task1GrammaticalRangeExamples` to the `writing_evaluations` table without a default value. This is not possible if the table is not empty.
  - Added the required column `task1GrammaticalRangeRationale` to the `writing_evaluations` table without a default value. This is not possible if the table is not empty.
  - Added the required column `task1GrammaticalRangeSuggestions` to the `writing_evaluations` table without a default value. This is not possible if the table is not empty.
  - Added the required column `task1LexicalResourceExamples` to the `writing_evaluations` table without a default value. This is not possible if the table is not empty.
  - Added the required column `task1LexicalResourceRationale` to the `writing_evaluations` table without a default value. This is not possible if the table is not empty.
  - Added the required column `task1LexicalResourceSuggestions` to the `writing_evaluations` table without a default value. This is not possible if the table is not empty.
  - Added the required column `task1OverallFeedback` to the `writing_evaluations` table without a default value. This is not possible if the table is not empty.
  - Added the required column `task1TaskAchievementExamples` to the `writing_evaluations` table without a default value. This is not possible if the table is not empty.
  - Added the required column `task1TaskAchievementRationale` to the `writing_evaluations` table without a default value. This is not possible if the table is not empty.
  - Added the required column `task1TaskAchievementSuggestions` to the `writing_evaluations` table without a default value. This is not possible if the table is not empty.
  - Added the required column `task2CoherenceCohesionExamples` to the `writing_evaluations` table without a default value. This is not possible if the table is not empty.
  - Added the required column `task2CoherenceCohesionRationale` to the `writing_evaluations` table without a default value. This is not possible if the table is not empty.
  - Added the required column `task2CoherenceCohesionSuggestions` to the `writing_evaluations` table without a default value. This is not possible if the table is not empty.
  - Added the required column `task2GrammaticalRangeExamples` to the `writing_evaluations` table without a default value. This is not possible if the table is not empty.
  - Added the required column `task2GrammaticalRangeRationale` to the `writing_evaluations` table without a default value. This is not possible if the table is not empty.
  - Added the required column `task2GrammaticalRangeSuggestions` to the `writing_evaluations` table without a default value. This is not possible if the table is not empty.
  - Added the required column `task2LexicalResourceExamples` to the `writing_evaluations` table without a default value. This is not possible if the table is not empty.
  - Added the required column `task2LexicalResourceRationale` to the `writing_evaluations` table without a default value. This is not possible if the table is not empty.
  - Added the required column `task2LexicalResourceSuggestions` to the `writing_evaluations` table without a default value. This is not possible if the table is not empty.
  - Added the required column `task2OverallFeedback` to the `writing_evaluations` table without a default value. This is not possible if the table is not empty.
  - Added the required column `task2TaskResponse` to the `writing_evaluations` table without a default value. This is not possible if the table is not empty.
  - Added the required column `task2TaskResponseExamples` to the `writing_evaluations` table without a default value. This is not possible if the table is not empty.
  - Added the required column `task2TaskResponseRationale` to the `writing_evaluations` table without a default value. This is not possible if the table is not empty.
  - Added the required column `task2TaskResponseSuggestions` to the `writing_evaluations` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "writing_evaluations" DROP COLUMN "task1CoherenceCohesionFb",
DROP COLUMN "task1GrammaticalRangeFb",
DROP COLUMN "task1Improvements",
DROP COLUMN "task1LexicalResourceFb",
DROP COLUMN "task1TaskAchievementFb",
DROP COLUMN "task2CoherenceCohesionFb",
DROP COLUMN "task2GrammaticalRangeFb",
DROP COLUMN "task2Improvements",
DROP COLUMN "task2LexicalResourceFb",
DROP COLUMN "task2TaskAchievement",
DROP COLUMN "task2TaskAchievementFb",
ADD COLUMN     "task1CoherenceCohesionExamples" TEXT NOT NULL,
ADD COLUMN     "task1CoherenceCohesionRationale" TEXT NOT NULL,
ADD COLUMN     "task1CoherenceCohesionSuggestions" TEXT NOT NULL,
ADD COLUMN     "task1GrammaticalRangeExamples" TEXT NOT NULL,
ADD COLUMN     "task1GrammaticalRangeRationale" TEXT NOT NULL,
ADD COLUMN     "task1GrammaticalRangeSuggestions" TEXT NOT NULL,
ADD COLUMN     "task1ImageFeedback" JSONB,
ADD COLUMN     "task1KeyStrengths" TEXT[],
ADD COLUMN     "task1KeyWeaknesses" TEXT[],
ADD COLUMN     "task1LexicalResourceExamples" TEXT NOT NULL,
ADD COLUMN     "task1LexicalResourceRationale" TEXT NOT NULL,
ADD COLUMN     "task1LexicalResourceSuggestions" TEXT NOT NULL,
ADD COLUMN     "task1OverallFeedback" TEXT NOT NULL,
ADD COLUMN     "task1PriorityImprovements" TEXT[],
ADD COLUMN     "task1TaskAchievementExamples" TEXT NOT NULL,
ADD COLUMN     "task1TaskAchievementRationale" TEXT NOT NULL,
ADD COLUMN     "task1TaskAchievementSuggestions" TEXT NOT NULL,
ADD COLUMN     "task2CoherenceCohesionExamples" TEXT NOT NULL,
ADD COLUMN     "task2CoherenceCohesionRationale" TEXT NOT NULL,
ADD COLUMN     "task2CoherenceCohesionSuggestions" TEXT NOT NULL,
ADD COLUMN     "task2GrammaticalRangeExamples" TEXT NOT NULL,
ADD COLUMN     "task2GrammaticalRangeRationale" TEXT NOT NULL,
ADD COLUMN     "task2GrammaticalRangeSuggestions" TEXT NOT NULL,
ADD COLUMN     "task2KeyStrengths" TEXT[],
ADD COLUMN     "task2KeyWeaknesses" TEXT[],
ADD COLUMN     "task2LexicalResourceExamples" TEXT NOT NULL,
ADD COLUMN     "task2LexicalResourceRationale" TEXT NOT NULL,
ADD COLUMN     "task2LexicalResourceSuggestions" TEXT NOT NULL,
ADD COLUMN     "task2OverallFeedback" TEXT NOT NULL,
ADD COLUMN     "task2PriorityImprovements" TEXT[],
ADD COLUMN     "task2TaskResponse" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "task2TaskResponseExamples" TEXT NOT NULL,
ADD COLUMN     "task2TaskResponseRationale" TEXT NOT NULL,
ADD COLUMN     "task2TaskResponseSuggestions" TEXT NOT NULL;
