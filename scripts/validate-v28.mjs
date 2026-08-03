import { access, readFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const errors = [];

async function text(path) {
  try {
    return await readFile(new URL(path, root), "utf8");
  } catch {
    errors.push(`${path}: dosya okunamadı`);
    return "";
  }
}

async function required(path) {
  try {
    await access(new URL(path, root));
  } catch {
    errors.push(`${path}: zorunlu dosya eksik`);
  }
}

for (const path of [
  ".github/workflows/ci.yml",
  "eslint.config.mjs",
  "playwright.config.ts",
  "e2e/public-learning-flow.spec.ts",
  "e2e/security-and-responsive.spec.ts",
]) {
  await required(path);
}

const packageJson = JSON.parse(await text("package.json"));
const requiredScripts = ["lint", "typecheck", "validate:content", "validate:v27", "validate:v28", "quality:check", "test:e2e"];
for (const script of requiredScripts) {
  if (!packageJson.scripts?.[script]) errors.push(`package.json: ${script} komutu eksik`);
}
if (!packageJson.devDependencies?.["@playwright/test"]) errors.push("package.json: @playwright/test eksik");
if (!packageJson.devDependencies?.["@eslint/eslintrc"]) errors.push("package.json: @eslint/eslintrc eksik");

const workflow = await text(".github/workflows/ci.yml");
for (const marker of ["quality:", "e2e:", "production-build-gate:", "npm run quality:check", "npm run test:e2e", "npm run build"]) {
  if (!workflow.includes(marker)) errors.push(`CI workflow: ${marker} bulunamadı`);
}
if (!/needs:\s*\[quality, e2e\]/.test(workflow)) errors.push("CI workflow: production build kalite ve E2E işlerine bağlı değil");

const e2eFiles = [await text("e2e/public-learning-flow.spec.ts"), await text("e2e/security-and-responsive.spec.ts")];
const testCount = e2eFiles.reduce((count, source) => count + (source.match(/\btest\s*\(/g)?.length ?? 0), 0);
if (testCount < 7) errors.push(`Playwright: en az 7 kritik test bekleniyor, bulunan ${testCount}`);

if (errors.length) {
  console.error(`V28 CI kalite kontrolü başarısız (${errors.length} hata):\n- ${errors.join("\n- ")}`);
  process.exit(1);
}

console.log(`V28 CI kalite kontrolü başarılı: GitHub Actions, ESLint, TypeScript/içerik kapısı, Playwright ve production build gate yapılandırıldı (${testCount} E2E test).`);
