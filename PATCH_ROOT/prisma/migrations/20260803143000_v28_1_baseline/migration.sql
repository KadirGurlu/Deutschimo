-- Deutschimo V28.1 baseline migration
-- Generated from prisma/schema.prisma for the existing V28 schema.
-- Production marks this migration as applied; fresh preview/test databases apply it normally.

CREATE TYPE "UserRole" AS ENUM ('STUDENT', 'INSTRUCTOR', 'EDITOR', 'MODERATOR', 'ADMIN', 'SUPER_ADMIN');
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'PENDING_VERIFICATION');
CREATE TYPE "Level" AS ENUM ('A1', 'A2', 'B1', 'B2');
CREATE TYPE "EnrollmentStatus" AS ENUM ('ACTIVE', 'PAUSED', 'COMPLETED');
CREATE TYPE "ContentStatus" AS ENUM ('DRAFT', 'REVIEW', 'PUBLISHED', 'ARCHIVED');
CREATE TYPE "AssessmentSourceType" AS ENUM ('EXERCISE', 'UNIT_QUIZ', 'SKILL_LAB', 'PLACEMENT', 'SMART_REVIEW');
CREATE TYPE "AssessmentSkill" AS ENUM ('GRAMMAR', 'VOCABULARY', 'COMMUNICATION', 'READING', 'LISTENING', 'WRITING', 'SPEAKING', 'PRONUNCIATION');
CREATE TYPE "CognitiveLevel" AS ENUM ('REMEMBER', 'UNDERSTAND', 'APPLY', 'ANALYZE', 'CREATE');
CREATE TYPE "ExerciseType" AS ENUM ('MULTIPLE_CHOICE', 'MULTIPLE_SELECT', 'TRUE_FALSE', 'FILL_IN_THE_BLANK', 'MATCHING', 'SENTENCE_ORDERING', 'TRANSLATION', 'DIALOGUE_COMPLETION', 'SHORT_ANSWER', 'WRITING_ASSIGNMENT');

CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "firstName" TEXT,
    "lastName" TEXT,
    "email" TEXT,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "passwordHash" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'STUDENT',
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "currentLevel" "Level" NOT NULL DEFAULT 'A1',
    "targetLevel" "Level" NOT NULL DEFAULT 'B2',
    "dailyGoalMinutes" INTEGER NOT NULL DEFAULT 30,
    "onboardingCompleted" BOOLEAN NOT NULL DEFAULT false,
    "isTestUser" BOOLEAN NOT NULL DEFAULT false,
    "privacyAcceptedAt" TIMESTAMP(3),
    "cookieConsentAt" TIMESTAMP(3),
    "accountDeletionRequestedAt" TIMESTAMP(3),
    "lastSeenAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Account" (
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,
    CONSTRAINT "Account_pkey" PRIMARY KEY ("provider", "providerAccountId")
);

CREATE TABLE "Session" (
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "VerificationToken_pkey" PRIMARY KEY ("identifier", "token")
);

