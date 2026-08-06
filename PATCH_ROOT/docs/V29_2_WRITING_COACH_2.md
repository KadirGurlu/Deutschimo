# V29.2 Yazma Koçu 2.0 — Teknik ve pedagojik tasarım

## 1. Amaç

Yazma Koçu’nun görevi öğrencinin yerine doğru Almanca metin üretmek değil, öğrenciyi kendi metnini iyileştirecek bir revizyon döngüsüne sokmaktır.

Akış:

1. Öğrenci ilk metni yazar.
2. Sistem hata yerlerini öğrencinin kendi cümleleri içinde gösterir.
3. Hata türü Türkçe açıklanır ve doğrudan cevap vermeyen bir ipucu sunulur.
4. Öğrenci metni kendisi düzeltir.
5. Revizyon tekrar değerlendirilir.
6. İlk ve son metin, genel puan ve rubrik boyutları karşılaştırılır.

## 2. Cümle bazında hata işaretleme

AI yalnızca öğrencinin metninde birebir bulunan kısa `excerpt` değerleri döndürebilir. Sunucu `studentText.includes(excerpt)` kontrolü yapar. İstemci, alıntının geçtiği cümleyi bulup ilgili parçayı işaretler.

Renk grupları:

- Gramer: artikel, hâl, fiil konumu, çekim, zaman, edat, sözcük dizimi ve uyum
- Kelime/üslup: kelime seçimi ve register
- Bağlantı/görev: bağlaç, tutarlılık ve görev kapsamı
- Yazım/noktalama: spelling ve punctuation

Renk tek başına anlam taşımadığı için her işarette hata etiketi de gösterilir.

## 3. Öz-düzeltme

Her hata kartında öğrenci “Bu hatayı metnimde düzelttim” kontrolünü işaretler. Bu kontrol otomatik olarak doğru kabul edilmez; gerçek doğrulama, öğrenci revizyonu yeniden gönderdiğinde yapılır.

Sonraki değerlendirmede:

- Önceki hata türü artık yoksa `resolvedErrorCount` artar.
- Hata türü devam ediyorsa `repeatedErrorCount` artar.
- Yeni bir hata türü oluşmuşsa `newErrorCount` artar.

## 4. Revizyon karşılaştırması

Her oturum tek senaryo ve tek rubrik modu için kullanılır. Rubrik modu değiştirilirse yeni oturum başlatılır; farklı ağırlıklarla hesaplanan puanlar aynı gelişim grafiğinde karıştırılmaz.

Karşılaştırma alanları:

- İlk puan
- Son puan
- Önceki revizyona göre değişim
- İlk revizyona göre toplam değişim
- Altı rubrik boyutunun puan farkı
- Giderilen, tekrarlanan ve yeni hata türleri
- İlk ve son metin

## 5. Rubrik modları

### Deutschimo

Altı boyutu dengeli biçimde değerlendirir. Amaç öğrencinin seviyesine uygun gelişimini takip etmektir.

### Goethe benzeri pratik

Görevi yerine getirme, dilsel doğruluk, kelime kullanımı ve metin düzenine daha fazla ağırlık verir. Resmî Goethe değerlendirmesi değildir.

### telc benzeri pratik

Görev kapsamı, iletişimsel etki ve cümle bağlantılarına daha fazla ağırlık verir. Resmî telc değerlendirmesi değildir.

Genel puan AI’dan doğrudan kabul edilmez. Sunucu altı rubrik puanını seçilen modun ağırlıklarıyla yeniden hesaplar.

## 6. Kelime ve bağlaç önerileri

AI yalnızca kısa sözcük veya kalıp önerileri döndürebilir. Sunucu:

- Altı sözcükten uzun önerileri,
- tam cümle biçimindeki önerileri,
- yinelenen önerileri

çıkarır. Böylece öneri alanı model metne dönüşmez.

## 7. Hazır metin taleplerini reddetme

Kısa bir metin içinde Türkçe, Almanca veya İngilizce “metni/ödevi benim için yaz” kalıpları tespit edilirse istek AI servisine gönderilmeden 422 koduyla reddedilir. Sistem öğrenciye önce kendi Almanca denemesini yazmasını söyler.

Ayrıca sistem talimatı, öğrenci metni içindeki prompt injection girişimlerini ve model cevap taleplerini yok sayar.

## 8. Akıllı Tekrar köprüsü

Her yazma hatası:

- `WritingErrorProfile` ile hata sıklığına,
- `LearningErrorHistory` ile ortak hata geçmişine,
- `CompetencyRecord` ile ilgili yazma hedefinin ustalık değerine

aktarılır.

Aynı hata en az iki kez görülürse veya hata yüksek öncelikliyse `AdaptiveReviewAttempt` içinde `WRITING_ERROR / ERROR_REPAIR` kaydı oluşturulur. Tekrar tarihi hata şiddetine göre 1–4 gün arasına planlanır.

Revizyonda giderilen hata türleri çözülmüş olarak işaretlenir ve ustalık puanı yükseltilir.

## 9. Veri modeli

### WritingCoachSession

- `rubricMode`
- `initialScore`
- `latestScore`
- `scoreImprovement`

### WritingCoachAttempt

- `rubricMode`
- `previousAttemptId`
- `isRevision`
- `improvement`
- `errorCount`
- `resolvedErrorCount`
- `repeatedErrorCount`
- `newErrorCount`
- `suggestions`
- `comparison`

## 10. Sınırlar

- Puanlar öğrenme ve pratik amaçlıdır.
- Goethe/telc modları resmî sınav değerlendirmesi değildir.
- AI geri bildirimi öğretmen değerlendirmesinin yerine geçmez.
- AI servisi çalışmadığında metin kaydedilmeden anlaşılır hata döndürülür.
- Öğrenci adı ve e-posta adresi AI isteğine eklenmez.
