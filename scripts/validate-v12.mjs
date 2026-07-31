import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const required = [
  "app/placement-test/page.tsx",
  "app/weak-topics/page.tsx",
  "app/smart-review/page.tsx",
  "app/study-plan/page.tsx",
  "app/api/intelligence/placement/route.ts",
  "app/api/intelligence/insights/route.ts",
  "app/api/intelligence/review/route.ts",
  "app/api/intelligence/daily-plan/route.ts",
  "app/api/intelligence/overview/route.ts",
  "components/intelligence/placement-test.tsx",
  "components/intelligence/weak-topics-panel.tsx",
  "components/intelligence/smart-review.tsx",
  "components/intelligence/daily-plan.tsx",
  "components/intelligence/intelligence-overview.tsx",
  "data/placement-test.ts",
  "lib/intelligence/placement.ts",
  "lib/intelligence/insight-engine.ts",
  "lib/intelligence/daily-plan.ts",
  "lib/intelligence/server.ts",
  "types/intelligence.ts",
];

const missing = required.filter((file) => !fs.existsSync(path.join(root, file)));
if (missing.length) throw new Error(`Eksik V12 dosyaları: ${missing.join(", ")}`);

const placement = fs.readFileSync(path.join(root, "data/placement-test.ts"), "utf8");
const ids = [...placement.matchAll(/id: "(pt-[^"]+)"/g)].map((match) => match[1]);
if (ids.length !== 24) throw new Error(`24 placement sorusu bekleniyordu, ${ids.length} bulundu.`);
if (new Set(ids).size !== ids.length) throw new Error("Placement soru kimlikleri benzersiz değil.");
for (const level of ["a1", "a2", "b1", "b2"]) {
  const count = ids.filter((id) => id.startsWith(`pt-${level}-`)).length;
  if (count !== 6) throw new Error(`${level.toUpperCase()} için 6 soru bekleniyordu, ${count} bulundu.`);
}

const schema = fs.readFileSync(path.join(root, "prisma/schema.prisma"), "utf8");
for (const model of ["PlacementAssessment", "LearningInsightSnapshot", "DailyStudyPlan", "SmartReviewState"]) {
  if (!schema.includes(`model ${model}`)) throw new Error(`Prisma modeli eksik: ${model}`);
}

console.log("V12 doğrulaması başarılı: 24 placement sorusu, 4 öğrenme zekâsı modülü ve Prisma modelleri hazır.");
