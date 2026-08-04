# Deutschimo V28.1 — Staging ve Migration

V28.1, kullanıcı arayüzünü değiştirmek yerine veritabanı yayın sürecini güvenli hâle getirir. Preview, production, development ve test ortamları açıkça ayrılır; production verisine test kaydı yazılması veya `prisma db push` uygulanması engellenir.

## Preview veritabanı

- `DATABASE_ENVIRONMENT` ile ortam kimliği zorunlu hâle getirildi.
- Vercel Prisma Postgres için uygulama `DATABASE_URL` bağlantısı ile migration amaçlı `DATABASE_POSTGRES_URL` ayrıldı.
- Preview ortamının production veritabanına bağlanmasını engelleyen SHA-256 parmak izi kontrolü eklendi.
- Boş Preview/Test veritabanı ilk deployment sırasında yalnızca tam baseline migration ile hazırlanır; deployment akışında `db push` kullanılmaz.

## Production ayrıştırması

- Production'da `prisma db push` çalışmaz.
- İlk V28.1 deployment'ında mevcut production şeması tablo kontrollerinden sonra migration baseline olarak işaretlenir.
- Bu işlem `CONFIRM_PRODUCTION_BASELINE=DEUTSCHIMO_V28_1` tek kullanımlık onayı olmadan başlamaz.
- Baseline tamamlandıktan sonra tüm şema değişiklikleri `prisma migrate deploy` ile uygulanır.

## Prisma migration düzeni

- Mevcut V28 şemasının 32 tablosunu, enumlarını, indekslerini ve ilişkilerini oluşturan tam `20260803143000_v28_1_baseline` migration dosyası eklendi.
- Development ortamında migration oluşturma ve uygulama komutları eklendi.
- CI içinde migration'ın iki kez güvenle uygulanabildiği doğrulanır.
- Vercel build süreci migration kapısından geçmeden Next.js build'e başlamaz.

## Test verisi

- A1, A2, B1 öğrencileri ve bir içerik editörü için deterministik Preview hesapları eklendi.
- Kullanıcılar `isTestUser=true` ile açıkça işaretlenir.
- Seed, reset, listeleme, doğrulama ve temizleme komutları eklendi.
- Tüm test verisi işlemleri production ortamında sert biçimde reddedilir.

## CI/CD

- GitHub Actions'a PostgreSQL 16 servisi eklendi.
- Ayrı migration güvenlik işi oluşturuldu.
- E2E testleri izole test veritabanı ve deterministik test hesaplarıyla çalışır.
- Test bittikten sonra test verileri temizlenir ve sıfır kayıt kaldığı doğrulanır.
