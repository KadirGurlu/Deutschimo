# Deutschimo V28.3 — Akıllı Tekrar 2.0

## Ana hedef

Tekrar zamanını yalnızca doğru/yanlış veya dört öz değerlendirme düğmesine göre belirleyen eski akış, her kelimeyi ve öğrenme hedefini ayrı izleyen uyarlanabilir bir sisteme dönüştürüldü.

## Yeni planlama sinyalleri

Her denemede aşağıdaki sinyaller birlikte değerlendirilir:

1. Cevabın doğru veya yanlış olması
2. Cevap süresi
3. İpucu kullanımı
4. Aynı hatanın tekrar sayısı
5. Son görülme ve son tekrar zamanı
6. Öğenin 1–5 arasındaki zorluğu
7. Öğrencinin **Eminim / Emin değilim** seçimi

Yanlış cevaplar 10–120 dakika içinde kısa tekrara alınır. Doğru cevapların aralığı; hız, ipucu, güven kalibrasyonu, zorluk, önceki istikrar ve tekrar geçmişine göre 1–365 gün arasında hesaplanır.

## Yeni tekrar biçimleri

- Almanca → Türkçe
- Türkçe → Almanca
- Dinle → Yaz
- Boşluğu doldur
- Cümleyi sırala
- Sesli söyle
- Yeni cümlede kullan

Artikel ve çoğul tekrarları kelime türüne göre ek destek biçimleri olarak korunur. Eski `AUDIO_TO_WORD` ve `SENTENCE` kayıtları geriye dönük olarak yeni modlara yönlendirilir.

## Veri modeli

- `VocabularyNotebookItem` içine zorluk, istikrar, geri çağırılabilirlik, güven kalibrasyonu, ipucu, tekrar eden hata ve cevap süresi alanları eklendi.
- `CompetencyRecord`, kelime dışındaki öğrenme hedefleri için aynı uyarlanabilir hafıza durumunu taşır.
- `AdaptiveReviewAttempt`, kelime ve kişisel tekrar denemelerini ortak bir sinyal günlüğünde toplar.
- Migration yalnızca ekleme yapar; mevcut öğrenci ilerlemesini veya tekrar geçmişini silmez.

## Arayüz

- Cevap kontrolünden önce güven seçimi zorunludur.
- İpucu kullanımı açık biçimde işaretlenir ve planlayıcıya gönderilir.
- Öğrenci her kartta zorluk, hedef süre, ustalık ve tekrar eden hata bilgisini görebilir.
- Kavram tekrarında yalnızca “tamamladım” demek yerine yeni bir Almanca örnek yazılır.
- Cümle sıralama için etkileşimli kelime bankası, sesli söyleme için dinle/tekrar et akışı eklendi.

## Güvenlik ve yayın

- V28.1 migration güvenliği korunur.
- Yeni migration, Preview veritabanında `prisma migrate deploy` ile uygulanır.
- `validate:v28.3` build kapısı; yedi sinyali, yedi modu, migration'ı, şema alanlarını ve arayüz kontrollerini doğrular.
Deployment trigger: V28.3 Preview