import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";
import { assertNonProduction, printDatabaseContext } from "./db-safety.mjs";

const action = (process.argv[2] || "list").toLowerCase();
const context = assertNonProduction("Test verisi işlemi");
printDatabaseContext(context, "Test verisi hedefi");
const prisma = new PrismaClient();
const previewDate = new Date().toISOString().slice(0, 10);
const fixedDate = new Date(`${previewDate}T09:00:00.000Z`);
const password = process.env.TEST_USER_PASSWORD || "DeutschimoTest2026!";

const courses = [
  { id: "a1", slug: "a1", level: "A1", title: "A1 · Almancaya Başlangıç", description: "Temel günlük iletişim ve başlangıç grameri.", estimatedHours: 60, unitCount: 12 },
  { id: "a2", slug: "a2", level: "A2", title: "A2 · Temel İletişim", description: "Günlük hayatta daha bağımsız iletişim.", estimatedHours: 90, unitCount: 16 },
  { id: "b1", slug: "b1", level: "B1", title: "B1 · Bağımsız Dil Kullanımı", description: "Deneyim, görüş ve gerekçeleri ifade etme.", estimatedHours: 130, unitCount: 18 },
  { id: "b2", slug: "b2", level: "B2", title: "B2 · Akademik ve Profesyonel Almanca", description: "Karmaşık metinler ve profesyonel iletişim.", estimatedHours: 180, unitCount: 20 },
];

const users = [
  { id: "test-v281-a1", email: "test.a1@preview.deutschimo.test", firstName: "Anna", lastName: "Test", role: "STUDENT", currentLevel: "A1", targetLevel: "A2", courseId: "a1", progress: 35 },
  { id: "test-v281-a2", email: "test.a2@preview.deutschimo.test", firstName: "Lukas", lastName: "Test", role: "STUDENT", currentLevel: "A2", targetLevel: "B1", courseId: "a2", progress: 58 },
  { id: "test-v281-b1", email: "test.b1@preview.deutschimo.test", firstName: "Sophie", lastName: "Test", role: "STUDENT", currentLevel: "B1", targetLevel: "B2", courseId: "b1", progress: 76 },
  { id: "test-v281-editor", email: "test.editor@preview.deutschimo.test", firstName: "Mia", lastName: "Editor", role: "EDITOR", currentLevel: "B2", targetLevel: "B2", courseId: null, progress: 0 },
];

async function clean() {
  const testUsers = await prisma.user.findMany({ where: { isTestUser: true }, select: { id: true } });
  const ids = testUsers.map((user) => user.id);
  if (ids.length) {
    await prisma.auditLog.deleteMany({ where: { actorUserId: { in: ids } } });
    await prisma.user.deleteMany({ where: { id: { in: ids }, isTestUser: true } });
  }
  console.log(`${ids.length} test kullanıcısı ve ilişkili kayıtları temizlendi.`);
}

