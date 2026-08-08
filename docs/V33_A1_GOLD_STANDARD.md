# Deutschimo V33 — A1 Gold Standard İçerik Kalite Raporu

## Amaç
V33 yeni bir ürün modülü eklemek yerine A1 kursunu tek bir pedagojik ve dilsel kalite standardına taşır.

## Kaynak kullanım ilkesi
Kaynaklar içerik kopyalamak için değil; A1 konu kapsamını, CEFR sınırını, beceri dağılımını ve görev çeşitliliğini kontrol etmek için kullanılmıştır. Kaynak kitaplardaki cümleler, diyaloglar, okuma parçaları ve alıştırmalar Deutschimo'ya aktarılmamıştır.

İncelenen ana referanslar:
- Kullanıcı tarafından sağlanan Menschen A1.1 Kursbuch ve Arbeitsbuch.
- Kullanıcı tarafından sağlanan Menschen A1.2 Kursbuch ve Arbeitsbuch.
- Goethe-Zertifikat A1 yetişkin sınav beceri kapsamı ve Wortliste sayfası.
- Council of Europe CEFR A1 global scale ve A1 konuşma/etkileşim tanımlayıcıları.
- Deutschimo V27 içerik kalite raporu ve mevcut V32.1 A1 içerik katmanı.

## V33 Gold Standard
Her A1 ünitesi şu öğrenme döngüsünü karşılar:
1. Kazanım
2. Konu anlatımı
3. Özgün çift dilli örnek
4. Türkçe açıklama
5. Mini kontrol
6. Artikel/çoğul/bağlam odaklı kelime
7. Ana alıştırmalar
8. Gerçek yaşam uygulaması
9. Ders sonu test
10. Kişisel tekrar/üretim

Mevcut `slides.ts` 15 slaytlık yapısı korunmuş; V33 özgün A1 enrichment katmanındaki diyalog, okuma ve dinleme metinleri doğrudan A1 slaytlarına bağlanmıştır.

## Yeni A1 sıra
1. Tanışma, Selamlaşma ve Alfabe
2. Kişisel Bilgiler, Diller ve Meslek
3. Aile, İnsanlar ve Sahiplik
4. Eşyalar, Alışveriş ve Fiyatlar
5. Yeme İçme ve Sipariş
6. Günlük Rutin, Saat ve Randevular
7. Boş Zaman, Yetenekler ve Davetler
8. Şehirde Yön Bulma ve Ulaşım
9. Ev, Oda ve Yaşam Alanı
10. Sağlık, Vücut ve Basit Tavsiye
11. Giyim, Hava Durumu ve Alışveriş
12. Seyahat, Tatil ve A1 Genel Uygulama

## İçerik miktarı
- 12 yeniden yazılmış temel ünite
- 48 ölçülebilir kazanım
- 192+ temel kelime/kalıp
- 72 özgün çift dilli temel örnek
- 12 özgün günlük yaşam diyaloğu
- 12 özgün okuma metni + Türkçe karşılığı
- 12 özgün dinleme metni + Türkçe karşılığı
- 36 okuma ve 36 dinleme kontrol sorusu
- 12 özgün yazma görevi
- 12 özgün konuşma görevi
- 12 özgün gerçek yaşam görevi
- Ünite başına mevcut sistem tarafından üretilen ana alıştırmalar + ünite testi

## Kaldırılan / düzeltilen sorunlar
- Her ünitede tekrar eden genel gramer öğrenme şablonu Gold Standard verisinden çıkarıldı.
- A1 konu sırası, somut kişisel iletişimden günlük işlemlere ve basit geçmiş anlatımına doğru yeniden düzenlendi.
- Kelimeler daha çok artikel ve günlük kullanım bağlamıyla verildi.
- Örnek sayısı 4'ten en az 6'ya çıkarıldı.
- A1 okuma ve dinleme soruları yeniden etkinleştirildi; önceki A1 suppress davranışı kaldırıldı.
- Eski V16 A1 kültür notu/üretim görevleri V33 özgün enrichment katmanıyla değiştirildi.
- V32/V32.1 validator'larının gelecekteki sürümleri engellememesi için legacy sürüm kapıları semver tabanlı hâle getirildi.

## Özgünlük
V33 kaynak metinleri yeniden üretmez. Kaynak kitapların marka karakterleri, ders başlıkları ve örnek cümleleri Gold Standard verisine alınmamıştır. Validator ayrıca bazı bilinen kaynak cümlelerini/başlıklarını yasaklı ifade olarak kontrol eder ve temel Almanca örneklerde birebir tekrar taraması yapar.

## Sınır
Dil öğrenim içeriğinde “kusursuzluk” mutlak olarak garanti edilemez. V33, otomatik ve editoryal kalite kapısını yükseltir; geniş ticari yayından önce bağımsız ana dili Almanca olan öğretmen/editör ve gerçek A1 öğrencileriyle pilot test hâlâ önerilir.
