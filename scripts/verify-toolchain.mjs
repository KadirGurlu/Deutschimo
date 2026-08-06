import fs from "node:fs";
import { spawnSync } from "node:child_process";
const warnOnly = process.argv.includes("--warn-only");
const errors = [];
const nodeVersion = process.versions.node;
const major = Number(nodeVersion.split(".")[0]);
if (major !== 22) errors.push(`Node.js 22 zorunlu. Mevcut: ${nodeVersion}`);
const npmResult = spawnSync(process.platform === "win32" ? "npm.cmd" : "npm", ["--version"], { encoding: "utf8" });
const npmVersion = npmResult.status === 0 ? npmResult.stdout.trim() : "bulunamadi";
if (!/^10\.9\./.test(npmVersion)) errors.push(`npm 10.9.x zorunlu. Mevcut: ${npmVersion}`);
const nvm = fs.existsSync(".nvmrc") ? fs.readFileSync(".nvmrc", "utf8").trim() : "";
if (nvm !== "22.22.2") errors.push(`.nvmrc 22.22.2 olmali. Mevcut: ${nvm || "yok"}`);
const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"));
if (pkg.engines?.node !== "22.x") errors.push(`engines.node 22.x olmali. Mevcut: ${pkg.engines?.node}`);
if (pkg.engines?.npm !== "10.9.x") errors.push(`engines.npm 10.9.x olmali. Mevcut: ${pkg.engines?.npm}`);
if (pkg.packageManager !== "npm@10.9.2") errors.push(`packageManager npm@10.9.2 olmali. Mevcut: ${pkg.packageManager}`);
if (errors.length) {
  errors.forEach((item) => console[warnOnly ? "warn" : "error"](`${warnOnly ? "UYARI" : "HATA"}: ${item}`));
  if (!warnOnly) process.exit(1);
}
console.log(`Toolchain: Node ${nodeVersion}, npm ${npmVersion}; hedef Node 22.22.2 / npm 10.9.2${warnOnly && errors.length ? " (yerel uyari)" : ""}.`);
