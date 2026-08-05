# V30.2 — Gerçek Almanya Modu Öğrenme Sistemi

V30.2, V30.1'de eklenen senaryo kataloğunu kullanıcı hesabına bağlı gerçek bir öğrenme sistemine dönüştürür.

## Kullanıcı hesabına kayıt

Her senaryo için aşağıdaki bilgiler veritabanında saklanır:

- durum: başlanmadı / devam ediyor / tamamlandı
- taslak cevaplar
- son kalınan adım
- son puan
- en iyi puan
- deneme sayısı
- tamamlanma tarihi

Taslaklar yalnızca tarayıcıda tutulmaz. Kullanıcı başka bir cihazdan giriş yaptığında aynı senaryoya devam edebilir.

## Dört beceri değerlendirmesi

Her tamamlanan senaryo dört ayrı puan üretir:

- Okuma
- Dinleme
- Form doğruluğu
- Yazılı iletişim

Genel puan, bu dört alanın ortalamasıdır.

## Değerlendirme motoru

Birincil değerlendirme OpenAI üzerinden yapılandırılmış JSON çıktısıyla yapılır. Kullanılan model sırası:

1. `OPENAI_REAL_GERMANY_MODEL`
2. `OPENAI_WRITING_MODEL`
3. varsayılan `gpt-5.4-mini`

OpenAI erişilemezse senaryo tamamen kilitlenmez. Uzunluk, görev kapsamı ve anahtar kelime eşleşmesine dayalı güvenli bir **ön değerlendirme** çalışır. Arayüz bu sonucu açıkça “ön değerlendirme” olarak işaretler.

## Deneme karşılaştırması

İkinci ve sonraki denemelerde:

- önceki genel puan
- genel puan farkı
- okuma farkı
- dinleme farkı
- form farkı
- yazma farkı

gösterilir.

Önceki denemeler silinmez.

## Akıllı Tekrar bağlantısı

Değerlendirmede tespit edilen gelişim alanları:

- `LearningErrorHistory`
- `CompetencyRecord`
- `AdaptiveReviewAttempt`
- `AssessmentEvidence`

kayıtlarına aktarılır.

Orta ve yüksek öncelikli hatalar Akıllı Tekrar kuyruğuna gönderilir. Günlük plan önbelleği temizlenerek yeni hataların sonraki plana yansıması sağlanır.

## Yeni Prisma modelleri

- `RealGermanyScenarioProgress`
- `RealGermanyScenarioAttempt`

Ayrıca `AssessmentSourceType` enum'una `REAL_GERMANY` eklenir.

## Güvenlik

- İstekler oturum gerektirir.
- Senaryo ve seviye sunucuda doğrulanır.
- İstemciden doğru cevap veya puan kabul edilmez.
- Cevap uzunlukları sınırlandırılır.
- Kullanıcı başına 10 dakikada 12 değerlendirme sınırı uygulanır.
- AI çıktısı şema ve izin verilen değerlerle temizlenir.
- Migration yalnızca yeni enum değeri, tablolar ve indeksler ekler; veri silmez.
