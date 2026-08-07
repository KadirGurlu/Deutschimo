CREATE TABLE "LearnerOnboardingProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "levelChoice" TEXT,
    "learningGoal" TEXT,
    "dailyMinutes" INTEGER,
    "studyDaysPerWeek" INTEGER,
    "focusSkills" JSONB,
    "resolvedLevel" "Level",
    "estimatedCompletionWeeks" INTEGER,
    "planSummary" JSONB,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "LearnerOnboardingProfile_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "LearnerOnboardingProfile_userId_key" ON "LearnerOnboardingProfile"("userId");
CREATE INDEX "LearnerOnboardingProfile_completedAt_idx" ON "LearnerOnboardingProfile"("completedAt");
ALTER TABLE "LearnerOnboardingProfile" ADD CONSTRAINT "LearnerOnboardingProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
