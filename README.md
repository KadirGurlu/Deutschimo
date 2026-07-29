# Deutschimo V6

Deutschimo, A1-B2 düzeylerinde yazılı ders anlatımı, etkileşimli alıştırmalar, ünite testleri ve ayrıntılı ilerleme takibi sunan responsive bir Next.js eğitim platformudur.

## Güncel içerik kapsamı

| Seviye | Ünite | Ders slaytı | Alıştırma | Quiz sorusu |
|---|---:|---:|---:|---:|
| A1 | 12 | 96 | 120 | 84 |
| A2 | 16 | 128 | 160 | 112 |
| B1 | 18 | 144 | 180 | 126 |
| B2 | 20 | 160 | 200 | 140 |
| **Toplam** | **66** | **528** | **660** | **462** |

Her ünitede varsayılan olarak:

- 8 odaklanmış ders slaytı
- Dikey ve okunabilir kelime tablosu
- Ünitedeki fiiller için Präsens çekim tabloları
- Ayrıntılı gramer açıklaması ve kullanım stratejisi
- Cümle kalıpları ve bağlam örnekleri
- 10 etkileşimli alıştırma
- 7 soruluk ünite sonu değerlendirmesi
- Slayt, alıştırma ve quiz ağırlıklı ilerleme hesabı

## Öne çıkan V6 düzeltmeleri

- Alıştırma seçeneği tıklandığında cevabın render sonrasında sıfırlanması engellendi.
- Seçim yapıldığı anda `Kontrol Et` butonu etkinleşir.
- Ünite bazlı slayt ve alıştırma dizileri kararlı referanslarla sunulur.

- Çoktan seçmeli ve çoklu seçim soruları erişilebilir buton yapısına dönüştürüldü.
- Seçim yapıldıktan sonra `Kontrol Et` butonu aktifleşir.
- Yanıt geri bildirimi, tekrar deneme ve sonraki alıştırmaya geçiş akışı düzeltildi.
- Quiz seçenekleri de aynı güvenilir seçim bileşenine geçirildi.
- Eski tarayıcı verilerinin yeni içeriği bozmasını önlemek için demo depolama anahtarları V5'e yükseltildi.
- Kelimeler artık yan yana etiketler yerine alt alta, artikel/tür/anlam bilgisiyle gösterilir.
- Kelime listesinde yer alan fiiller otomatik olarak çekim slaydına aktarılır.
- Ünite başına slayt sayısı 6'dan 8'e, alıştırma sayısı 8'den 10'a, quiz soru sayısı 5'ten 7'ye çıkarıldı.

## Kurulum

```bash
npm install
npm run dev
```

Yerel adres:

```text
http://localhost:3000
```

Production kontrolü:

```bash
npm run build
npm start
```

## Ana rotalar

```text
/courses/a1
/courses/a2
/courses/b1
/courses/b2
/learn/a1/a1-u01
/learn/a1/a1-u01/exercises
/learn/a1/a1-u01/quiz
/dashboard
/progress
/admin/content
/admin/users
```

## Veri notu

Bu sürüm demo kullanıcı ilerlemesini ve admin içerik değişikliklerini tarayıcı `localStorage` alanında saklar. Tüm cihazlardan ortak kullanıcı ve içerik yönetimi için PostgreSQL, Prisma ve Auth.js bağlantısı gerekir.
