import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const reportDir = path.join(root, ".stability", "v31-1");

function todayIstanbul() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Istanbul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const get = (type) => parts.find((item) => item.type === type)?.value;
  return `${get("year")}-${get("month")}-${get("day")}`;
}

function parseArgs() {
  const args = process.argv.slice(2);
  const command = args[0] && !args[0].startsWith("--") ? args[0] : "status";
  const values = {};
  for (const item of args.slice(command === "status" && args[0]?.startsWith("--") ? 0 : 1)) {
    if (!item.startsWith("--")) continue;
    const [key, ...rest] = item.slice(2).split("=");
    values[key] = rest.length ? rest.join("=") : "true";
  }
  return { command, values };
}

function parsePass(value, name) {
  if (value === "pass") return true;
  if (value === "fail") return false;
  throw new Error(`${name} icin --${name}=pass veya --${name}=fail kullanin.`);
}

function loadReports() {
  if (!fs.existsSync(reportDir)) return [];
  return fs.readdirSync(reportDir)
    .filter((name) => /^\d{4}-\d{2}-\d{2}\.json$/.test(name))
    .map((name) => JSON.parse(fs.readFileSync(path.join(reportDir, name), "utf8")))
    .sort((a, b) => a.date.localeCompare(b.date));
}

function dateMinus(date, days) {
  const base = new Date(`${date}T12:00:00+03:00`);
  base.setUTCDate(base.getUTCDate() - days);
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Istanbul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(base);
}

const { command, values } = parseArgs();

if (command === "record") {
  fs.mkdirSync(reportDir, { recursive: true });
  const date = values.date || todayIstanbul();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error("--date=YYYY-MM-DD kullanin.");
  if (date > todayIstanbul()) throw new Error("Gelecek tarih icin stabilite kaydi olusturulamaz.");
  const criticalErrors = Number(values["critical-errors"]);
  if (!Number.isInteger(criticalErrors) || criticalErrors < 0) {
    throw new Error("--critical-errors=0 gibi sifir veya pozitif tam sayi girin.");
  }
  const report = {
    version: "31.1.0",
    date,
    recordedAt: new Date().toISOString(),
    build: parsePass(values.build, "build"),
    e2e: parsePass(values.e2e, "e2e"),
    databaseSeparation: parsePass(values["db-separation"], "db-separation"),
    criticalErrors,
    note: values.note || "",
  };
  fs.writeFileSync(path.join(reportDir, `${date}.json`), `${JSON.stringify(report, null, 2)}\n`, "utf8");
  console.log(`V31.1 stabilite kaydi olusturuldu: ${date}`);
  process.exit(0);
}

if (command === "reset") {
  if (fs.existsSync(reportDir)) fs.rmSync(reportDir, { recursive: true, force: true });
  console.log("V31.1 yerel stabilite kayitlari silindi.");
  process.exit(0);
}

if (!new Set(["status", "list"]).has(command)) {
  throw new Error("Komutlar: record, status, list, reset");
}

const reports = loadReports();
if (command === "list") {
  if (!reports.length) {
    console.log("Henuz V31.1 stabilite kaydi yok.");
  } else {
    for (const report of reports) {
      const pass = report.build && report.e2e && report.databaseSeparation && report.criticalErrors === 0;
      console.log(`${report.date} | ${pass ? "PASS" : "FAIL"} | kritik hata=${report.criticalErrors}`);
    }
  }
  process.exit(0);
}

const today = todayIstanbul();
const requiredDates = Array.from({ length: 7 }, (_, index) => dateMinus(today, 6 - index));
const byDate = new Map(reports.map((report) => [report.date, report]));
const missing = requiredDates.filter((date) => !byDate.has(date));
const failed = requiredDates
  .map((date) => byDate.get(date))
  .filter(Boolean)
  .filter((report) => !(report.build && report.e2e && report.databaseSeparation && report.criticalErrors === 0));

console.log("Deutschimo V31.1 - 7 Gunluk Stabilite Durumu");
console.log(`Kontrol araligi: ${requiredDates[0]} -> ${requiredDates.at(-1)}`);
console.log(`Kayitli gun: ${7 - missing.length}/7`);
if (missing.length) console.log(`Eksik gunler: ${missing.join(", ")}`);
if (failed.length) console.log(`Basarisiz gunler: ${failed.map((report) => report.date).join(", ")}`);

if (missing.length || failed.length) {
  console.error("V31.1 stabilite kapisi henuz tamamlanmadi.");
  process.exit(1);
}
console.log("V31.1 stabilite kapisi BASARILI: 7 gun boyunca kritik hata yok.");
