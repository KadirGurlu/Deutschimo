import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const modeArg = process.argv.find((arg) => arg.startsWith("--mode="));
const mode = modeArg?.split("=")[1] || "preflight";
if (!new Set(["preflight", "assert"]).has(mode)) {
  console.error("V46.7 DB integrity: --mode=preflight veya --mode=assert kullanÄ±n.");
  process.exit(2);
}

let failed = false;
const failures = [];
const warnings = [];

function fail(message) {
  failed = true;
  failures.push(message);
  console.error(`âœ— ${message}`);
}
function ok(message) { console.log(`âœ“ ${message}`); }
function warn(message) { warnings.push(message); console.warn(`! ${message}`); }

function qIdent(value) {
  return `"${String(value).replaceAll('"', '""')}"`;
}

async function tableExists(table) {
  const rows = await prisma.$queryRawUnsafe(
    `SELECT EXISTS (
       SELECT 1
       FROM information_schema.tables
       WHERE table_schema = 'public' AND table_name = $1
     ) AS "exists"`,
    table,
  );
  return rows?.[0]?.exists === true;
}

async function count(sql, ...params) {
  const rows = await prisma.$queryRawUnsafe(sql, ...params);
  return Number(rows?.[0]?.count ?? 0);
}

const expectedTables = [
  "User", "Course", "Unit", "Enrollment", "UserUnitProgress", "DailyStudyPlan",
  "MasteryAttempt", "MasterySkillSnapshot", "MasteryTopicSnapshot", "MasteryReviewQueueItem",
  "WritingCoachAttempt", "RealGermanyScenarioProgress", "RealGermanyScenarioAttempt", "CmsContentRevision",
];

const duplicateChecks = [
  ["duplicate enrollment", "Enrollment", ["userId", "courseId"]],
  ["duplicate progress/completion", "UserUnitProgress", ["userId", "unitId"]],
  ["duplicate daily plan", "DailyStudyPlan", ["userId", "planDate"]],
  ["duplicate mastery event", "MasteryAttempt", ["eventKey"]],
  ["duplicate mastery skill snapshot", "MasterySkillSnapshot", ["userId", "scopeKey", "skill"]],
  ["duplicate mastery topic snapshot", "MasteryTopicSnapshot", ["userId", "scopeKey", "tag"]],
  ["duplicate mastery review item", "MasteryReviewQueueItem", ["userId", "courseId", "questionId", "skill"]],
  ["duplicate writing revision", "WritingCoachAttempt", ["sessionId", "revisionNumber"]],
  ["duplicate real-germany progress", "RealGermanyScenarioProgress", ["userId", "scenarioId"]],
  ["duplicate real-germany attempt", "RealGermanyScenarioAttempt", ["progressId", "attemptNumber"]],
  ["duplicate CMS revision", "CmsContentRevision", ["contentId", "version"]],
];

const orphanChecks = [
  ["UserUnitProgress.userId -> User", "UserUnitProgress", "userId", "User", "id"],
  ["UserUnitProgress.courseId -> Course", "UserUnitProgress", "courseId", "Course", "id"],
  ["UserUnitProgress.unitId -> Unit (logical legacy reference)", "UserUnitProgress", "unitId", "Unit", "id", false, true],
  ["MasteryAttempt.userId -> User", "MasteryAttempt", "userId", "User", "id"],
  ["MasteryAttempt.courseId -> Course", "MasteryAttempt", "courseId", "Course", "id"],
  ["MasteryAttempt.unitId -> Unit (logical legacy reference)", "MasteryAttempt", "unitId", "Unit", "id", true, true],
  ["MasterySkillSnapshot.userId -> User", "MasterySkillSnapshot", "userId", "User", "id"],
  ["MasterySkillSnapshot.courseId -> Course", "MasterySkillSnapshot", "courseId", "Course", "id"],
  ["MasterySkillSnapshot.unitId -> Unit (logical legacy reference)", "MasterySkillSnapshot", "unitId", "Unit", "id", true, true],
  ["MasteryTopicSnapshot.userId -> User", "MasteryTopicSnapshot", "userId", "User", "id"],
  ["MasteryTopicSnapshot.courseId -> Course", "MasteryTopicSnapshot", "courseId", "Course", "id"],
  ["MasteryTopicSnapshot.unitId -> Unit (logical legacy reference)", "MasteryTopicSnapshot", "unitId", "Unit", "id", true, true],
  ["MasteryReviewQueueItem.userId -> User", "MasteryReviewQueueItem", "userId", "User", "id"],
  ["MasteryReviewQueueItem.courseId -> Course", "MasteryReviewQueueItem", "courseId", "Course", "id"],
  ["MasteryReviewQueueItem.unitId -> Unit (logical legacy reference)", "MasteryReviewQueueItem", "unitId", "Unit", "id", true, true],
];

