# Deutschimo V29 — Yazma Koçu Teknik ve Pedagojik Tasarım

## 1. Pedagojik ilke

Yazma Koçu'nun amacı öğrencinin yerine doğru Almanca metin üretmek değil, öğrencinin kendi metnini bilinçli biçimde düzeltmesini sağlamaktır. Bu nedenle değerlendirme döngüsü üç adımdır:

1. **Fark et:** Hatalı veya geliştirilmesi gereken bölüm, öğrencinin kendi metninden birebir alıntıyla işaretlenir.
2. **Anla:** Hata kategorisi ve ilgili dil kuralı Türkçe açıklanır.
3. **Üret:** Doğru cümle verilmeden ipucu ve yönlendirici soruyla öğrenci yeniden yazmaya davet edilir.

AI çıktısında `correctedText`, `modelAnswer` veya benzeri bir alan yoktur. Sunucu, AI'nın hata alıntısının öğrenci metninde gerçekten bulunmasını zorunlu tutar.

## 2. Seviye mimarisi

### A1

Kısa tanıtım, davet, randevu iptali, kartpostal, günlük rutin ve basit yardım isteği. Hedef 35–85 kelime. Öncelik anlaşılabilirlik, temel fiil çekimi, artikel ve basit cümle yapısıdır.

### A2

Bilgi isteme, ev sorunu, gezi anlatımı, plan değişikliği, kısa görüş ve hizmet şikâyeti. Hedef 65–140 kelime. Öncelik zaman anlatımı, temel yan cümleler, günlük resmiyet ve bağlaçlardır.

### B1

Resmî şikâyet, iş başvurusu, forum görüşü, etkinlik raporu, kurumdan bilgi isteme ve tavsiye yazısı. Hedef 115–210 kelime. Öncelik bağlantılı paragraflar, neden-sonuç, örnekler ve uygun üsluptur.

### B2

Tartışmacı yazı, gelişmiş şikâyet, iş yeri önerisi, akademik e-posta, okur mektubu ve proje taslağı. Hedef 180–310 kelime. Öncelik tutarlı argüman, farklı bakış açıları, register ve karmaşık yapılardır.

## 3. Rubrik

| Boyut | Ölçülen özellik |
|---|---|
| Görevi yerine getirme | Zorunlu maddelerin karşılanması ve amaca uygunluk |
| Gramer doğruluğu | Çekim, hâl, fiil konumu, zaman ve yapı doğruluğu |
| Kelime çeşitliliği | Seviyeye uygun, doğru ve tekrara düşmeyen kelime seçimi |
| Cümle bağlantıları | Bağlaçlar, paragraf akışı ve düşünceler arası ilişki |
| Yazım ve noktalama | Büyük harf, birleşik kelime, virgül ve noktalama |
| Seviyeye uygunluk | Metnin seçilen CEFR düzeyinin beklentilerine uygunluğu |

Her boyut 0–100 puanlanır. Genel puan AI'dan doğrudan kabul edilmez; altı boyutun ortalaması sunucuda tekrar hesaplanır.

## 4. AI sözleşmesi

Sunucu OpenAI Responses API'ye şu verileri gönderir:

- Seviye
- Senaryo başlığı ve görev açıklaması
- Zorunlu görev maddeleri
- Önerilen kelime aralığı
- Öğrencinin Almanca metni

Gönderilmeyen bilgiler:

- Ad, soyad
- E-posta
- Kullanıcı kimliği
- Şifre veya oturum bilgisi
- Diğer öğrenci verileri

Strict JSON Schema çıktısı:

- Altı boyutlu rubrik
- En fazla sekiz öncelikli hata
- Somut güçlü yönler
- Zorunlu görev maddelerinin kapsanma durumu
- Sonraki adım
- Seviyeye uygunluk açıklaması

## 5. Hata kategorileri

- ARTICLE
- DATIVE
- ACCUSATIVE
- VERB_POSITION
- VERB_CONJUGATION
- TENSE
- PREPOSITION
- WORD_ORDER
- AGREEMENT
- VOCABULARY
- CONNECTOR
- SPELLING
- PUNCTUATION
- TASK_FULFILLMENT
- REGISTER
- COHERENCE
- OTHER

Her kategori kullanıcı bazında `WritingErrorProfile` içinde sayılır. Son hata örneği ve tekrar zamanı saklanır. Aynı kayıt `LearningErrorHistory` sistemine de işlenerek Akıllı Tekrar ve Günlük Plan katmanlarına bağlanır.

## 6. Revizyon döngüsü

Bir senaryo açıldığında öğrenci taslağı yerel olarak korunur. İlk kontrol bir `WritingCoachSession` oluşturur. Her yeniden kontrol:

- Aynı oturumda yeni revision numarası alır.
- Tam öğrenci metnini ve yapılandırılmış geri bildirimi ayrı `WritingCoachAttempt` kaydı olarak saklar.
- En iyi puanı oturumda günceller.
- 85+ puan ve en fazla bir öncelikli hata varsa oturumu `MASTERED` olarak işaretler.

Bu yapı ileride “ilk taslak–son taslak farkı”, gelişim grafiği ve öğretmen incelemesi eklemeye hazırdır.

## 7. Ortam değişkenleri

Zorunlu:

```text
OPENAI_API_KEY=<OpenAI API anahtarı>
```

Önerilen:

```text
OPENAI_WRITING_MODEL=gpt-5.4-mini
```

Her iki değişken de Vercel'de Preview ve Production için ayrı kapsamlarla eklenmelidir. `OPENAI_API_KEY` Sensitive olarak tutulmalıdır. `NEXT_PUBLIC_` öneki kesinlikle kullanılmamalıdır.

## 8. Maliyet kontrolü

- Kullanıcı başına 10 dakikada 12 kontrol.
- En fazla 8.000 karakter giriş.
- En fazla 3.000 çıktı tokenı.
- Yalnızca senaryo ve metin gönderimi.
- Varsayılan olarak yüksek hacimli kullanım için mini model.
- Model environment variable ile değiştirilebilir.

## 9. Ürün sınırları

- AI geri bildirimi öğretmen veya resmî sınav değerlendiricisi değildir.
- Puan, öğrenme yönlendirmesi içindir; Goethe/telc/TestDaF sonucu değildir.
- Kullanıcı arayüzünde hazır model metin gösterilmez.
- AI hata alıntısı öğrenci metninde bulunmuyorsa kayıt ve gösterimden çıkarılır.
- API anahtarı yoksa sayfa çalışır; “Kontrol et” işlemi yapılandırma uyarısı verir.
