
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
| A1 | 12 | 180 | 168 | 108 | 120 |
| A2 | 16 | 240 | 224 | 144 + 96 okuma/dinleme | 160 |
| B1 | 18 | 270 | 252 | 162 + 108 okuma/dinleme | 180 |
| B2 | 20 | 300 | 280 | 180 + 120 okuma/dinleme | 200 |
| **Toplam** | **66** | **990** | **924** | **918 kontrol sorusu** | **660** |

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
npm run validate:v16
npm run validate:v16:types
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

## V14 — Gelişmiş kelime öğrenme

V14, kişisel kelime defterine aralıklı tekrar, yedi görev türü, ayrıntılı fiil/isim bilgileri, hata geçmişi ve otomatik sonraki tekrar planlaması ekler. Ayrıntılar için `CHANGELOG_V14.md` dosyasına bakın.


## V16 — İçerik odaklı genişleme

V16, A1–B2 kapsamındaki 66 ünitenin içerik yoğunluğunu artırır. Her üniteye CEFR/GER hedefleri, en az 10 kelime, kültür ve günlük yaşam notu, özgün bağlam, okuma/dinleme çalışmaları, seviyeye uygun yazma-konuşma görevleri ve gerçek yaşam aktarım görevi eklenmiştir. Ünite başına ana alıştırma sayısı 14'e, ünite sonu değerlendirmesi 10 soruya çıkarılmıştır. Ayrıntılar için `CHANGELOG_V16.md`, kaynak yaklaşımı için `docs/V16_CONTENT_SOURCES.md` dosyasına bakın.
