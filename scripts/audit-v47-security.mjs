import fs from "node:fs";

const sources = ["next.config.ts", "middleware.ts", "vercel.json"]
  .filter((p) => fs.existsSync(p))
  .map((p) => fs.readFileSync(p, "utf8"))
  .join("\n")
  .toLowerCase();

const required = [
  ["content-security-policy", /content-security-policy|frame-ancestors/],
  ["x-content-type-options", /x-content-type-options|nosniff/],
  ["referrer-policy", /referrer-policy/],
  ["permissions-policy", /permissions-policy/],
  ["hsts", /strict-transport-security|max-age=31536000/],
];

let failed = false;
for (const [name, pattern] of required) {
  const ok = pattern.test(sources);
  console.log(`${ok ? "OK" : "X"} ${name}`);
  if (!ok) failed = true;
}

if (/\bscript-src\s+\*/i.test(sources)) {
  console.error("X CSP contains script-src *");
  failed = true;
}

if (failed) {
  console.error("V47 SECURITY HEADER AUDIT: FAILED");
  process.exit(1);
}
console.log("V47 SECURITY HEADER AUDIT: PASSED");
