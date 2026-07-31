# Deutschimo V11

Deutschimo; A1–B2 düzeylerinde yapılandırılmış yazılı dersler, etkileşimli alıştırmalar, ünite testleri ve gerçek kullanıcı ilerleme takibi sunan Next.js eğitim platformudur.

## V11'in temel farkı

V10'a kadar kullanıcı ve ilerleme verileri yalnızca tarayıcıda tutuluyordu. V11 ile:

- Gerçek kayıt ve giriş sistemi
- Auth.js oturum yönetimi
- PostgreSQL ve Prisma ORM
- bcrypt ile güvenli parola saklama
- Gerçek admin kullanıcı yönetimi
- Farklı cihazlarda ilerleme senkronizasyonu
- Kullanıcıya özel localStorage çevrimdışı yedeği
- Profil ve günlük hedef yönetimi

aktif hâle gelir.

## İçerik kapsamı

| Seviye | Ünite | Ders slaytı | Ana alıştırma | Konu sonu kontrolü | Quiz sorusu |
|---|---:|---:|---:|---:|---:|
| A1 | 12 | 180 | 120 | 108 | 84 |
| A2 | 16 | 240 | 160 | 144 | 112 |
| B1 | 18 | 270 | 180 | 162 | 126 |
| B2 | 20 | 300 | 200 | 180 | 140 |
| **Toplam** | **66** | **990** | **660** | **594** | **462** |

## Teknoloji

- Next.js 15
- React 19
- TypeScript
- Auth.js
- PostgreSQL
- Prisma ORM
- bcryptjs
- Recharts
- Vercel

## Kurulum

Önce `.env.example` dosyasını `.env` olarak kopyala ve `DATABASE_URL`, `AUTH_SECRET`, `ADMIN_EMAIL` ve `ADMIN_PASSWORD` alanlarını doldur.

```bash
npm install
npm run db:push
npm run db:seed
npm run dev
```

Vercel kurulumu için `docs/V11_SETUP_GUIDE.md` dosyasını kullan.

## Doğrulama

```bash
npm run validate:content
npm run validate:v9
npm run validate:v10
npm run validate:v11
npm run build
```

## Önemli rotalar

```text
/auth
/forgot-password
/dashboard
/profile
/progress
/admin
/admin/users
/admin/content
```
