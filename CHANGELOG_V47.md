# Deutschimo V47 - Production Launch / Observability / Growth Foundation

V47 is an operational maturity release, not a feature-heavy redesign.

Added:
- strict environment/secrets governance layer
- structured PII-safe logging and release identification
- live/readiness health endpoints
- centralized product/learning event taxonomy
- consent-gated first-party analytics foundation
- privacy consent, export foundation and guarded account-deletion flow
- feedback/content-error API
- admin operations metrics endpoint backed by real data
- deterministic environment/role/user/percentage feature flags
- notification-domain foundation
- PWA manifest, safe-area and offline/restore UX
- read-only post-deploy smoke tests
- V47 release gate extending the V46 centralized gate
- backup/restore/rollback, API/mobile and beta rollout runbooks
- expand-only V47 database migration

Preserved:
- V46 authentication/authorization
- V46 database integrity
- V46 accessibility
- V46 performance/release gate
- V31 API v1, request IDs, idempotency, devices, rate limiting and backup/rollback foundation

No production database operation is performed by the local installer.
