import fs from "node:fs";
const errors = [];
if (!fs.existsSync("package-lock.json")) errors.push("package-lock.json bulunamadi; kilit dosyasi zorunludur.");
else {
  const lock = JSON.parse(fs.readFileSync("package-lock.json", "utf8"));
  if (![2, 3].includes(lock.lockfileVersion)) errors.push(`Desteklenmeyen lockfileVersion: ${lock.lockfileVersion}`);
  const root = lock.packages?.[""] ?? {};
  if (root.version !== "31.2.0") errors.push(`package-lock kok surumu 31.2.0 olmali. Mevcut: ${root.version}`);
  if (root.engines?.node !== "22.x") errors.push(`package-lock engines.node 22.x olmali. Mevcut: ${root.engines?.node}`);
}
if (errors.length) { errors.forEach((x) => console.error(`HATA: ${x}`)); process.exit(1); }
console.log("package-lock.json mevcut, okunabilir ve V31.2 ile senkron.");