async function seed() {
  for (const course of courses) {
    await prisma.course.upsert({
      where: { id: course.id },
      create: { ...course, status: "PUBLISHED" },
      update: { ...course, status: "PUBLISHED" },
    });
  }

  const passwordHash = await hash(password, 10);
  for (const definition of users) {
    const user = await prisma.user.upsert({
      where: { email: definition.email },
      create: {
        id: definition.id,
        email: definition.email,
        name: `${definition.firstName} ${definition.lastName}`,
        firstName: definition.firstName,
        lastName: definition.lastName,
        passwordHash,
        role: definition.role,
        status: "ACTIVE",
        currentLevel: definition.currentLevel,
        targetLevel: definition.targetLevel,
        dailyGoalMinutes: 30,
        onboardingCompleted: true,
        isTestUser: true,
        emailVerified: fixedDate,
        privacyAcceptedAt: fixedDate,
        cookieConsentAt: fixedDate,
        lastSeenAt: fixedDate,
      },
      update: {
        name: `${definition.firstName} ${definition.lastName}`,
        firstName: definition.firstName,
        lastName: definition.lastName,
        passwordHash,
        role: definition.role,
        status: "ACTIVE",
        currentLevel: definition.currentLevel,
        targetLevel: definition.targetLevel,
        onboardingCompleted: true,
        isTestUser: true,
        emailVerified: fixedDate,
      },
    });

    if (!definition.courseId) continue;
    await prisma.enrollment.upsert({
      where: { userId_courseId: { userId: user.id, courseId: definition.courseId } },
      create: { userId: user.id, courseId: definition.courseId, status: "ACTIVE", enrolledAt: fixedDate },
      update: { status: "ACTIVE" },
    });

    const unitId = `${definition.courseId}-u01`;
    await prisma.userUnitProgress.upsert({
      where: { userId_unitId: { userId: user.id, unitId } },
      create: {
        id: `progress-${user.id}`,
        userId: user.id,
        courseId: definition.courseId,
        unitId,
        status: "IN_PROGRESS",
        stage: "EXERCISES",
        lessonProgress: 100,
        exerciseProgress: definition.progress,
        quizProgress: 0,
        totalProgress: definition.progress,
        completedSlideIds: ["slide-1", "slide-2"],
        completedExerciseIds: ["exercise-1"],
        startedAt: fixedDate,
        lastVisitedAt: fixedDate,
      },
      update: {
        status: "IN_PROGRESS",
        stage: "EXERCISES",
        lessonProgress: 100,
        exerciseProgress: definition.progress,
        totalProgress: definition.progress,
        completedSlideIds: ["slide-1", "slide-2"],
        completedExerciseIds: ["exercise-1"],
        lastVisitedAt: fixedDate,
      },
    });

    await prisma.learningStateSnapshot.upsert({
      where: { userId: user.id },
      create: {
        id: `snapshot-${user.id}`,
        userId: user.id,
        version: 28,
        state: { source: "V28.1_PREVIEW", activeCourseId: definition.courseId, totalProgress: definition.progress },
      },
      update: { version: 28, state: { source: "V28.1_PREVIEW", activeCourseId: definition.courseId, totalProgress: definition.progress } },
    });

    await prisma.dailyStudyPlan.upsert({
      where: { userId_planDate: { userId: user.id, planDate: previewDate } },
      create: {
        id: `plan-${user.id}`,
        userId: user.id,
        planDate: previewDate,
        goalMinutes: 30,
        plannedMinutes: 30,
        completedMinutes: 10,
        tasks: [{ id: "preview-task-1", type: "LESSON", courseId: definition.courseId, unitId, title: "Preview ders görevi", completed: false }],
      },
      update: {
        goalMinutes: 30,
        plannedMinutes: 30,
        completedMinutes: 10,
        tasks: [{ id: "preview-task-1", type: "LESSON", courseId: definition.courseId, unitId, title: "Preview ders görevi", completed: false }],
      },
    });

    await prisma.placementAssessment.upsert({
      where: { id: `placement-${user.id}` },
      create: {
        id: `placement-${user.id}`,
        userId: user.id,
        answers: [{ questionId: "preview-q1", answer: "A" }],
        levelScores: { A1: 80, A2: 55, B1: 35, B2: 15 },
        strengths: ["kelime"],
        weakTopics: ["artikel"],
        recommendedLevel: definition.currentLevel,
        totalScore: 70,
        correctCount: 17,
        questionCount: 24,
        completedAt: fixedDate,
      },
      update: {
        answers: [{ questionId: "preview-q1", answer: "A" }],
        levelScores: { A1: 80, A2: 55, B1: 35, B2: 15 },
        strengths: ["kelime"],
        weakTopics: ["artikel"],
        recommendedLevel: definition.currentLevel,
        totalScore: 70,
        correctCount: 17,
        questionCount: 24,
        completedAt: fixedDate,
      },
    });

    const set = await prisma.vocabularySet.upsert({
      where: { id: `vocab-set-${user.id}` },
      create: {
        id: `vocab-set-${user.id}`,
        userId: user.id,
        title: "V28.1 Preview Kelimeleri",
        description: "Staging ve migration testleri için deterministik kelime seti.",
        level: definition.currentLevel,
        unitId,
        unitTitle: "Preview ünitesi",
        origin: "TEST",
        sourceSlug: "v28-1-preview",
        lastStudiedAt: fixedDate,
      },
      update: { title: "V28.1 Preview Kelimeleri", origin: "TEST", lastStudiedAt: fixedDate },
    });

    await prisma.vocabularyNotebookItem.upsert({
      where: { userId_word_sourceTaskId: { userId: user.id, word: "lernen", sourceTaskId: "v28-1-preview" } },
      create: {
        id: `vocab-item-${user.id}`,
        userId: user.id,
        setId: set.id,
        word: "lernen",
        translation: "öğrenmek",
        wordType: "Verb",
        example: "Ich lerne jeden Tag Deutsch.",
        exampleTranslation: "Her gün Almanca öğreniyorum.",
        sourceSkill: "VOCABULARY",
        sourceTaskId: "v28-1-preview",
        sourceCourseId: definition.courseId,
        sourceUnitId: unitId,
        sourceUnitTitle: "Preview ünitesi",
        mastery: 40,
        nextReviewAt: fixedDate,
      },
      update: { setId: set.id, translation: "öğrenmek", mastery: 40, nextReviewAt: fixedDate },
    });

    await prisma.assessmentEvidence.upsert({
      where: { id: `evidence-${user.id}` },
      create: {
        id: `evidence-${user.id}`,
        userId: user.id,
        sourceType: "EXERCISE",
        sourceId: "v28-1-preview-exercise",
        courseId: definition.courseId,
        unitId,
        level: definition.currentLevel,
        skill: "GRAMMAR",
        difficulty: 1,
        cognitiveLevel: "APPLY",
        objectiveCodes: ["V28.1-PREVIEW"],
        topicTags: ["staging", "migration"],
        correct: true,
        answer: "lerne",
        correctAnswer: "lerne",
        explanation: "Preview test kaydı.",
        responseMs: 1500,
        pointsPossible: 10,
        pointsEarned: 10,
        createdAt: fixedDate,
      },
      update: { correct: true, answer: "lerne", correctAnswer: "lerne", responseMs: 1500, pointsEarned: 10 },
    });
  }

  console.log(`${users.length} deterministik V28.1 test kullanıcısı hazırlandı.`);
  console.log("Test kullanıcılarının şifresi TEST_USER_PASSWORD değişkeninden alındı.");
  for (const user of users) console.log(`- ${user.email} (${user.role})`);
}