const requiredColumns = {
  UserUnitProgress: ["id", "userId", "courseId", "unitId", "status", "stage", "completedSlideIds", "completedExerciseIds"],
  DailyStudyPlan: ["id", "userId", "planDate", "goalMinutes", "plannedMinutes", "completedMinutes", "tasks"],
  MasteryAttempt: ["id", "userId", "courseId", "questionId", "source", "skill", "score", "eventKey"],
  MasterySkillSnapshot: ["id", "userId", "scopeKey", "courseId", "skill", "score", "evidenceCount", "confidence"],
  MasteryTopicSnapshot: ["id", "userId", "scopeKey", "courseId", "tag", "score", "evidenceCount", "confidence"],
  MasteryReviewQueueItem: ["id", "userId", "courseId", "questionId", "source", "skill", "status", "phase", "dueAt"],
};

const expectedFks = [
  ["UserUnitProgress_courseId_fkey", "r"],
  ["MasteryAttempt_userId_fkey", "c"],
  ["MasteryAttempt_courseId_fkey", "r"],
  ["MasterySkillSnapshot_userId_fkey", "c"],
  ["MasterySkillSnapshot_courseId_fkey", "r"],
  ["MasteryTopicSnapshot_userId_fkey", "c"],
  ["MasteryTopicSnapshot_courseId_fkey", "r"],
  ["MasteryReviewQueueItem_userId_fkey", "c"],
  ["MasteryReviewQueueItem_courseId_fkey", "r"],
];

