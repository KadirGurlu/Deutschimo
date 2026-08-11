import fs from "node:fs";

const required = [
  ["Authentication", "app/auth/page.tsx"],
  ["Student Dashboard", "app/dashboard/page.tsx"],
  ["Courses", "app/courses/page.tsx"],
  ["Exercises", "data/exercises.ts"],
  ["Progress", "app/progress/page.tsx"],
  ["Level Test", "app/placement-test/page.tsx"],
  ["Daily Plan", "components/intelligence/daily-plan.tsx"],
  ["Smart Review", "components/intelligence/smart-review.tsx"],
  ["Mastery Engine", "lib/mastery/server.ts"],
  ["Listening Lab", "components/skills/listening-lab.tsx"],
  ["Speaking Lab", "components/skills/speaking-lab.tsx"],
  ["Admin", "app/admin/page.tsx"],
  ["Content Studio", "app/api/admin/content-studio/route.ts"],
  ["User Management", "components/admin/user-manager.tsx"],
  ["Settings/Profile", "app/profile/page.tsx"],
];

const missing = required.filter(([, file]) => !fs.existsSync(file));
if (missing.length) {
  for (const [name, file] of missing) {
    console.error(`HATA: Regression contract eksik: ${name} -> ${file}`);
  }
  process.exit(1);
}

console.log("Deutschimo V46.11 Regression Contract Scan");
for (const [name] of required) console.log(`✓ ${name}`);
console.log("✓ V45/V46 kritik özellik yüzeyleri kaynak seviyesinde mevcut.");
