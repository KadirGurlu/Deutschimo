# Deutschimo V28.1 — Prisma Postgres Ortamları ve Migration Düzeni

## Ortam ayrımı

Deutschimo iki ayrı Prisma Postgres kaynağı kullanır:

- `deutschimo`: yalnızca Vercel **Production**
- `deutschimo-preview`: yalnızca Vercel **Preview**

Vercel entegrasyonu her ortam için şu değişkenleri otomatik üretir:

- `DATABASE_URL`: uygulama sorgularında kullanılan Prisma bağlantısı
- `DATABASE_POSTGRES_URL`: doğrudan PostgreSQL bağlantısı; Prisma Migrate ve güvenlik kontrolleri bunu kullanır
- `DATABASE_PRISMA_DATABASE_URL`: entegrasyonun sağladığı ek Prisma bağlantısı

Prisma datasource yapılandırması:

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DATABASE_POSTGRES_URL")
}
```

## Preview hazırlığı

Preview kapsamı:

```text
DATABASE_ENVIRONMENT=preview
AUTO_INIT_NON_PRODUCTION_DATABASE=true
SEED_PREVIEW_TEST_DATA=true
TEST_USER_PASSWORD=<en az 12 karakter>
```

Boş Preview veritabanında `prisma migrate deploy` baseline migration'ı uygular. Ardından normal seed ve deterministik Preview test verisi hazırlanır.

## Production hazırlığı

Production kapsamı:

```text
DATABASE_ENVIRONMENT=production
AUTO_INIT_NON_PRODUCTION_DATABASE=false
SEED_PREVIEW_TEST_DATA=false
```

İlk Production migration geçişinde mevcut şema silinmez veya yeniden oluşturulmaz. Sistem gerekli tabloları ve şema uyumunu kontrol eder; ardından mevcut şemayı migration geçmişinde baseline olarak işaretler. Bu işlem için yalnızca ilk deployment'ta:

```text
CONFIRM_PRODUCTION_BASELINE=DEUTSCHIMO_V28_1
```

kullanılır ve deployment `Ready` olduktan sonra silinir.

## İsteğe bağlı fingerprint koruması

Vercel ortam bağlantıları zaten ayrılmıştır. İkinci bir güvenlik katmanı istenirse Production ortamının `DATABASE_POSTGRES_URL` değeriyle yerelde:

```powershell
$env:DATABASE_URL="<production DATABASE_URL>"
$env:DATABASE_POSTGRES_URL="<production DATABASE_POSTGRES_URL>"
$env:DATABASE_ENVIRONMENT="production"
npm run db:fingerprint
```

çalıştırılabilir. Çıktı yalnızca Preview kapsamına `PRODUCTION_DATABASE_FINGERPRINT` olarak eklenir. Bağlantı adresleri hiçbir dosyaya yazılmaz.

## Yasaklanan işlemler

Production ortamında `db push`, test seed/reset/clean ve otomatik boş veritabanı hazırlığı kod seviyesinde engellenir. `prisma migrate reset` Production için kullanılmamalıdır.