async function run() {
  console.log(`Deutschimo V46.7 Database Integrity â€” ${mode.toUpperCase()}`);
  console.log("READ-ONLY CHECK: bu betik INSERT/UPDATE/DELETE/TRUNCATE/DROP Ã§alÄ±ÅŸtÄ±rmaz.");

  const userExists = await tableExists("User");
  if (!userExists) {
    if (mode === "preflight") {
      ok("Fresh database algÄ±landÄ±; migration Ã¶ncesi veri kontrolÃ¼ atlandÄ±.");
      return;
    }
    fail("Assert modunda User tablosu bulunamadÄ±; migrations tamamlanmamÄ±ÅŸ.");
    process.exitCode = 1;
    return;
  }

  const presence = new Map();
  for (const table of expectedTables) presence.set(table, await tableExists(table));
  const missing = expectedTables.filter((table) => !presence.get(table));
  if (missing.length) {
    const message = `HenÃ¼z oluÅŸturulmamÄ±ÅŸ tablolar: ${missing.join(", ")}`;
    if (mode === "assert") fail(message); else warn(`${message}. Pending migrations bunlarÄ± oluÅŸturabilir.`);
  }

  for (const [label, table, columns] of duplicateChecks) {
    if (!presence.get(table)) continue;
    const group = columns.map(qIdent).join(", ");
    const sql = `SELECT COUNT(*)::bigint AS count FROM (SELECT ${group} FROM ${qIdent(table)} GROUP BY ${group} HAVING COUNT(*) > 1) d`;
    const n = await count(sql);
    if (n) fail(`${label}: ${n} duplicate key grubu bulundu.`); else ok(`${label}: yok`);
  }

  for (const [label, child, childKey, parent, parentKey, nullable, warningOnly] of orphanChecks) {
    if (!presence.get(child) || !presence.get(parent)) continue;
    const nullGuard = nullable ? `c.${qIdent(childKey)} IS NOT NULL AND ` : "";
    const sql = `SELECT COUNT(*)::bigint AS count FROM ${qIdent(child)} c LEFT JOIN ${qIdent(parent)} p ON p.${qIdent(parentKey)} = c.${qIdent(childKey)} WHERE ${nullGuard}p.${qIdent(parentKey)} IS NULL`;
    const n = await count(sql);
    if (n) {
      const message = `${label}: ${n} orphan/logical reference bulundu.`;
      if (warningOnly) warn(`${message} V46.7 veri silmez veya otomatik yeniden yazmaz.`); else fail(message);
    } else ok(`${label}: orphan yok`);
  }

  for (const table of ["UserUnitProgress", "MasteryAttempt", "MasterySkillSnapshot", "MasteryTopicSnapshot", "MasteryReviewQueueItem"]) {
    if (!presence.get(table) || !presence.get("Unit")) continue;
    const sql = `SELECT COUNT(*)::bigint AS count FROM ${qIdent(table)} x JOIN "Unit" u ON u."id" = x."unitId" WHERE x."unitId" IS NOT NULL AND u."courseId" <> x."courseId"`;
    const n = await count(sql);
    if (n) warn(`${table}: ${n} kayÄ±tta unitId baÅŸka bir courseId'ye ait. V46.7 otomatik dÃ¼zeltmez.`); else ok(`${table}: course/unit eÅŸleÅŸmesi tutarlÄ±`);
  }

  for (const [table, columns] of Object.entries(requiredColumns)) {
    if (!presence.get(table)) continue;
    const rows = await prisma.$queryRawUnsafe(
      `SELECT "column_name", "is_nullable" FROM information_schema.columns WHERE table_schema='public' AND table_name=$1 AND "column_name" = ANY($2::text[])`,
      table,
      columns,
    );
    const byName = new Map(rows.map((row) => [row.column_name, row.is_nullable]));
    for (const column of columns) {
      if (!byName.has(column)) fail(`${table}.${column}: kolon bulunamadÄ±.`);
      else if (byName.get(column) !== "NO") fail(`${table}.${column}: NULL kabul ediyor; required olmasÄ± bekleniyor.`);
    }
  }
  ok("Nullable/required kritik alan taramasÄ± tamamlandÄ±.");

  if (mode === "assert") {
    const rows = await prisma.$queryRawUnsafe(`SELECT conname, confdeltype, convalidated FROM pg_constraint WHERE contype='f' AND conname = ANY($1::text[])`, expectedFks.map(([name]) => name));
    const byName = new Map(rows.map((row) => [row.conname, row]));
    for (const [name, deleteType] of expectedFks) {
      const row = byName.get(name);
      if (!row) fail(`FK eksik: ${name}`);
      else if (!row.convalidated) fail(`FK validate edilmemiÅŸ: ${name}`);
      else if (row.confdeltype !== deleteType) fail(`FK delete davranÄ±ÅŸÄ± yanlÄ±ÅŸ: ${name} (${row.confdeltype}, beklenen ${deleteType})`);
      else ok(`FK doÄŸrulandÄ±: ${name}`);
    }
  }

  if (failures.length) {
    console.error(`\nV46.7 DATABASE INTEGRITY FAILED: ${failures.length} bulgu.`);
    console.error("Production Ã¼zerinde otomatik dÃ¼zeltme/silme YAPILMADI. BulgularÄ± manuel inceleyin.");
    process.exitCode = 1;
  } else {
    console.log(`\nV46.7 DATABASE INTEGRITY PASSED${warnings.length ? ` (${warnings.length} uyarÄ±)` : ""}.`);
  }
}

try {
  await run();
} catch (error) {
  console.error("V46.7 database integrity kontrolÃ¼ Ã§alÄ±ÅŸtÄ±rÄ±lamadÄ±:", error);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}

