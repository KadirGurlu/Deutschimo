import fs from "node:fs";

const checks = [
  ["lib/monitoring/client-reporter.ts", ["sensitiveKey", "[redacted]", "password", "token"]],
  ["lib/security/api-monitor.ts", ["x-request-id", "Server-Timing", "logApiFailure", "logSystemError"]],
  ["app/api/monitoring/web-vitals/route.ts", ["request:", "operation:", "result:", "errorCategory:", "DEUTSCHIMO_WEB_VITAL"]],
];

const errors = [];
for (const [file, tokens] of checks) {
  if (!fs.existsSync(file)) {
    errors.push(`Eksik observability dosyası: ${file}`);
    continue;
  }
  const source = fs.readFileSync(file, "utf8");
  for (const token of tokens) {
    if (!source.includes(token)) errors.push(`${file}: eksik observability işareti -> ${token}`);
  }
}

const vitalsRoute = fs.readFileSync("app/api/monitoring/web-vitals/route.ts", "utf8");
for (const forbidden of [
  "body.password",
  "body.token",
  "body.session",
  "body.authorization",
  "body.databaseUrl",
  "body.apiKey",
]) {
  if (vitalsRoute.includes(forbidden)) errors.push(`Web Vitals logunda hassas alan kullanımı: ${forbidden}`);
}

if (errors.length) {
  for (const error of errors) console.error(`HATA: ${error}`);
  process.exit(1);
}

console.log("Deutschimo V46.11 Observability Audit");
console.log("✓ request / operation / result / errorCategory izleri mevcut.");
console.log("✓ Client error reporter hassas anahtar redaction sözleşmesi korunuyor.");
console.log("✓ Web Vitals endpoint password/token/session/database credential/API key loglamıyor.");
console.log("✓ API request-id ve Server-Timing gözlemlenebilirliği korunuyor.");
