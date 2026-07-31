# Deutschimo V7 — Özgün soru bankası ve açıklama sistemi

## Düzeltilen ana sorunlar

- Ders slaydındaki mini kontrol sorusu artık normal alıştırmalarda veya ünite testinde tekrar kullanılmıyor.
- Her ünitede üç ayrı soru katmanı bulunuyor:
  1. Slayt içi mini kontrol
  2. On bağımsız alıştırma
  3. Yedi bağımsız ünite testi sorusu
- Her normal alıştırmanın kendine ait, doğru cevabı ve ilgili dil kuralını açıklayan geri bildirim metni var.
- Çoklu seçim sorusunda yanlış cevap verildiğinde artık ilk sorunun açıklaması gösterilmiyor.
- Ünite testi bittikten sonra her soru için kullanıcının yanıtı, doğru yanıt ve o soruya özel açıklama gösteriliyor.
- V7 soru ve quiz kimlikleri yenilendi; eski tarayıcı kayıtlarının yeni soruları tamamlanmış göstermesi engellendi.

## İçerik tasarımı

Soru akışı, kaynakların genel öğretim yaklaşımından yararlanılarak üç eksende düzenlendi:

- Wörter: kelime ve ifade bilgisi
- Strukturen: dil bilgisi ve cümle yapısı
- Kommunikation: bağlama uygun anlama ve üretim

Kaynak kitaplardaki metin ve sorular birebir kopyalanmadı. Ünite kazanımlarına göre Deutschimo için yeni soru metinleri, seçenekler ve açıklamalar türetildi.

## Teknik değişiklikler

- `data/exercises.ts`: bağımsız alıştırma ve quiz üreticisi
- `types/exercise.ts`: quiz sorularına `explanation` alanı
- `components/exercises/quiz-result.tsx`: soru bazlı sonuç inceleme
- `components/exercises/exercise-feedback.tsx`: “Neden?” açıklaması
- `lib/storage/learning-storage.ts`: V7 storage anahtarları
- `scripts/validate-content.mjs`: temel içerik doğrulama
- `app/globals.css`: quiz inceleme bileşenleri

## Doğrulama sonucu

- 66 ünite
- 660 normal alıştırma
- 462 ünite testi sorusu
- Slayt mini kontrolü + alıştırmalar + quizler arasında aynı ünite içinde yinelenen soru metni: 0
- Aynı ünite içinde yinelenen soru açıklaması: 0
