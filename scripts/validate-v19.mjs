import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const page = fs.readFileSync(path.join(root, "app/page.tsx"), "utf8");
const header = fs.readFileSync(path.join(root, "components/layout/site-header.tsx"), "utf8");
const css = fs.readFileSync(path.join(root, "app/globals.css"), "utf8");

const requiredPageTokens = [
  "Almanca öğrenmenin sade ve düzenli yolu.",
  "Seviyeni seç",
  "Üç adımda ilerle",
  "v19-platform-preview",
  "v19-level-grid",
  "v19-cta-card",
  'href: "/courses/a1"',
  'href: "/courses/a2"',
  'href: "/courses/b1"',
  'href: "/courses/b2"',
];

const removedHomepagePhrases = [
  "Almancanın her alanını ayrı ayrı geliştir",
  "Öğrenme yolculuklarından örnekler",
  "Dört adımda ölçülebilir ilerleme",
  "Almancayı neden öğreniyorsun?",
  "Tekrar hoş geldin,",
];

const missing = requiredPageTokens.filter((token) => !page.includes(token));
const stale = removedHomepagePhrases.filter((token) => page.includes(token));

if (missing.length) {
  console.error("V19 eksik ana sayfa öğeleri:", missing);
  process.exit(1);
}

if (stale.length) {
  console.error("V19'da kaldırılması gereken eski içerikler bulundu:", stale);
  process.exit(1);
}

if (!header.includes('["Kurslar", "/courses"]') || !header.includes('["Seviyeler", "/#seviyeler"]') || !header.includes('["Sınav Hazırlık", "/exams"]')) {
  console.error("Sade üst menü bağlantıları eksik.");
  process.exit(1);
}

for (const className of [".v19-hero", ".v19-level-grid", ".v19-how-grid", ".v19-cta-card", ".v19-mobile-menu"]) {
  if (!css.includes(className)) {
    console.error(`Eksik V19 CSS sınıfı: ${className}`);
    process.exit(1);
  }
}

console.log("V19 sade ana sayfa doğrulaması başarılı.");
