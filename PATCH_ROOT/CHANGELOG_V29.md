# Deutschimo V29 — Yazma Koçu

## Ana hedef

Türkçe konuşan öğrencilerin A1–B2 düzeylerinde Almanca metin üretmesini, hatalarını anlayarak kendi metnini yeniden yazmasını ve tekrar eden hata örüntülerinin günlük çalışma planına aktarılmasını sağlamak.

## Yeni ürün alanı

- Ana menüde **Kurslar** bölümünün hemen altına **Yazma Koçu** eklendi.
- Yeni sayfa: `/writing-coach`
- A1, A2, B1 ve B2 için ayrı seviye seçimi.
- Her seviyede 6, toplam 24 özgün yazma senaryosu.
- Senaryo bazlı görev maddeleri, yararlı ifadeler ve hedef kelime sayısı.
- Taslakların tarayıcıda otomatik korunması.

## Üç aşamalı AI koçluğu

AI öğrenciye düzeltilmiş metni veya model cevabı doğrudan vermez:

1. Öğrenci metnindeki sorunlu bölüm birebir alıntıyla işaretlenir.
2. Hata türü ve ilgili Almanca kural Türkçe açıklanır.
3. İpucu ve yönlendirici soru verilerek öğrenciden yeniden yazması istenir.

Structured Output şeması, düzeltilmiş metin veya model cevap alanı içermez. AI tarafından döndürülen alıntıların öğrenci metninde gerçekten bulunup bulunmadığı sunucuda doğrulanır. Doğrudan cevap sızıntısını gösteren belirgin kalıplar ikinci bir güvenlik katmanıyla temizlenir.

## Değerlendirme rubriği

Her metin altı boyutta 0–100 arasında değerlendirilir:

- Görevi yerine getirme
- Gramer doğruluğu
- Kelime çeşitliliği
- Cümle bağlantıları
- Yazım ve noktalama
- Seviyeye uygunluk

Genel puan, altı boyutun sunucuda yeniden hesaplanan ortalamasıdır.

## Hata geçmişi ve kişiselleştirme

- Artikel, Dativ, Akkusativ, fiil konumu, fiil çekimi, zaman, edat, kelime seçimi, bağlaç, yazım, noktalama, register ve metin bütünlüğü gibi hata kategorileri ayrı ayrı takip edilir.
- Her hata kategorisinin tekrar sayısı, son örneği, son görülme tarihi ve bir sonraki tekrar tarihi saklanır.
- Yazma hataları mevcut `LearningErrorHistory` sistemine de aktarılır.
- Güncel ve ileri tarihli günlük planlar yenilenir; böylece yeni yazma hataları sonraki çalışma planına girebilir.
- Her yeniden kontrol ayrı bir revizyon olarak kaydedilir; öğrenci aynı metni geliştirerek tekrar değerlendirebilir.

## Veri modeli

Yeni tablolar:

- `WritingCoachSession`
- `WritingCoachAttempt`
- `WritingErrorProfile`

Migration yalnızca yeni tablo, indeks ve ilişkiler ekler. Mevcut kullanıcı, kurs, ilerleme, seviye testi ve akıllı tekrar verilerini silmez.

## AI ve güvenlik

- OpenAI anahtarı yalnızca sunucuda `OPENAI_API_KEY` olarak kullanılır.
- Tarayıcıya API anahtarı veya değerlendirme sistem talimatı gönderilmez.
- OpenAI Responses API ve strict JSON Schema kullanılır.
- Varsayılan model `gpt-5.4-mini`; `OPENAI_WRITING_MODEL` ile değiştirilebilir.
- API isteğinde kullanıcı adı, e-posta veya başka hesap bilgisi gönderilmez; yalnızca seviye, senaryo ve öğrenci metni gönderilir.
- OpenAI isteğinde `store: false` kullanılır.
- Kullanıcı başına 10 dakikada en fazla 12 değerlendirme sınırı vardır.
- Metinler 8.000 karakterle sınırlandırılır.
- Öğrenci metnindeki prompt-injection talimatlarının yok sayılması sistem talimatında zorunludur.

## Kümülatif içerik

Bu paket V28.4 Gerçek Seviye Testi dosyalarını ve V28.3 için daha önce hazırlanan kritik TypeScript/Prisma bağlantı düzeltmelerini de içerir. V28.4 henüz kurulmadıysa paket `v28-3-staging` üzerine uygulanabilir.
