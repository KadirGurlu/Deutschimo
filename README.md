
## V13 — Beceri Laboratuvarları

Deutschimo artık A1–B2 düzeylerinde dinleme, konuşma, okuma ve yazma laboratuvarları içerir. Çalışmalar kullanıcı hesabına kaydedilir; dinleme ve okuma kelimeleri kişisel kelime defterine eklenebilir. Ayrıntılar için `CHANGELOG_V13.md` dosyasına bakın.
# Deutschimo V12

Deutschimo; A1–B2 düzeylerinde yapılandırılmış yazılı dersler, etkileşimli alıştırmalar, ünite testleri, gerçek kullanıcı ilerleme takibi ve kişiselleştirilmiş öğrenme zekâsı sunan Next.js eğitim platformudur.

## V12'nin temel farkı

V11'in Auth.js, PostgreSQL ve cihazlar arası ilerleme altyapısına ek olarak:

- 24 soruluk A1–B2 seviye belirleme sınavı
- Alıştırma ve quiz sonuçlarından zayıf konu tespiti
- Yanlış cevaplardan otomatik akıllı tekrar kuyruğu
- Günlük hedefe göre kişiselleştirilmiş çalışma planı
- Dashboard içinde öğrenme zekâsı özeti

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

`.env.example` dosyasını `.env` olarak kopyala ve V11 değişkenlerini doldur.

```bash
npm install
npm run db:push
npm run db:seed
npm run dev
```

## Doğrulama

```bash
npm run validate:content
npm run validate:v9
npm run validate:v10
npm run validate:v11
npm run validate:v12
npm run build
```

## V12 rotaları

```text
/placement-test
/weak-topics
/smart-review
/study-plan
```

Ayrıntılı değişiklikler için `CHANGELOG_V12.md`, yükleme için `UPLOAD_INSTRUCTIONS_V12.txt` dosyasını kullan.
