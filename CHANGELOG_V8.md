# Deutschimo V8 — Kapsamlı ders içeriği ve sade navigasyon

## Ana sayfa ve navigasyon

- Ana navigasyondaki arama kutusu tamamen kaldırıldı.
- Menü boşluğu responsive biçimde yeniden dağıtıldı.
- `Ücretsiz Başla` ve hero alanındaki eski ücretsiz başlangıç metinleri `Kayıt Ol` olarak değiştirildi.
- Kayıt CTA'ları `/auth` sayfasına bağlandı.

## 15 slaytlı öğrenme yapısı

Bütün A1, A2, B1 ve B2 üniteleri aynı kapsamlı öğretim yapısına geçirildi:

- konu tanımı, günlük kullanım ve ön bilgiler
- artikel, çoğul, anlam, örnek ve telaffuz içeren kelime öğretimi
- ayrıntılı gramer tanımı, işlevi ve cümle sırası
- olumlu, olumsuz, evet-hayır ve W-soruları
- fiil çekimi
- tekil/çoğul ve resmî/samimi hitap
- Almanca-Türkçe örnekler
- günlük yaşam diyaloğu
- okuma ve dinleme metni
- yazma, konuşma ve telaffuz görevleri
- yanlış/doğru kullanım karşılaştırması
- kapsamlı özet
- dokuz soruluk bağımsız konu sonu kontrolü

## Kelime ve çeviri sistemi

- Kelime türünü temsil etmeyen `.`, `v`, `i` gibi rozetler kaldırıldı.
- İsimler doğrudan `der Name – die Namen` formatında gösteriliyor.
- Fiiller ve diğer sözcüklerde gereksiz artikel veya sembol kullanılmıyor.
- Her kelimede örnek Almanca cümle ve doğal Türkçe çeviri bulunuyor.
- Okuma, dinleme, diyalog ve kullanışlı ifadelerde Almanca-Türkçe eşleşmesi görünür durumda.
- Tarayıcı Web Speech API destekliyorsa Almanca telaffuz dinlenebiliyor.

## Soru ve geri bildirim sistemi

- Her ünitede 9 soruluk konu sonu kontrolü eklendi.
- Konu sonu soruları ana alıştırmalardan ve quizden farklı kimliklere ve bağlamlara sahip.
- Seçilen yanlış cevap mini kontrolün kendi geri bildirim kaydıyla eşleştiriliyor.
- Konu sonu kontrolünde yanlış cevap sonrası seçilen yanıt, doğru yanıt ve soru açıklaması birlikte gösteriliyor.
- Eski V7 yanıtlarının yeni sorulara karışmaması için soru ve storage sürümleri V8'e yükseltildi.

## Teknik yapı

- Yeni zengin içerik tipleri: `RichVocabularyItem`, `BilingualLine`, `DialogueTurn`, `CommonMistake`, `PracticeQuestion`
- Yeni bloklar: `bilingual_examples`, `dialogue`, `reading_text`, `listening_text`, `task_card`, `mistake_list`, `practice_set`
- Yeni içerik üretim katmanı: `lib/learning/content-enrichment.ts`
- Slayt sayısı ünite başına 15'e çıkarıldı.
