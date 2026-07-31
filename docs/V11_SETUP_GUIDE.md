# Deutschimo V11 kurulum rehberi

V11 gerçek PostgreSQL veritabanı kullandığı için kodu yüklemeden önce Vercel projesine bir Postgres veritabanı bağlanmalıdır.

## 1. Vercel'de PostgreSQL oluştur

1. Vercel'de `deutschimo` projesini aç.
2. `Storage` veya `Marketplace` bölümüne gir.
3. Bir PostgreSQL sağlayıcısı seç. Neon veya Prisma Postgres uygundur.
4. Veritabanını aynı Vercel projesine bağla.
5. Vercel Environment Variables bölümünde `DATABASE_URL` oluştuğunu kontrol et.

## 2. Zorunlu ortam değişkenleri

Vercel → Deutschimo → Settings → Environment Variables alanına şunları ekle:

```text
DATABASE_URL=<veritabanı tarafından otomatik eklenen bağlantı>
AUTH_SECRET=<uzun ve rastgele gizli anahtar>
AUTH_TRUST_HOST=true
ADMIN_EMAIL=<ilk yönetici e-posta adresin>
ADMIN_PASSWORD=<en az 8 karakter, harf ve rakam içeren güçlü şifre>
ADMIN_FIRST_NAME=Kadir
ADMIN_LAST_NAME=Gürlü
```

`AUTH_SECRET` üretmek için bilgisayarda aşağıdaki komutlardan biri kullanılabilir:

```bash
openssl rand -base64 32
```

Windows PowerShell:

```powershell
$bytes = New-Object byte[] 32
[Security.Cryptography.RandomNumberGenerator]::Fill($bytes)
[Convert]::ToBase64String($bytes)
```

Değerleri Production, Preview ve Development ortamlarına eklemek yerine başlangıçta en az Production için ekle.

## 3. İsteğe bağlı Google giriş

Google OAuth kullanılacaksa:

```text
AUTH_GOOGLE_ID=<Google OAuth Client ID>
AUTH_GOOGLE_SECRET=<Google OAuth Client Secret>
NEXT_PUBLIC_GOOGLE_AUTH_ENABLED=true
```

Google Cloud Console'daki yetkili callback adresi:

```text
https://deutschimo.vercel.app/api/auth/callback/google
```

Google bağlantısı kurulmayacaksa:

```text
NEXT_PUBLIC_GOOGLE_AUTH_ENABLED=false
```

## 4. İsteğe bağlı e-posta doğrulama ve şifre sıfırlama

Resend kullanılacaksa:

```text
RESEND_API_KEY=<Resend API anahtarı>
EMAIL_FROM=Deutschimo <noreply@alanadiniz.com>
REQUIRE_EMAIL_VERIFICATION=true
```

E-posta servisi henüz kurulmayacaksa:

```text
REQUIRE_EMAIL_VERIFICATION=false
```

Bu durumda yeni hesaplar doğrudan aktif olur. Şifre sıfırlama ekranı bulunur ancak e-posta gönderimi için Resend yapılandırılması gerekir.

## 5. V11 dosyalarını GitHub'a yükle

Ortam değişkenlerini ekledikten sonra V11 güncelleme paketini GitHub deposunun ana dizinine yükle.

Vercel build komutu şu işlemleri yapar:

```text
prisma generate
→ prisma db push
→ prisma db seed
→ next build
```

İlk build sırasında tablolar oluşturulur ve `ADMIN_EMAIL` ile belirtilen süper yönetici hesabı hazırlanır.

## 6. İlk giriş

Build `Ready` olduğunda:

```text
https://deutschimo.vercel.app/auth
```

adresinden `ADMIN_EMAIL` ve `ADMIN_PASSWORD` ile giriş yap.

Admin kullanıcı sayfası:

```text
https://deutschimo.vercel.app/admin/users
```

## 7. Güvenlik notları

- `ADMIN_PASSWORD` değerini kod dosyalarına yazma.
- `.env` dosyasını GitHub'a yükleme.
- Vercel'deki gizli değerleri yalnızca Environment Variables alanında tut.
- İlk girişten sonra güçlü ve benzersiz bir yönetici şifresi kullan.
- Veritabanı yedeği ve production migration sistemi V14 öncesinde ayrıca güçlendirilebilir.
