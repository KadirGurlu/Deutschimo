# CHANGELOG — V30.2

## Yeni
- Gerçek Almanya senaryoları kullanıcı hesabına bağlandı.
- Cihazlar arası taslak ve ilerleme senkronizasyonu eklendi.
- Başlanmadı, devam ediyor ve tamamlandı durumları eklendi.
- Okuma, dinleme, form ve yazma için ayrı puanlama eklendi.
- Genel görev puanı ve sonuç paneli eklendi.
- İlk ve sonraki deneme karşılaştırması eklendi.
- “Bu senaryoyu tekrar çalış” akışı eklendi.
- Zayıf alanların Akıllı Tekrar'a aktarılması eklendi.
- OpenAI erişilemediğinde açıkça işaretlenen güvenli ön değerlendirme eklendi.

## Veritabanı
- `AssessmentSourceType.REAL_GERMANY` eklendi.
- `RealGermanyScenarioProgress` tablosu eklendi.
- `RealGermanyScenarioAttempt` tablosu eklendi.
- Mevcut veri silinmez.

## API
- `GET/PATCH /api/real-germany/progress`
- `POST /api/real-germany/evaluate`

## Doğrulama
- V30.1 doğrulayıcısı, V30.2 arayüz metinleriyle geriye dönük uyumlu hale getirildi.

## Sürüm
- `package.json`: `30.2.0`
