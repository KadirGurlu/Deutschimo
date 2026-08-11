import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { PrismaClient } from "@prisma/client";

const root = process.cwd();
const environment = String(process.env.DATABASE_ENVIRONMENT || "").toLowerCase();
if (environment !== "test") {
  console.error("V46.7 upgrade testi yalnızca DATABASE_ENVIRONMENT=test ile çalışır.");
  process.exit(2);
}
const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.error("DATABASE_URL zorunlu.");
  process.exit(2);
}
try {
  const host = new URL(dbUrl).hostname.toLowerCase();
  if (!new Set(["localhost", "127.0.0.1", "::1", "postgres"]).has(host)) {
    throw new Error(`Güvenlik: upgrade testi yalnızca lokal/ephemeral PostgreSQL hedefinde çalışır. Host=${host}`);
  }
} catch (error) {
  console.error(String(error));
  process.exit(2);
}

const npx = process.platform === "win32" ? "npx.cmd" : "npx";
const node = process.execPath;
function run(command, args, options = {}) {
  console.log(`> ${command} ${args.join(" ")}`);
  const result = spawnSync(command, args, { cwd: root, stdio: "inherit", env: process.env, ...options });
  if (result.status !== 0) throw new Error(`Komut başarısız (${result.status}): ${command} ${args.join(" ")}`);
}

const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "deutschimo-v467-upgrade-"));
const tempPrisma = path.join(tempRoot, "prisma");
fs.mkdirSync(path.join(tempPrisma, "migrations"), { recursive: true });
fs.copyFileSync(path.join(root, "prisma", "schema.prisma"), path.join(tempPrisma, "schema.prisma"));
const sourceMigrations = path.join(root, "prisma", "migrations");
const currentMigration = "20260811123000_v46_7_database_integrity";
for (const entry of fs.readdirSync(sourceMigrations, { withFileTypes: true })) {
  if (entry.name === currentMigration) continue;
  const source = path.join(sourceMigrations, entry.name);
  const target = path.join(tempPrisma, "migrations", entry.name);
  if (entry.isDirectory()) fs.cpSync(source, target, { recursive: true });
  else fs.copyFileSync(source, target);
}

console.log("Deutschimo V46.7 upgrade testi: V45/V46 DB şeması -> V46.7");
console.log("Not: repository'de V44 sonrasında V45/V46 için ayrı Prisma migration yoktur; bu test V46.7 öncesindeki tüm migration zincirini uygular.");

try {
  run(npx, ["prisma", "migrate", "deploy", "--schema", path.join(tempPrisma, "schema.prisma")]);

  let prisma = new PrismaClient();
  const userId = "v467-upgrade-user";
  const courseId = "v467-course";
  const unitId = "v467-unit";
  const planDate = "2099-01-01";

  await prisma.course.create({ data: { id: courseId, slug: courseId, level: "A1", title: "V46.7 Upgrade Course", description: "migration sentinel", status: "PUBLISHED", estimatedHours: 1, unitCount: 1 } });
  await prisma.unit.create({ data: { id: unitId, courseId, slug: "unit-1", order: 1, title: "Unit 1", description: "sentinel", estimatedMinutes: 10, status: "PUBLISHED", progressWeights: {}, completionRules: {} } });
  await prisma.user.create({ data: { id: userId, email: "v467-upgrade@deutschimo.test", role: "STUDENT", status: "ACTIVE", currentLevel: "A1", targetLevel: "B2", dailyGoalMinutes: 30, onboardingCompleted: true, isTestUser: true } });
  await prisma.enrollment.create({ data: { id: "v467-enrollment", userId, courseId, status: "COMPLETED", completedAt: new Date("2099-01-01T10:00:00Z") } });
  await prisma.userUnitProgress.create({ data: { id: "v467-progress", userId, courseId, unitId, status: "COMPLETED", stage: "DONE", lessonProgress: 100, exerciseProgress: 100, quizProgress: 100, totalProgress: 100, bestQuizScore: 90, completedSlideIds: ["s1"], completedExerciseIds: ["e1"], startedAt: new Date("2099-01-01T09:00:00Z"), completedAt: new Date("2099-01-01T10:00:00Z") } });
  await prisma.dailyStudyPlan.create({ data: { id: "v467-plan", userId, planDate, goalMinutes: 30, plannedMinutes: 30, completedMinutes: 10, tasks: [{ id: "t1", minutes: 10, completed: true }] } });
  await prisma.masteryAttempt.create({ data: { id: "v467-mastery-attempt", userId, courseId, unitId, questionId: "q1", source: "UPGRADE_TEST", skill: "GRAMMAR", tags: ["tag1"], score: 80, correct: true, hintUsed: false, evidenceWeight: 1, eventKey: "v467-event" } });
  await prisma.masterySkillSnapshot.create({ data: { id: "v467-mastery-skill", userId, scopeKey: `unit:${courseId}:${unitId}`, courseId, unitId, skill: "GRAMMAR", score: 80, evidenceCount: 1, confidence: 0.8 } });
  await prisma.masteryTopicSnapshot.create({ data: { id: "v467-mastery-topic", userId, scopeKey: `unit:${courseId}:${unitId}`, courseId, unitId, tag: "tag1", score: 80, evidenceCount: 1, confidence: 0.8 } });
  await prisma.masteryReviewQueueItem.create({ data: { id: "v467-mastery-queue", userId, courseId, unitId, questionId: "q1", source: "UPGRADE_TEST", skill: "GRAMMAR", tags: ["tag1"], status: "ACTIVE", phase: "RECALL", priorityScore: 50 } });

  const readSentinel = async () => ({
    user: await prisma.user.findUnique({ where: { id: userId }, select: { id: true, email: true, role: true, status: true, currentLevel: true, targetLevel: true, onboardingCompleted: true } }),
    enrollment: await prisma.enrollment.findUnique({ where: { id: "v467-enrollment" } }),
    progress: await prisma.userUnitProgress.findUnique({ where: { id: "v467-progress" } }),
    plan: await prisma.dailyStudyPlan.findUnique({ where: { id: "v467-plan" } }),
    attempt: await prisma.masteryAttempt.findUnique({ where: { id: "v467-mastery-attempt" } }),
    skill: await prisma.masterySkillSnapshot.findUnique({ where: { id: "v467-mastery-skill" } }),
    topic: await prisma.masteryTopicSnapshot.findUnique({ where: { id: "v467-mastery-topic" } }),
    queue: await prisma.masteryReviewQueueItem.findUnique({ where: { id: "v467-mastery-queue" } }),
  });
  const fingerprint = (value) => JSON.stringify(value);
  const before = fingerprint(await readSentinel());
  await prisma.$disconnect();

  run(node, [path.join(root, "scripts", "database-integrity-v46-7.mjs"), "--mode=preflight"]);
  run(npx, ["prisma", "migrate", "deploy"]);
  run(node, [path.join(root, "scripts", "database-integrity-v46-7.mjs"), "--mode=assert"]);

  prisma = new PrismaClient();
  const after = fingerprint(await readSentinel());
  await prisma.$disconnect();

  if (before !== after) {
    console.error("V46.7 upgrade testi: sentinel kullanıcı verisi migration sırasında değişti.");
    process.exitCode = 1;
  } else {
    console.log("V46.7 UPGRADE DATA PRESERVATION PASSED: mevcut kullanıcı/progress/mastery/plan verisi değişmedi.");
  }
} finally {
  fs.rmSync(tempRoot, { recursive: true, force: true });
}
