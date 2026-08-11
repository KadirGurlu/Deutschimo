# V47 Backup, Restore and Rollback Runbook

## Database

Deutschimo uses Neon/PostgreSQL. Neon history/instant restore must be verified in the Neon console for the actual project plan and configured history window.

Existing V31 backup and restore tooling is preserved:
- database-backup.mjs
- database-restore.mjs
- database-backup-policy.mjs
- v31-2-database-backup.yml
- v31-2-backup-restore-drill.yml

V47 does not run a production restore automatically.

## Target objectives

Initial beta target:
- RPO: <= 24 hours if only scheduled logical backups are available; lower when Neon history/PITR is configured.
- RTO: <= 2 hours for an operator-led recovery drill.

These are operational targets, not guarantees, until a timed restore drill is completed.

## Restore drill

1. Never target Production.
2. Create/choose an isolated staging/test database or Neon branch.
3. Restore a verified backup or restore point.
4. Run migrations only if the restored snapshot predates the deployed schema.
5. Run `npm run release:gate:v47`.
6. Run read-only smoke tests.
7. Record start/end time and data checkpoint.

## Frontend/server rollback

Vercel deployments are immutable. For application-code failures, roll back to the last known-good production deployment using Vercel rollback/promote controls, then investigate and issue a forward fix.

## Database rollback

Do not assume schema migrations are automatically reversible. Prefer:
EXPAND -> DEPLOY -> MIGRATE DATA -> CONTRACT

For a bad migration:
1. stop further releases,
2. assess whether application rollback is schema-compatible,
3. restore/repair in a controlled branch or apply a forward corrective migration,
4. only restore production from backup when data integrity requires it and the restore point is confirmed.
