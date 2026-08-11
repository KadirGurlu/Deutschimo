# Deutschimo V46.11

## Performance / Core Web Vitals
- LCP, INP, CLS, TTFB production telemetry enabled with a sanitized endpoint.
- Production bundle budget upgraded from V45 into the V46.11 central gate.
- Stability-first source audit reports client-components, duplicate-fetch/N+1 heuristics,
  heavy dependencies, image size, dynamic imports and hydration warnings.
- No aggressive component/server rewrite was applied.

## Single Release Gate
- Added `npm run release:gate`.
- One clear PASSED/FAILED verdict with named failed control.
- Existing V45/V46/V46.5/V46.7/V46.10 protections are included.

## Critical E2E
- Existing V46 scenarios continue to cover new student, learning, learning intelligence
  and persistence.
- Added admin publishing, authorization and failure-recovery E2E.
- V46 Playwright matching is made deterministic so V46.10/V46.11 specs are not
  accidentally absorbed by the older suite.

## Production Safety
- Central release-gate database stages only run against an explicitly opted-in,
  localhost isolated test database.
- No production/preview database credentials are consumed by the workflow.

## Observability
- Web Vital logs use request / operation / result / errorCategory fields.
- Sensitive values are not logged.

## Database
- Prisma schema change: NONE
- New migration: NONE

## Release Gate Safety Hardening
- The single gate executes the existing V46.7 migration data-preservation test.
- A final isolated test-data cleanup removes interrupted-run E2E/migration sentinels.
- Database integrity/readiness is re-asserted after critical E2E cleanup.
