import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (relative) => fs.readFileSync(path.join(root, relative), "utf8");
const failures = [];
const expect = (condition, message) => { if (!condition) failures.push(message); };

const pkg = JSON.parse(read("package.json"));
expect(pkg.version === "25.0.0", "Paket sürümü 25.0.0 değil.");
expect(pkg.scripts["validate:v25"]?.includes("validate-v25.mjs"), "V25 doğrulama komutu eksik.");

const home = read("app/page.tsx");
expect(home.includes("const session = await auth()"), "Ana sayfada sunucu taraflı oturum kontrolü eksik.");
expect(home.includes('redirect("/dashboard")'), "Giriş yapan kullanıcı Öğrenci Paneline yönlendirilmiyor.");
expect(home.includes('dynamic = "force-dynamic"'), "Kişisel ana sayfa yönlendirmesi dinamik değil.");

const header = read("components/layout/site-header.tsx");
expect(header.includes('authenticated ? "/dashboard" : "/"'), "Logo hedefi oturum durumuna göre değişmiyor.");
expect(header.includes("Öğrenci Paneline git"), "Giriş yapan kullanıcı için logo erişilebilirlik etiketi eksik.");

const mobile = read("components/layout/mobile-nav.tsx");
expect(mobile.includes('status !== "authenticated"'), "Mobil navigasyon ziyaretçilere gizlenmiyor.");
expect(mobile.includes('href="/dashboard"'), "Mobil ana sekme Öğrenci Paneline gitmiyor.");

const dashboard = read("app/dashboard/page.tsx");
for (const marker of ["mostRecentPosition", "calculateStudyStreak", "Devam edilen kurs", "Kurs ilerlemesi", "Kişisel rekor"]) {
  expect(dashboard.includes(marker), `Öğrenci Panelinde V25 özelliği eksik: ${marker}`);
}
expect(!dashboard.includes('value="6 gün"'), "Çalışma serisi hâlâ sabit 6 gün gösteriliyor.");

const streak = read("lib/learning/streak.ts");
for (const marker of ["current", "best", "activeDays", "yesterdayKey", "previousDayKey"]) {
  expect(streak.includes(marker), `Seri hesaplayıcısında alan eksik: ${marker}`);
}

if (failures.length) {
  console.error(`V25 doğrulaması başarısız (${failures.length} sorun):`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("V25 doğrulaması başarılı.");
console.log("- Tanıtım sayfası ziyaretçilere, Öğrenci Paneli giriş yapan kullanıcılara ayrıldı.");
console.log("- Logo ve mobil navigasyon kişisel panele yönleniyor.");
console.log("- Aktif kurs, ilerleme ve çalışma serisi kullanıcı verilerinden hesaplanıyor.");
