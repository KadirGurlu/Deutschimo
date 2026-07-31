# Deutschimo V12 — Öğrenme Zekâsı

V12, V11'in gerçek kullanıcı ve PostgreSQL altyapısını koruyarak her öğrenciye kişiselleştirilmiş öğrenme yönlendirmesi ekler.

## Seviye belirleme sınavı

- A1, A2, B1 ve B2 için toplam 24 özgün soru
- Gramer, kelime, okuma ve günlük iletişim ölçümü
- Soruların tek tek gösterildiği odaklı sınav ekranı
- Seviye bazlı başarı yüzdeleri
- Güçlü ve zayıf alan özeti
- Önerilen seviyenin kullanıcı profiline otomatik kaydedilmesi
- Sonucun PostgreSQL'de geçmiş olarak saklanması

## Zayıf konu tespiti

- Son alıştırma cevaplarının analiz edilmesi
- Quiz skorlarının analize katılması
- Ünite ve beceri bazlı doğruluk oranları
- Kritik, yüksek ve orta öncelikli gelişim alanları
- Veri miktarına göre analiz güveni
- İlgili ders notuna doğrudan dönüş bağlantısı
- Güçlü kazanımların ayrıca gösterilmesi

## Akıllı tekrar

- Son yanlış cevaplardan otomatik tekrar kuyruğu
- Çoktan seçmeli, doğru-yanlış, boşluk doldurma ve çeviri tekrarları
- Soruya özel açıklama ve ikinci yanlışta doğru cevap gösterimi
- Desteklenmeyen soru türlerinde hedefli konu tekrarı
- Tamamlanan tekrarların kullanıcı hesabında saklanması
- İstenildiğinde kuyruğun güncel öğrenme verilerine göre yenilenmesi

## Günlük kişiselleştirilmiş plan

- Kullanıcının günlük dakika hedefine göre otomatik görev dağılımı
- Kaldığı derse devam görevi
- Zayıf konu ve yanlış cevaplara göre akıllı tekrar görevi
- Seviyeye göre quiz, kelime veya yazma görevi
- Tamamlanan görevlerin ve dakikaların kaydedilmesi
- Planın istenildiğinde yeniden oluşturulabilmesi

## Dashboard entegrasyonu

- Seviye testi sonucu
- Birincil zayıf konu
- Akıllı tekrar kuyruğu
- Günlük plan ilerlemesi

tek bir “Kişisel öğrenme merkezi” kartında gösterilir.

## Yeni rotalar

```text
/placement-test
/weak-topics
/smart-review
/study-plan
```

## Yeni API rotaları

```text
/api/intelligence/placement
/api/intelligence/insights
/api/intelligence/review
/api/intelligence/daily-plan
/api/intelligence/overview
```
