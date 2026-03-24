-- CreateEnum
CREATE TYPE "TestStatus" AS ENUM ('IN_PROGRESS', 'COMPLETED', 'ABANDONED');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "googleId" TEXT,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "avatarUrl" TEXT,
    "refreshToken" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "skill_types" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "skill_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "skill_contents" (
    "id" TEXT NOT NULL,
    "skillTypeId" INTEGER NOT NULL,
    "contentJson" JSONB NOT NULL,
    "audioUrl" TEXT,
    "source" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "skill_contents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "skill_tests" (
    "id" TEXT NOT NULL,
    "skillContentId" TEXT NOT NULL,
    "skillTypeId" INTEGER NOT NULL,
    "numberOfVisits" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "skill_tests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "practice_tests" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,

    CONSTRAINT "practice_tests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "practice_test_skills" (
    "id" TEXT NOT NULL,
    "practiceTestId" TEXT NOT NULL,
    "skillTestId" TEXT NOT NULL,

    CONSTRAINT "practice_test_skills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tests" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "practiceTestId" TEXT NOT NULL,
    "status" "TestStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "totalScore" DOUBLE PRECISION,
    "maxScore" DOUBLE PRECISION,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "test_skill_attempts" (
    "id" TEXT NOT NULL,
    "testId" TEXT NOT NULL,
    "skillTestId" TEXT NOT NULL,
    "score" DOUBLE PRECISION,
    "maxScore" DOUBLE PRECISION,
    "bandScore" DOUBLE PRECISION,
    "timeSpentSec" INTEGER,
    "submittedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "test_skill_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "test_answers" (
    "id" TEXT NOT NULL,
    "attemptId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "userAnswer" TEXT,
    "correctAnswer" TEXT,
    "isCorrect" BOOLEAN,
    "timeSpentSec" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "test_answers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_googleId_key" ON "users"("googleId");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "skill_types_name_key" ON "skill_types"("name");

-- CreateIndex
CREATE UNIQUE INDEX "practice_test_skills_practiceTestId_skillTestId_key" ON "practice_test_skills"("practiceTestId", "skillTestId");

-- CreateIndex
CREATE UNIQUE INDEX "test_skill_attempts_testId_skillTestId_key" ON "test_skill_attempts"("testId", "skillTestId");

-- AddForeignKey
ALTER TABLE "skill_contents" ADD CONSTRAINT "skill_contents_skillTypeId_fkey" FOREIGN KEY ("skillTypeId") REFERENCES "skill_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "skill_tests" ADD CONSTRAINT "skill_tests_skillContentId_fkey" FOREIGN KEY ("skillContentId") REFERENCES "skill_contents"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "skill_tests" ADD CONSTRAINT "skill_tests_skillTypeId_fkey" FOREIGN KEY ("skillTypeId") REFERENCES "skill_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "practice_test_skills" ADD CONSTRAINT "practice_test_skills_practiceTestId_fkey" FOREIGN KEY ("practiceTestId") REFERENCES "practice_tests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "practice_test_skills" ADD CONSTRAINT "practice_test_skills_skillTestId_fkey" FOREIGN KEY ("skillTestId") REFERENCES "skill_tests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tests" ADD CONSTRAINT "tests_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tests" ADD CONSTRAINT "tests_practiceTestId_fkey" FOREIGN KEY ("practiceTestId") REFERENCES "practice_tests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_skill_attempts" ADD CONSTRAINT "test_skill_attempts_testId_fkey" FOREIGN KEY ("testId") REFERENCES "tests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_skill_attempts" ADD CONSTRAINT "test_skill_attempts_skillTestId_fkey" FOREIGN KEY ("skillTestId") REFERENCES "skill_tests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_answers" ADD CONSTRAINT "test_answers_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "test_skill_attempts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
