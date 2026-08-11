function fail(message) {
  console.error(`RELEASE GATE SAFETY: FAILED - ${message}`);
  process.exit(1);
}

if (process.env.RELEASE_GATE_ALLOW_ISOLATED_DB !== "1") {
  fail("RELEASE_GATE_ALLOW_ISOLATED_DB=1 olmadan database kullanan merkezi gate çalışmaz.");
}
if (process.env.DATABASE_ENVIRONMENT !== "test") {
  fail(`DATABASE_ENVIRONMENT=test olmalı; mevcut=${process.env.DATABASE_ENVIRONMENT || "<empty>"}`);
}

for (const key of ["DATABASE_URL", "DATABASE_POSTGRES_URL"]) {
  const raw = process.env[key];
  if (!raw) fail(`${key} tanımlı değil.`);
  let url;
  try {
    url = new URL(raw);
  } catch {
    fail(`${key} geçerli URL değil.`);
  }

  const host = url.hostname.toLowerCase();
  if (!["127.0.0.1", "localhost", "::1"].includes(host)) {
    fail(`${key} yalnızca isolated localhost CI database olabilir; host=${host}`);
  }

  const dbName = url.pathname.replace(/^\//, "").toLowerCase();
  if (!/(?:test|ci|v4611|v46)/.test(dbName)) {
    fail(`${key} database adı test/ci izolasyon işareti taşımıyor: ${dbName}`);
  }
}

console.log("✓ Release gate isolated database safety: PASSED");
console.log("✓ Production/Preview database URL: YOK");
