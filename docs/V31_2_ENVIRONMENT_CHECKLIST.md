# V31.2 Ortam Kontrol Listesi

## Tüm ortamlar
- `DATABASE_ENVIRONMENT`: development/test/preview/staging/production
- `DATA_CLASSIFICATION`: synthetic veya production
- `AUTH_SECRET`, `SECURITY_HASH_KEY`, `CRON_SECRET`
- `PRODUCTION_DATABASE_FINGERPRINT` ve `PREVIEW_DATABASE_FINGERPRINT` farklı
- Vercel Project Settings > Node.js Version: `22.x`

## GitHub Production environment secrets
- `PRODUCTION_DATABASE_POSTGRES_URL`
- `BACKUP_ENCRYPTION_KEY` (64 hex)
- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`
- `PRODUCTION_DATABASE_FINGERPRINT`
- `PREVIEW_DATABASE_FINGERPRINT`

Production: `DATA_CLASSIFICATION=production`. Preview/Test: yalnızca synthetic/test veri. Production'da `isTestUser=true` kaydı bulunamaz.