CREATE TABLE "EmailVerificationToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EmailVerificationToken_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PasswordResetToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Course" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "level" "Level" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" "ContentStatus" NOT NULL DEFAULT 'PUBLISHED',
    "estimatedHours" INTEGER NOT NULL DEFAULT 0,
    "unitCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Course_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Unit" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "estimatedMinutes" INTEGER NOT NULL DEFAULT 0,
    "status" "ContentStatus" NOT NULL DEFAULT 'PUBLISHED',
    "prerequisiteUnitId" TEXT,
    "progressWeights" JSONB NOT NULL,
    "completionRules" JSONB NOT NULL,
    "contentPayload" JSONB,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Unit_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Exercise" (
    "id" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "groupId" TEXT,
    "order" INTEGER NOT NULL,
    "type" "ExerciseType" NOT NULL,
    "title" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "options" JSONB,
    "correctAnswer" JSONB NOT NULL,
    "acceptedAnswers" JSONB,
    "explanation" TEXT NOT NULL,
    "relatedSlideId" TEXT,
    "isRequired" BOOLEAN NOT NULL DEFAULT true,
    "maxAttempts" INTEGER NOT NULL DEFAULT 2,
    "points" INTEGER NOT NULL DEFAULT 10,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Exercise_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Enrollment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "status" "EnrollmentStatus" NOT NULL DEFAULT 'ACTIVE',
    "enrolledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    CONSTRAINT "Enrollment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "LearningStateSnapshot" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "state" JSONB NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 12,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LearningStateSnapshot_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "UserUnitProgress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "stage" TEXT NOT NULL,
    "lessonProgress" INTEGER NOT NULL DEFAULT 0,
    "exerciseProgress" INTEGER NOT NULL DEFAULT 0,
    "quizProgress" INTEGER NOT NULL DEFAULT 0,
    "totalProgress" INTEGER NOT NULL DEFAULT 0,
    "bestQuizScore" INTEGER,
    "completedSlideIds" JSONB NOT NULL,
    "completedExerciseIds" JSONB NOT NULL,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "lastVisitedAt" TIMESTAMP(3),
    CONSTRAINT "UserUnitProgress_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "UserActivityEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "unitId" TEXT,
    "itemId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "UserActivityEvent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "StudySession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "unitId" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "endedAt" TIMESTAMP(3),
    "activeSeconds" INTEGER NOT NULL DEFAULT 0,
    "sessionType" TEXT NOT NULL,
    "deviceType" TEXT NOT NULL,
    CONSTRAINT "StudySession_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PlacementAssessment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "answers" JSONB NOT NULL,
    "levelScores" JSONB NOT NULL,
    "strengths" JSONB NOT NULL,
    "weakTopics" JSONB NOT NULL,
    "recommendedLevel" "Level" NOT NULL,
    "totalScore" INTEGER NOT NULL,
    "correctCount" INTEGER NOT NULL,
    "questionCount" INTEGER NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PlacementAssessment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "LearningInsightSnapshot" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "weakTopics" JSONB NOT NULL,
    "strengths" JSONB NOT NULL,
    "hasEnoughData" BOOLEAN NOT NULL DEFAULT false,
    "sourceVersion" INTEGER NOT NULL DEFAULT 12,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "LearningInsightSnapshot_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "DailyStudyPlan" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "planDate" TEXT NOT NULL,
    "goalMinutes" INTEGER NOT NULL,
    "plannedMinutes" INTEGER NOT NULL,
    "completedMinutes" INTEGER NOT NULL DEFAULT 0,
    "tasks" JSONB NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "DailyStudyPlan_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SmartReviewState" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "queue" JSONB NOT NULL,
    "completedIds" JSONB NOT NULL,
    "attempts" JSONB NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "SmartReviewState_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "actorUserId" TEXT,
    "actorEmail" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "summary" TEXT NOT NULL,
    "before" JSONB,
    "after" JSONB,
    "metadata" JSONB,
    "ipHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SystemErrorLog" (
    "id" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "route" TEXT,
    "method" TEXT,
    "message" TEXT NOT NULL,
    "stack" TEXT,
    "digest" TEXT,
    "fingerprint" TEXT,
    "requestId" TEXT,
    "ipHash" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SystemErrorLog_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ApiFailureLog" (
    "id" TEXT NOT NULL,
    "route" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "statusCode" INTEGER NOT NULL,
    "requestId" TEXT,
    "ipHash" TEXT,
    "userAgent" TEXT,
    "message" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ApiFailureLog_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "LoginAttempt" (
    "id" TEXT NOT NULL,
    "emailHash" TEXT NOT NULL,
    "ipHash" TEXT NOT NULL,
    "success" BOOLEAN NOT NULL DEFAULT false,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LoginAttempt_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "RateLimitEvent" (
    "id" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "keyHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RateLimitEvent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "DatabaseBackup" (
    "id" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "storageProvider" TEXT,
    "pathname" TEXT,
    "downloadUrl" TEXT,
    "checksum" TEXT,
    "byteSize" INTEGER,
    "tableCounts" JSONB,
    "errorMessage" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    CONSTRAINT "DatabaseBackup_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AccountDeletionLog" (
    "id" TEXT NOT NULL,
    "userIdHash" TEXT NOT NULL,
    "emailHash" TEXT,
    "deletionType" TEXT NOT NULL,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "metadata" JSONB,
    CONSTRAINT "AccountDeletionLog_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SkillLabAttempt" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "skill" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "level" "Level" NOT NULL,
    "score" INTEGER NOT NULL,
    "durationSeconds" INTEGER,
    "answerPayload" JSONB,
    "transcript" TEXT,
    "feedback" JSONB,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SkillLabAttempt_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "VocabularySet" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "level" "Level",
    "unitId" TEXT,
    "unitTitle" TEXT,
    "origin" TEXT NOT NULL DEFAULT 'USER',
    "sourceSlug" TEXT,
    "lastStudiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "VocabularySet_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "VocabularyNotebookItem" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "setId" TEXT,
    "word" TEXT NOT NULL,
    "article" TEXT,
    "plural" TEXT,
    "translation" TEXT NOT NULL,
    "pronunciation" TEXT,
    "wordType" TEXT,
    "example" TEXT,
    "exampleTranslation" TEXT,
    "verbConjugation" JSONB,
    "perfectForm" TEXT,
    "governedPreposition" TEXT,
    "sourceSkill" TEXT NOT NULL,
    "sourceTaskId" TEXT NOT NULL,
    "sourceCourseId" TEXT,
    "sourceUnitId" TEXT,
    "sourceUnitTitle" TEXT,
    "notes" TEXT,
    "mastery" INTEGER NOT NULL DEFAULT 0,
    "nextReviewAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastReviewedAt" TIMESTAMP(3),
    "reviewCount" INTEGER NOT NULL DEFAULT 0,
    "correctStreak" INTEGER NOT NULL DEFAULT 0,
    "lapseCount" INTEGER NOT NULL DEFAULT 0,
    "intervalDays" INTEGER NOT NULL DEFAULT 0,
    "easeFactor" DOUBLE PRECISION NOT NULL DEFAULT 2.5,
    "lastRating" TEXT,
    "suspended" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "VocabularyNotebookItem_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "VocabularyReviewAttempt" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "mode" TEXT NOT NULL,
    "rating" TEXT NOT NULL,
    "correct" BOOLEAN NOT NULL,
    "answer" TEXT,
    "expected" TEXT,
    "responseMs" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "VocabularyReviewAttempt_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AssessmentEvidence" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sourceType" "AssessmentSourceType" NOT NULL,
    "sourceId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "unitId" TEXT,
    "level" "Level" NOT NULL,
    "skill" "AssessmentSkill" NOT NULL,
    "difficulty" INTEGER NOT NULL,
    "cognitiveLevel" "CognitiveLevel" NOT NULL,
    "objectiveCodes" JSONB NOT NULL,
    "topicTags" JSONB NOT NULL,
    "correct" BOOLEAN NOT NULL,
    "answer" JSONB,
    "correctAnswer" JSONB,
    "explanation" TEXT,
    "relatedSlideId" TEXT,
    "responseMs" INTEGER,
    "attemptNumber" INTEGER NOT NULL DEFAULT 1,
    "pointsPossible" INTEGER NOT NULL DEFAULT 10,
    "pointsEarned" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AssessmentEvidence_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CompetencyRecord" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "objectiveCode" TEXT NOT NULL,
    "unitId" TEXT,
    "level" "Level" NOT NULL,
    "skill" "AssessmentSkill" NOT NULL,
    "topic" TEXT NOT NULL,
    "mastery" INTEGER NOT NULL DEFAULT 0,
    "confidence" INTEGER NOT NULL DEFAULT 0,
    "points" INTEGER NOT NULL DEFAULT 0,
    "evidenceCount" INTEGER NOT NULL DEFAULT 0,
    "correctCount" INTEGER NOT NULL DEFAULT 0,
    "incorrectCount" INTEGER NOT NULL DEFAULT 0,
    "averageResponseMs" INTEGER,
    "lastEvidenceAt" TIMESTAMP(3),
    "nextReviewAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "CompetencyRecord_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "LearningErrorHistory" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sourceType" "AssessmentSourceType" NOT NULL,
    "sourceId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "unitId" TEXT,
    "level" "Level" NOT NULL,
    "skill" "AssessmentSkill" NOT NULL,
    "objectiveCode" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "userAnswer" JSONB,
    "correctAnswer" JSONB,
    "explanation" TEXT,
    "relatedSlideId" TEXT,
    "occurrenceCount" INTEGER NOT NULL DEFAULT 1,
    "firstOccurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastOccurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),
    "metadata" JSONB,
    CONSTRAINT "LearningErrorHistory_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");
CREATE UNIQUE INDEX "EmailVerificationToken_tokenHash_key" ON "EmailVerificationToken"("tokenHash");
CREATE UNIQUE INDEX "PasswordResetToken_tokenHash_key" ON "PasswordResetToken"("tokenHash");
CREATE UNIQUE INDEX "Course_slug_key" ON "Course"("slug");
CREATE UNIQUE INDEX "Unit_courseId_slug_key" ON "Unit"("courseId", "slug");
CREATE UNIQUE INDEX "Enrollment_userId_courseId_key" ON "Enrollment"("userId", "courseId");
CREATE UNIQUE INDEX "LearningStateSnapshot_userId_key" ON "LearningStateSnapshot"("userId");
CREATE UNIQUE INDEX "UserUnitProgress_userId_unitId_key" ON "UserUnitProgress"("userId", "unitId");
CREATE UNIQUE INDEX "LearningInsightSnapshot_userId_key" ON "LearningInsightSnapshot"("userId");
CREATE UNIQUE INDEX "DailyStudyPlan_userId_planDate_key" ON "DailyStudyPlan"("userId", "planDate");
CREATE UNIQUE INDEX "SmartReviewState_userId_key" ON "SmartReviewState"("userId");
CREATE UNIQUE INDEX "VocabularyNotebookItem_userId_word_sourceTaskId_key" ON "VocabularyNotebookItem"("userId", "word", "sourceTaskId");
CREATE UNIQUE INDEX "CompetencyRecord_userId_objectiveCode_key" ON "CompetencyRecord"("userId", "objectiveCode");
CREATE UNIQUE INDEX "LearningErrorHistory_userId_sourceType_sourceId_objectiveCode_key" ON "LearningErrorHistory"("userId", "sourceType", "sourceId", "objectiveCode");
CREATE INDEX "User_role_status_idx" ON "User"("role", "status");
CREATE INDEX "User_createdAt_idx" ON "User"("createdAt");
CREATE INDEX "EmailVerificationToken_userId_idx" ON "EmailVerificationToken"("userId");
CREATE INDEX "PasswordResetToken_userId_idx" ON "PasswordResetToken"("userId");
CREATE INDEX "Unit_courseId_order_idx" ON "Unit"("courseId", "order");
CREATE INDEX "Exercise_unitId_order_idx" ON "Exercise"("unitId", "order");
CREATE INDEX "Enrollment_courseId_status_idx" ON "Enrollment"("courseId", "status");
CREATE INDEX "UserUnitProgress_userId_courseId_idx" ON "UserUnitProgress"("userId", "courseId");
CREATE INDEX "UserUnitProgress_courseId_status_idx" ON "UserUnitProgress"("courseId", "status");
CREATE INDEX "UserActivityEvent_userId_createdAt_idx" ON "UserActivityEvent"("userId", "createdAt");
CREATE INDEX "UserActivityEvent_eventType_createdAt_idx" ON "UserActivityEvent"("eventType", "createdAt");
CREATE INDEX "StudySession_userId_startedAt_idx" ON "StudySession"("userId", "startedAt");
CREATE INDEX "PlacementAssessment_userId_completedAt_idx" ON "PlacementAssessment"("userId", "completedAt");
CREATE INDEX "DailyStudyPlan_userId_planDate_idx" ON "DailyStudyPlan"("userId", "planDate");
CREATE INDEX "AuditLog_actorUserId_createdAt_idx" ON "AuditLog"("actorUserId", "createdAt");
CREATE INDEX "AuditLog_action_createdAt_idx" ON "AuditLog"("action", "createdAt");
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");
CREATE INDEX "SystemErrorLog_createdAt_idx" ON "SystemErrorLog"("createdAt");
CREATE INDEX "SystemErrorLog_fingerprint_createdAt_idx" ON "SystemErrorLog"("fingerprint", "createdAt");
CREATE INDEX "ApiFailureLog_route_createdAt_idx" ON "ApiFailureLog"("route", "createdAt");
CREATE INDEX "ApiFailureLog_statusCode_createdAt_idx" ON "ApiFailureLog"("statusCode", "createdAt");
CREATE INDEX "LoginAttempt_emailHash_createdAt_idx" ON "LoginAttempt"("emailHash", "createdAt");
CREATE INDEX "LoginAttempt_ipHash_createdAt_idx" ON "LoginAttempt"("ipHash", "createdAt");
CREATE INDEX "RateLimitEvent_scope_keyHash_createdAt_idx" ON "RateLimitEvent"("scope", "keyHash", "createdAt");
CREATE INDEX "DatabaseBackup_startedAt_idx" ON "DatabaseBackup"("startedAt");
CREATE INDEX "DatabaseBackup_status_startedAt_idx" ON "DatabaseBackup"("status", "startedAt");
CREATE INDEX "AccountDeletionLog_requestedAt_idx" ON "AccountDeletionLog"("requestedAt");
CREATE INDEX "SkillLabAttempt_userId_skill_completedAt_idx" ON "SkillLabAttempt"("userId", "skill", "completedAt");
CREATE INDEX "SkillLabAttempt_taskId_completedAt_idx" ON "SkillLabAttempt"("taskId", "completedAt");
CREATE INDEX "VocabularySet_userId_updatedAt_idx" ON "VocabularySet"("userId", "updatedAt");
CREATE INDEX "VocabularySet_userId_level_idx" ON "VocabularySet"("userId", "level");
CREATE INDEX "VocabularyNotebookItem_userId_setId_idx" ON "VocabularyNotebookItem"("userId", "setId");
CREATE INDEX "VocabularyNotebookItem_userId_nextReviewAt_idx" ON "VocabularyNotebookItem"("userId", "nextReviewAt");
CREATE INDEX "VocabularyNotebookItem_userId_mastery_idx" ON "VocabularyNotebookItem"("userId", "mastery");
CREATE INDEX "VocabularyNotebookItem_userId_createdAt_idx" ON "VocabularyNotebookItem"("userId", "createdAt");
CREATE INDEX "VocabularyReviewAttempt_userId_createdAt_idx" ON "VocabularyReviewAttempt"("userId", "createdAt");
CREATE INDEX "VocabularyReviewAttempt_itemId_createdAt_idx" ON "VocabularyReviewAttempt"("itemId", "createdAt");
CREATE INDEX "VocabularyReviewAttempt_rating_createdAt_idx" ON "VocabularyReviewAttempt"("rating", "createdAt");
CREATE INDEX "AssessmentEvidence_userId_createdAt_idx" ON "AssessmentEvidence"("userId", "createdAt");
CREATE INDEX "AssessmentEvidence_userId_skill_createdAt_idx" ON "AssessmentEvidence"("userId", "skill", "createdAt");
CREATE INDEX "AssessmentEvidence_sourceType_sourceId_idx" ON "AssessmentEvidence"("sourceType", "sourceId");
CREATE INDEX "AssessmentEvidence_unitId_createdAt_idx" ON "AssessmentEvidence"("unitId", "createdAt");
CREATE INDEX "CompetencyRecord_userId_mastery_idx" ON "CompetencyRecord"("userId", "mastery");
CREATE INDEX "CompetencyRecord_userId_skill_idx" ON "CompetencyRecord"("userId", "skill");
CREATE INDEX "CompetencyRecord_objectiveCode_idx" ON "CompetencyRecord"("objectiveCode");
CREATE INDEX "LearningErrorHistory_userId_resolvedAt_lastOccurredAt_idx" ON "LearningErrorHistory"("userId", "resolvedAt", "lastOccurredAt");
CREATE INDEX "LearningErrorHistory_objectiveCode_lastOccurredAt_idx" ON "LearningErrorHistory"("objectiveCode", "lastOccurredAt");
CREATE INDEX "LearningErrorHistory_unitId_lastOccurredAt_idx" ON "LearningErrorHistory"("unitId", "lastOccurredAt");

ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EmailVerificationToken" ADD CONSTRAINT "EmailVerificationToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PasswordResetToken" ADD CONSTRAINT "PasswordResetToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Unit" ADD CONSTRAINT "Unit_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Exercise" ADD CONSTRAINT "Exercise_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "LearningStateSnapshot" ADD CONSTRAINT "LearningStateSnapshot_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UserUnitProgress" ADD CONSTRAINT "UserUnitProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UserActivityEvent" ADD CONSTRAINT "UserActivityEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StudySession" ADD CONSTRAINT "StudySession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PlacementAssessment" ADD CONSTRAINT "PlacementAssessment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "LearningInsightSnapshot" ADD CONSTRAINT "LearningInsightSnapshot_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DailyStudyPlan" ADD CONSTRAINT "DailyStudyPlan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SmartReviewState" ADD CONSTRAINT "SmartReviewState_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SkillLabAttempt" ADD CONSTRAINT "SkillLabAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "VocabularySet" ADD CONSTRAINT "VocabularySet_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "VocabularyNotebookItem" ADD CONSTRAINT "VocabularyNotebookItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "VocabularyNotebookItem" ADD CONSTRAINT "VocabularyNotebookItem_setId_fkey" FOREIGN KEY ("setId") REFERENCES "VocabularySet"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "VocabularyReviewAttempt" ADD CONSTRAINT "VocabularyReviewAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "VocabularyReviewAttempt" ADD CONSTRAINT "VocabularyReviewAttempt_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "VocabularyNotebookItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AssessmentEvidence" ADD CONSTRAINT "AssessmentEvidence_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CompetencyRecord" ADD CONSTRAINT "CompetencyRecord_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "LearningErrorHistory" ADD CONSTRAINT "LearningErrorHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
