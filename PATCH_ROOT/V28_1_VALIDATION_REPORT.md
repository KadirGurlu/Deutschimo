# Deutschimo V28.1 Doğrulama Raporu

## Doğrulanan yapı

- Proje sürümü `28.1.0` olarak güncellendi.
- Prisma datasource içinde Vercel Prisma Postgres tarafından üretilen `DATABASE_URL` ve `DATABASE_POSTGRES_URL` birlikte tanımlandı.
- Mevcut V28 şemasını yeniden kurabilen tam V28.1 baseline migration ve PostgreSQL migration kilidi oluşturuldu.
- Production ortamında `db push` çalışmasını engelleyen güvenlik katmanı eklendi.
- Production baseline işlemi tek kullanımlık açık onaya bağlandı.
- Preview/Production Vercel kaynak ayrımıyla uyumlu güvenlik kontrolü ve isteğe bağlı SHA-256 parmak izi koruması eklendi.
- Deterministik test kullanıcıları `isTestUser=true` olarak tasarlandı.
- Test verisi seed, reset, liste, doğrulama, temizlik ve temizlik doğrulama komutları eklendi.
- Seed içindeki süper yönetici oluşturma işlemi `BOOTSTRAP_ADMIN_ON_BUILD` bayrağına bağlandı.
- GitHub Actions'a PostgreSQL 16, migration idempotency ve test verisi temizleme kapıları eklendi.
- Vercel build komutu migration deploy tamamlanmadan uygulama build'ine geçmeyecek şekilde değiştirildi.

## Çalıştırılan kontroller

- Tüm yeni `.mjs` dosyalarında `node --check`: başarılı.
- Prisma uygulama URL doğrulaması ve doğrudan PostgreSQL hedef kimliği kontrolü: başarılı.
- `package.json` ve `vercel.json` JSON ayrıştırması: başarılı.
- `.github/workflows/ci.yml` YAML ayrıştırması: başarılı.
- `node scripts/validate-v28-1.mjs`: başarılı.
- Dosya/komut/koruma ilişkilerini kapsayan statik V28.1 doğrulaması: başarılı.

## Bu ortamda çalıştırılamayan kontroller

Bu çalışma konteynerinde PostgreSQL sunucusu ve Deutschimo'nun tam `node_modules` dizini bulunmadığı için gerçek veritabanına karşı `prisma migrate deploy`, migration diff, test seed/clean ve tam Next.js production build çalıştırılmadı. Bu işlemler güncellenen GitHub Actions PostgreSQL işi ve Vercel Preview deployment'ında doğrulanmak üzere yapılandırılmıştır.

## Kritik yayın koşulu

İlk production deployment'ından önce Vercel ortam değişkenleri ayrıştırılmalı ve `CONFIRM_PRODUCTION_BASELINE=DEUTSCHIMO_V28_1` yalnızca bir kez eklenmelidir. Deployment Ready olduktan sonra bu değişken silinmelidir.
