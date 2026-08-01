# V16 içerik araştırması ve özgünlük yaklaşımı

## İncelenen çerçeveler

V16 hazırlanırken aşağıdaki kaynak türleri yalnızca kapsam ve seviye kontrolü için kullanıldı:

- Avrupa Ortak Dil Referans Çerçevesi (CEFR/GER) ve Companion Volume'daki yapabilirim tanımları
- Goethe-Institut A1, A2 ve B1 kelime/iletişim alanı listeleri ile sınav hazırlık görev türleri
- VHS-Lernportal A1–B2 ders konu ve dil bilgisi ilerleme yapıları
- Kullanıcı tarafından yüklenen A1, A2, B1 ve B2 ders/çalışma materyalleri
- Deutschimo için daha önce belirlenen içerik kalitesi, mobil akış ve soru benzersizliği kuralları

## Telif ve özgünlük sınırı

Kaynaklardaki örnek metinler, diyaloglar, sorular, cevap anahtarları ve görsel düzenler öğrenci içeriğine aktarılmadı. Kaynaklar yalnızca şu soruları kontrol etmek için kullanıldı:

1. Bu konu ilgili seviyede yer almalı mı?
2. Öğrenci bu seviyede hangi iletişim görevini yapabilmeli?
3. Dil bilgisi ve kelime ilerlemesi önceki seviyenin üzerine doğru biçimde kuruluyor mu?
4. Okuma, dinleme, yazma ve konuşma görevleri seviyeye uygun uzunlukta mı?

V16 içindeki bütün öğrenci metinleri, diyaloglar, seçenekler ve geri bildirimler Deutschimo için özgün olarak üretildi.

## Kalite kontrolü

`scripts/validate-v16.mjs` şu kontrolleri otomatik yapar:

- 66 ünitenin eksiksiz bulunması
- Seviye başına doğru ünite sayısı
- Her ünitede en az 10 kelime ve 6 örnek
- Her içerik paketinde diyalog, okuma, dinleme, yazma, konuşma ve gerçek yaşam görevi
- Bütün soru kimliklerinin benzersizliği
- Doğru cevabın seçeneklerde bulunması
- Metinlerin birebir tekrar etmemesi
- Öğrenci içeriklerinde kaynak kitap adlarının görünmemesi
