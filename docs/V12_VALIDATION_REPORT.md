# Deutschimo V12 Doğrulama Raporu

## Kapsam

- Seviye belirleme sınavı
- Zayıf konu analizi
- Akıllı tekrar
- Günlük kişiselleştirilmiş plan
- Dashboard entegrasyonu
- PostgreSQL veri modelleri

## Veri kontrolleri

- 24 seviye belirleme sorusu
- A1, A2, B1 ve B2 seviyelerinin her birinde 6 soru
- Dört beceri alanı: gramer, kelime, okuma ve iletişim
- Her soruda benzersiz kimlik, doğru cevap ve açıklama

## Güvenlik ve veri bütünlüğü

- Bütün V12 API rotaları oturum kontrolü kullanır.
- Seviye testi cevap anahtarı istemciye gönderilmez.
- Akıllı tekrar doğru cevabı ilk GET yanıtında istemciye göndermez.
- Kullanıcı verileri userId üzerinden birbirinden ayrılır.
- Günlük plan için kullanıcı + tarih benzersizlik kuralı vardır.

## Uyum

- V11 Auth.js, Prisma ve PostgreSQL altyapısı korunmuştur.
- Yeni ortam değişkeni gerekmemektedir.
- Mevcut A1–B2 ders, alıştırma ve quiz verileri değiştirilmemiştir.
- LearningStateSnapshot sürümü 12 olarak güncellenmiştir.
