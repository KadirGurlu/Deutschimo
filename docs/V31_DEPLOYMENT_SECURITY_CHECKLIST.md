# V31 Deployment Security Checklist

## Vercel Environment Variables

Zorunlu mevcut değerler:

- `AUTH_SECRET`
- `SECURITY_HASH_KEY`
- `CRON_SECRET`
- `DATABASE_URL`
- `DATABASE_POSTGRES_URL`
- `DATABASE_ENVIRONMENT`

Önerilen:

- `HEALTH_CHECK_SECRET`: `CRON_SECRET` değerinden farklı, en az 32 karakter
- `MIN_WEB_APP_VERSION=31.0.0`

## Deployment sonrası

1. Preview deployment `Ready` olmalı.
2. Migration listesinde `20260805150000_v31_platform_core` uygulanmış görünmeli.
3. `/api/v1/health` gizli bilgi göstermeden `status=ok` döndürmeli.
4. Derin health check anahtarsız çağrıldığında 403 dönmeli.
5. `/api/v1/bootstrap` oturumsuz çağrıldığında 401 dönmeli.
6. Cihaz kayıt endpoint'i `Idempotency-Key` olmadan 400 dönmeli.
7. Aynı idempotency anahtarıyla aynı istek tekrarlandığında `Idempotency-Replayed: true` dönmeli.
8. Aynı anahtarla farklı gövde gönderildiğinde 409 dönmeli.
9. Günlük bakım loglarında yedekleme ve cleanup sonuçları görünmeli.
10. Production'a geçmeden önce Preview veritabanı ile Production veritabanının farklı olduğu tekrar doğrulanmalı.
