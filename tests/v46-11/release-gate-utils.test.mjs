import test from "node:test";
import assert from "node:assert/strict";
import {
  classifyVital,
  sanitizeLogObject,
} from "../../scripts/release-gate-utils-v46-11.mjs";

test("Core Web Vitals threshold classification", () => {
  assert.equal(classifyVital("LCP", 2500), "GOOD");
  assert.equal(classifyVital("LCP", 2501), "NEEDS_IMPROVEMENT");
  assert.equal(classifyVital("LCP", 4001), "POOR");

  assert.equal(classifyVital("INP", 200), "GOOD");
  assert.equal(classifyVital("INP", 500), "NEEDS_IMPROVEMENT");
  assert.equal(classifyVital("INP", 501), "POOR");

  assert.equal(classifyVital("CLS", 0.1), "GOOD");
  assert.equal(classifyVital("CLS", 0.25), "NEEDS_IMPROVEMENT");
  assert.equal(classifyVital("CLS", 0.251), "POOR");

  assert.equal(classifyVital("TTFB", 800), "GOOD");
  assert.equal(classifyVital("TTFB", 1800), "NEEDS_IMPROVEMENT");
  assert.equal(classifyVital("TTFB", 1801), "POOR");
});

test("observability sanitizer removes secrets and direct email", () => {
  const result = sanitizeLogObject({
    password: "DontLogMe",
    authenticationToken: "abc123",
    route: "/dashboard",
    message: "user test@example.com failed",
  });
  assert.equal(result.password, "[redacted]");
  assert.equal(result.authenticationToken, "[redacted]");
  assert.equal(result.route, "/dashboard");
  assert.match(result.message, /\[redacted-email\]/);
  assert.doesNotMatch(JSON.stringify(result), /DontLogMe|abc123|test@example\.com/);
});
