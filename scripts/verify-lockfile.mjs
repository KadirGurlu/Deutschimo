import fs from "node:fs";

const errors = [];
const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"));
const expectedVersion = String(pkg.version ?? "").trim();

if (!expectedVersion) errors.push("package.json surumu okunamadi.");
if (!fs.existsSync("package-lock.json")) {
  errors.push("package-lock.json bulunamadi; kilit dosyasi zorunludur.");
} else {
  const lock = JSON.parse(fs.readFileSync("package-lock.json", "utf8"));
  if (![2, 3].includes(lock.lockfileVersion)) errors.push(`Desteklenmeyen lockfileVersion: ${lock.lockfileVersion}`);
  const root = lock.packages?.[""] ?? {};
  if (root.version !== expectedVersion) {
    errors.push(`package-lock kok surumu package.json ile ayni olmali. Beklenen: ${expectedVersion}, mevcut: ${root.version}`);
  }
  const expectedNode = pkg.engines?.node ?? "22.x";
  if (root.engines?.node !== expectedNode) {
    errors.push(`package-lock engines.node package.json ile ayni olmali. Beklenen: ${expectedNode}, mevcut: ${root.engines?.node}`);
  }
}

if (errors.length) {
  errors.forEach((x) => console.error(`HATA: ${x}`));
  process.exit(1);
}
console.log(`package-lock.json mevcut, okunabilir ve surum ${expectedVersion} ile senkron.`);
