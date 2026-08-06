# Deutschimo V31.1 – Stabilizasyon Sürümü

V31.1 yeni büyük bir modül eklemek yerine V31'in güvenilir biçimde çalıştığını kanıtlayan sürümdür.

## Sürüm kapsamı

- Ana sayfa, kayıt, giriş, çıkış ve dashboard kritik akışları Playwright ile test edilir.
- Sidebar'daki bütün rotalar oturum açıkken ziyaret edilir; 404, 500 ve beklenmeyen giriş yönlendirmesi hata sayılır.
- Vercel build akışı V31.1 doğrulamasını ve veritabanı ortam kontrolünü çalıştırır.
- Production ve Preview için migration komutu `prisma migrate deploy` olarak korunur.
- `prisma/migrations` geçmişinin Git içinde bulunması zorunlu tutulur.
- Preview ve Production veritabanlarının yanlışlıkla aynı hedefe bağlanması parmak izi kontrolüyle engellenir.
- Yeni büyük modüle geçmeden önce yedi gün üst üste sıfır kritik hata kaydı gerekir.

## Temel komutlar

```bash
npm run validate:v31.1
npm run db:environment:verify
npm run db:environment:verify:strict
npm run test:e2e:v31.1
npm run release:v31.1
```

## Vercel veritabanı ayrımı

Her Vercel ortamında `DATABASE_ENVIRONMENT` tanımlayın:

- Production: `production`
- Preview: `preview`

Önce her ortamın build logunda yazan `DATABASE_FINGERPRINT` değerini alın. Sonra iki Vercel scope'una da şu değişkenleri ekleyin:

```text
PRODUCTION_DATABASE_FINGERPRINT=<production logundaki tam SHA-256>
PREVIEW_DATABASE_FINGERPRINT=<preview logundaki tam SHA-256>
```

Son doğrulama:

```bash
npm run db:environment:verify:strict
```

Parolaları veya bağlantı URL'lerini Git'e eklemeyin. Yalnızca SHA-256 parmak izleri saklanır.

## Migration politikası

Production ve Preview deployment'larında şema değişikliği için:

```bash
npx prisma migrate deploy
```

Yeni migration geliştirme ortamında oluşturulur, `prisma/migrations/**` dosyaları commit edilir ve deployment sırasında `migrate deploy` uygulanır. Production'da `prisma db push` kullanılmaz.
