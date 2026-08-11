const base = process.env.V47_SMOKE_BASE_URL?.replace(/\/$/, "");
if (!base) {
  console.log("V47 smoke test skipped: V47_SMOKE_BASE_URL is not set.");
  process.exit(0);
}
if (!/^https?:\/\//.test(base)) {
  console.error("V47_SMOKE_BASE_URL must be http(s).");
  process.exit(1);
}

const checks = [
  ["/", [200, 301, 302, 307, 308]],
  ["/auth", [200, 301, 302, 307, 308]],
  ["/api/health/live", [200]],
  ["/api/health/ready", [200]],
  ["/api/v1/release", [200]],
];

let failed = false;
for (const [route, expected] of checks) {
  try {
    const response = await fetch(`${base}${route}`, {
      redirect: "manual",
      headers: { "user-agent": "Deutschimo-V47-ReadOnly-Smoke/1.0" },
    });
    const ok = expected.includes(response.status);
    console.log(`${ok ? "OK" : "X"} ${route} -> ${response.status}`);
    if (!ok) failed = true;
  } catch (error) {
    console.error(`X ${route}: ${error instanceof Error ? error.message : String(error)}`);
    failed = true;
  }
}

if (failed) {
  console.error("V47 READ-ONLY SMOKE TEST: FAILED");
  process.exit(1);
}
console.log("V47 READ-ONLY SMOKE TEST: PASSED");
