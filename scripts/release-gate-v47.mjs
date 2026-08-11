import { spawnSync } from "node:child_process";

const steps = [
  ["V46 Central Release Gate", ["npm", "run", "release:gate"]],
  ["V47 Validation", ["npm", "run", "validate:v47"]],
  ["V47 Environment Governance", ["npm", "run", "audit:env:v47"]],
  ["V47 Security Headers", ["npm", "run", "audit:security:v47"]],
  ["V47 Unit Tests", ["npm", "run", "test:unit:v47"]],
  ["V47 Database Performance Audit", ["npm", "run", "audit:db-performance:v47"]],
];

const results = [];
for (const [name, command] of steps) {
  console.log(`\n[RUN] ${name}`);
  const [bin, ...args] = command;
  const executable = process.platform === "win32" && bin === "npm" ? "npm.cmd" : bin;
  const run = spawnSync(executable, args, { stdio: "inherit", env: process.env });
  const ok = run.status === 0;
  results.push([name, ok]);
  if (!ok) break;
}

console.log("\n============================================");
console.log("DEUTSCHIMO V47 RELEASE GATE");
console.log("============================================");
for (const [name, ok] of results) {
  console.log(`${ok ? "OK" : "X "} ${name}`);
}
const failed = results.some(([, ok]) => !ok);
console.log(failed ? "\nV47 RELEASE GATE: FAILED" : "\nV47 RELEASE GATE: PASSED");
process.exit(failed ? 1 : 0);
