import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const required = [
  "public/deutschimo-logo.png",
  "public/deutschimo-logo-192.png",
  "public/deutschimo-apple-icon.png",
  "app/icon.png",
  "app/apple-icon.png",
  "components/layout/site-header.tsx",
  "components/layout/footer.tsx",
];

for (const file of required) {
  const full = path.join(root, file);
  if (!fs.existsSync(full) || fs.statSync(full).size === 0) {
    throw new Error(`V22 doğrulaması başarısız: ${file} eksik veya boş.`);
  }
}

const header = fs.readFileSync(path.join(root, "components/layout/site-header.tsx"), "utf8");
const footer = fs.readFileSync(path.join(root, "components/layout/footer.tsx"), "utf8");
const layout = fs.readFileSync(path.join(root, "app/layout.tsx"), "utf8");
const css = fs.readFileSync(path.join(root, "app/globals.css"), "utf8");

if (!header.includes('src="/deutschimo-logo.png"')) throw new Error("Header resmi logoyu kullanmıyor.");
if (!footer.includes('src="/deutschimo-logo.png"')) throw new Error("Footer resmi logoyu kullanmıyor.");
if (!layout.includes('icon: "/deutschimo-logo.png"')) throw new Error("Tarayıcı ikonu metadata içine eklenmemiş.");
if (!css.includes(".brand-logo")) throw new Error("Logo boyutlandırma stili eksik.");

console.log("✓ V22 logo doğrulaması başarılı.");