async function list() {
  const records = await prisma.user.findMany({
    where: { isTestUser: true },
    orderBy: { email: "asc" },
    select: { id: true, email: true, role: true, currentLevel: true, status: true },
  });
  console.table(records);
  console.log(`Toplam test kullanıcısı: ${records.length}`);
  return records;
}

async function assertSeeded() {
  const count = await prisma.user.count({ where: { isTestUser: true } });
  if (count < users.length) throw new Error(`En az ${users.length} test kullanıcısı bekleniyordu, ${count} bulundu.`);
  console.log(`Test verisi doğrulandı: ${count} kullanıcı.`);
}

async function assertClean() {
  const count = await prisma.user.count({ where: { isTestUser: true } });
  if (count !== 0) throw new Error(`Test verisi temiz değil: ${count} test kullanıcısı kaldı.`);
  console.log("Test verisi temizliği doğrulandı.");
}

try {
  if (action === "seed") await seed();
  else if (action === "reset") { await clean(); await seed(); }
  else if (action === "clean") await clean();
  else if (action === "assert") await assertSeeded();
  else if (action === "assert-clean") await assertClean();
  else if (action === "list") await list();
  else throw new Error(`Bilinmeyen test verisi işlemi: ${action}`);
} finally {
  await prisma.$disconnect();
}
