import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
let ts;
try { ts = require("typescript"); } catch { ts = require("/opt/nvm/versions/node/v22.16.0/lib/node_modules/typescript/lib/typescript.js"); }

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const failures = [];
const assert = (condition, message) => { if (!condition) failures.push(message); };

const home = read("app/page.tsx");
const header = read("components/layout/site-header.tsx");
const authPage = read("app/auth/page.tsx");
const auth = read("auth.ts");
const env = read(".env.example");
const pkg = JSON.parse(read("package.json"));

assert(!header.includes('"Kurslar"'), "Header içinde Kurslar bağlantısı kalmış.");
assert(!header.includes('"Seviyeler"'), "Header içinde Seviyeler bağlantısı kalmış.");
assert(!header.includes('"Sınav Hazırlık"'), "Header içinde Sınav Hazırlık bağlantısı kalmış.");
assert(header.includes('/auth?mode=login'), "Giriş Yap bağlantısı login moduna yönlenmiyor.");
assert(header.includes('/auth?mode=register'), "Kayıt Ol bağlantısı register moduna yönlenmiyor.");
assert(!home.includes("Seviyeleri İncele"), "Seviyeleri İncele butonu kaldırılmamış.");
assert(!home.includes("Ders anlatımı → alıştırma → ünite ilerlemesi"), "Ön izleme alt açıklaması kaldırılmamış.");
assert(home.includes('mode: "register"'), "Seviye bağlantıları kayıt modunu kullanmıyor.");
for (const level of ["A1", "A2", "B1", "B2"]) {
  assert(home.includes(`level: "${level}"`), `${level} seviye kartı bulunamadı.`);
}
assert(authPage.includes('searchParams.get("mode") === "login"'), "Auth sayfası URL login modunu okumuyor.");
assert(authPage.includes('signIn("google"'), "Google ile devam et işlemi bulunamadı.");
assert(authPage.includes("Google ile devam et"), "Google butonu metni bulunamadı.");
assert(auth.includes("allowDangerousEmailAccountLinking: true"), "Doğrulanmış Google e-postaları için hesap bağlama ayarı eksik.");
assert(auth.includes('"email_verified" in profile'), "Google doğrulanmış e-posta kontrolü eksik.");
assert(env.includes('NEXT_PUBLIC_GOOGLE_AUTH_ENABLED="true"'), "Google görünürlük değişkeni örnekte true değil.");
assert(env.includes("/api/auth/callback/google"), "Google callback URL açıklaması eksik.");
assert(pkg.version === "20.0.0", "package.json sürümü 20.0.0 değil.");

const tsFiles = [
  "app/page.tsx",
  "components/layout/site-header.tsx",
  "app/auth/page.tsx",
  "auth.ts",
];

for (const file of tsFiles) {
  const source = read(file);
  const result = ts.transpileModule(source, {
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.ESNext,
      jsx: ts.JsxEmit.Preserve,
      strict: true,
    },
    fileName: file,
    reportDiagnostics: true,
  });
  for (const diagnostic of result.diagnostics ?? []) {
    const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, " ");
    failures.push(`${file}: ${message}`);
  }
}

if (failures.length) {
  console.error("V20 doğrulaması başarısız:\n- " + failures.join("\n- "));
  process.exit(1);
}

console.log("V20 doğrulaması başarılı: sade header, kayıt yönlendirmeleri, login modu ve Google OAuth entegrasyonu kontrol edildi.");
