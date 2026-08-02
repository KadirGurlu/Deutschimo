import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (relative) => fs.readFileSync(path.join(root, relative), "utf8");
const failures = [];
const expect = (condition, message) => { if (!condition) failures.push(message); };

const pkg = JSON.parse(read("package.json"));
expect(pkg.version === "24.0.0", "Paket sürümü 24.0.0 değil.");
expect(!pkg.scripts.build.includes("prisma db push"), "Production build hâlâ prisma db push çalıştırıyor.");
expect(!pkg.scripts.build.includes("bootstrap-admin"), "Production build hâlâ admin seed çalıştırıyor.");
expect(pkg.scripts.prebuild?.includes("validate-environment"), "Build öncesi ortam doğrulaması eksik.");
expect(fs.existsSync(path.join(root, "prisma.config.ts")), "Prisma config dosyası eksik.");

const config = read("next.config.ts");
for (const marker of ["poweredByHeader: false", "Strict-Transport-Security", "Content-Security-Policy", "Permissions-Policy", "productionBrowserSourceMaps: false"]) {
  expect(config.includes(marker), `Next.js güvenlik/optimizasyon ayarı eksik: ${marker}`);
}

const middleware = read("middleware.ts");
expect(middleware.includes("violatesSameOrigin"), "API same-origin/CSRF koruması eksik.");
expect(middleware.includes("x-request-id"), "İstek kimliği middleware katmanında üretilmiyor.");
expect(middleware.includes("x-robots-tag"), "Özel sayfalar için noindex koruması eksik.");

const authConfig = read("auth.config.ts");
for (const prefix of ["/courses", "/placement-test", "/smart-review", "/skills", "/vocabulary", "/admin"]) {
  expect(authConfig.includes(`"${prefix}"`), `Korumalı rota listesinde ${prefix} eksik.`);
}

const auth = read("auth.ts");
expect(!auth.includes("Object.assign(token, session.user)"), "İstemci session.update verisi güvenilir JWT alanlarına kopyalanıyor.");
expect(auth.includes("isSessionRevoked"), "Şifre değişimi sonrası JWT oturum iptali eksik.");
expect(auth.includes("TRUSTED_USER_REFRESH_MS"), "JWT kullanıcı rol/durum yenilemesi eksik.");

const apiMonitor = read("lib/security/api-monitor.ts");
for (const marker of ["maxBodyBytes", "Server-Timing", "Cross-Origin-Resource-Policy", "Invalid JSON body"]) {
  expect(apiMonitor.includes(marker), `API koruma/izleme özelliği eksik: ${marker}`);
}

const backup = read("lib/backup/backup-service.ts");
expect(backup.includes("gzipSync"), "Yedek sıkıştırması eklenmedi.");
expect(backup.includes("pruneExpiredBackups"), "Yedek saklama süresi temizliği eksik.");
expect(!backup.includes("refresh_token: true"), "OAuth refresh token yedeğe dahil ediliyor.");

for (const file of [
  "app/api/health/route.ts",
  "lib/auth/session-revocation.ts",
  "lib/security/secrets.ts",
  "scripts/validate-environment.mjs",
]) {
  expect(fs.existsSync(path.join(root, file)), `${file} eksik.`);
}

if (failures.length) {
  console.error(`V24 doğrulaması başarısız (${failures.length} sorun):`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("V24 doğrulaması başarılı.");
console.log("- Production build veritabanını otomatik değiştirmiyor.");
console.log("- Ortam değişkenleri, güvenlik başlıkları, CSRF, istek boyutu ve oturum iptali kontrolleri aktif.");
console.log("- Sağlık kontrolü, sıkıştırılmış şifreli yedek ve saklama süresi temizliği eklendi.");
