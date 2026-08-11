# Deutschimo V47 Production Architecture

V47 preserves the V46 learning product and extends the operational foundation.

## Environments

- Development: developer-only database and credentials.
- Preview/Staging: isolated non-production database, deterministic test users, CI/Preview analytics disabled by default.
- Production: production database and secrets only. Test/reset/db-push operations remain forbidden.

`DATABASE_ENVIRONMENT` is the authoritative database safety signal. Vercel environment and NODE_ENV are additional runtime signals.

## Observability

V46 request/error monitoring remains in place. V47 adds structured JSON logs with:
- environment
- release/commit
- event/operation/result
- requestId
- errorCategory
- durationMs

PII and secrets are redacted. Passwords, tokens, authorization headers, database credentials, API keys and full e-mail addresses must not be emitted.

## Health

- `/api/health/live`: process/service liveness, no database query.
- `/api/health/ready`: bounded database readiness check.
- Existing `/api/v1/health` is retained for V31/mobile compatibility.

## Analytics

V47 defines a centralized learning-oriented event taxonomy and a consent-gated first-party event store. Analytics are disabled unless `V47_ANALYTICS_ENABLED=true`.

No raw IP address is stored by the V47 analytics layer. Session identifiers are hashed.

## Mobile API

The V31 `/api/v1` contract is preserved. V47 does not force a mass `/v1` refactor. Native mobile authentication remains a separate future change; `getPlatformApiUser()` remains the abstraction boundary.

## Release principle

Build -> Deploy -> Observe -> Measure -> Improve -> Rollback if necessary.
