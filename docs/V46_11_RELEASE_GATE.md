# Deutschimo V46.11 — Performance / Core Web Vitals / Single Release Gate

## Priority
`stability → correctness → accessibility → performance`

V46.11 does **not** perform an aggressive performance rewrite. It adds measurement,
observability, conservative budgets, critical E2E coverage and one central production
release verdict.

## Core Web Vitals targets

Field-data "good" targets:
- LCP <= 2500 ms
- INP <= 200 ms
- CLS <= 0.10
- TTFB <= 800 ms (supporting metric; not itself a Core Web Vital)

The CI lab gate reports GOOD / NEEDS_IMPROVEMENT / POOR. To reduce flaky release
blocking on shared CI hardware, only the "poor" boundary is a hard lab release blocker:
- LCP > 4000 ms
- INP > 500 ms
- CLS > 0.25
- TTFB > 1800 ms

The product target remains the "good" threshold at the 75th percentile of real users.

## Performance scan
`npm run perf:v46.11`

Checks/reports:
- production JS gzip budget
- largest chunks
- route JS file-count diagnostics
- client component count
- raw img usage
- dynamic imports
- repeated fetch hotspots
- sequential Prisma query heuristics
- large public assets
- heavy dependency footprint
- hydration suppression occurrences
- production Web Vitals reporter presence

Warnings are not automatically rewritten. They are review inputs.

## Single release gate
`npm run release:gate`

The gate runs:
- isolated database safety
- toolchain / lockfile
- V45 regression baseline
- V46/V46.5/V46.7/V46.10/V46.11 validation
- security/auth checks
- migration validation + V45/V46 → V46.7 data-preservation test
- isolated DB setup, drift and integrity validation
- lint
- TypeScript
- unit tests
- integration tests
- production build
- performance / Core Web Vitals lab guard
- accessibility checks
- critical E2E
- isolated test-data cleanup + final database integrity assertion
- observability audit

Any critical failure ends with:
`V46 RELEASE GATE: FAILED`

A clean run ends with:
`V46 RELEASE GATE: PASSED`

## Critical E2E mapping
01 New Student — existing V46.1
02 Learning — existing V46.2
03 Learning Intelligence — existing V46.3
04 Admin Publishing — V46.11
05 Authorization — V46.11
06 Persistence — existing V46.2 second-device persistence
07 Failure Recovery — V46.11

## Production safety
The central gate is intentionally unable to run its DB-writing stages unless:
- `RELEASE_GATE_ALLOW_ISOLATED_DB=1`
- `DATABASE_ENVIRONMENT=test`
- database host is localhost / 127.0.0.1 / ::1
- database name carries a test/CI marker

This prevents the release test suite from mutating production/preview user data.

## Observability
Production Web Vitals logs contain only:
- request route
- operation / metric
- result / rating
- error category
- numeric value
- navigation type

Passwords, tokens, sessions, DB URLs and API keys are not accepted/logged by the
Web Vitals telemetry endpoint.

## Important measurement note
Lab data and real-user field data are different. CI is a regression guard. Production
Core Web Vitals should still be reviewed from real-user monitoring / platform analytics.
