import fs from "node:fs";

const required = [
  "auth.ts",
  "auth.config.ts",
  "middleware.ts",
  "lib/db.ts",
  "app/api/auth/[...nextauth]/route.ts",
  "app/api/auth/register/route.ts",
  "app/api/progress/route.ts",
  "app/api/admin/users/route.ts",
  "components/auth/learning-sync-bridge.tsx",
  "prisma/seed.mjs",
];
for (const file of required) {
  if (!fs.existsSync(file)) throw new Error(`V11 dosyası eksik: ${file}`);
}
const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"));
for (const dependency of ["next-auth", "@auth/prisma-adapter", "@prisma/client", "bcryptjs"]) {
  if (!pkg.dependencies?.[dependency]) throw new Error(`Bağımlılık eksik: ${dependency}`);
}
const schema = fs.readFileSync("prisma/schema.prisma", "utf8");
for (const model of ["Account", "Session", "LearningStateSnapshot", "UserUnitProgress", "UserActivityEvent"]) {
  if (!schema.includes(`model ${model}`)) throw new Error(`Prisma modeli eksik: ${model}`);
}
const storage = fs.readFileSync("lib/storage/learning-storage.ts", "utf8");
if (!storage.includes("deutschimo-learning-v11")) throw new Error("V11 kullanıcıya özel storage anahtarı bulunamadı.");
const authPage = fs.readFileSync("app/auth/page.tsx", "utf8");
if (authPage.includes("registerUser(")) throw new Error("Kayıt ekranı hâlâ demo localStorage kaydını kullanıyor.");
const userManager = fs.readFileSync("components/admin/user-manager.tsx", "utf8");
if (!userManager.includes("/api/admin/users")) throw new Error("Admin kullanıcı yöneticisi gerçek API'ye bağlı değil.");
console.log("V11 doğrulandı: Auth.js, PostgreSQL/Prisma, gerçek admin kullanıcı API'si ve cihazlar arası ilerleme senkronizasyonu mevcut.");
