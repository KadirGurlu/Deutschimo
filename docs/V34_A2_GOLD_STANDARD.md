# Deutschimo V34 — A2 Gold Standard İçerik Kalite Raporu

## 1. Amaç
V34, V33'te A1 için oluşturulan Gold Standard yaklaşımını A2'nin 16 ünitesine uygular. Yeni ürün özelliği eklemek yerine A2'nin dil doğruluğu, CEFR sınırı, pedagojik sıra, özgünlük, görev değeri, Türkçe açıklama ve gerçek yaşam transferi yükseltilir.

## 2. Kaynak yöntemi
Kaynak materyaller metin kopyalamak için kullanılmadı. Konu kapsamı, görev türleri ve A2 dil yapılarının seviye sınırı karşılaştırıldı.

Referans grupları:
- Kullanıcı tarafından sağlanan Menschen A2 materyalleri: aile/biyografi, Wechselpräpositionen, doğa-tercih, alışveriş ve anlatı gibi kapsam sinyalleri.
- Kullanıcı tarafından sağlanan Netzwerk neu A2 materyalleri: Perfekt, weil/dass, modal Präteritum, dijital yaşam, ulaşım/dolaylı sorular, spor-sağlık, komşuluk, hizmetler ve A2 görev çeşitliliği.
- Goethe-Zertifikat A2: Hören, Lesen, Schreiben ve Sprechen beceri alanları ile günlük/rutin iletişim kapsamı.
- Council of Europe CEFR A2: tanıdık ve rutin alanlarda doğrudan bilgi alışverişi, yakın çevre ve temel ihtiyaçları anlatma sınırı.
- Deutschimo V27 içerik kalite raporu: şablonlaşma, tekrar, cevap tutarlılığı, kelime bağlamı ve editoryal kalite kriterleri.

Kaynaklardaki cümle, diyalog, okuma, dinleme ve alıştırmalar V34'e kopyalanmadı; V34 içerikleri Deutschimo için yeniden yazıldı.

## 3. V34 A2 ünite sırası
1. Geçmiş, Biyografi ve Anılar
2. Ev Düzeni ve Yer Değiştirme
3. Tatil, Doğa ve Tercihler
4. Alışveriş, Miktarlar ve Ürün Özellikleri
5. Dijital Yaşam, Medya ve Görüşler
6. Okul, Eğitim ve Geçmiş Kurallar
7. İş Hayatı, Rutinler ve Ekip İletişimi
8. Ulaşım, Yolculuk ve Dolaylı Sorular
9. Spor, Sağlık ve Alışkanlıklar
10. Komşuluk ve Birlikte Yaşam
11. Hizmetler, Tamir ve Nesne Zamirleri
12. Kutlamalar, Gelenekler ve Zaman
13. Teknoloji, Karşılaştırma ve Avantajlar
14. Sorunlar, Şikâyetler ve Tavsiyeler
15. Başvuru, Randevu ve Resmî İşlemler
16. A2 Genel Uygulama ve Gerçek Yaşam

## 4. Her ünitenin Gold Standard yapısı
Her A2 ünitesi şu sabit pedagojik omurgayı taşır:
- 4 ölçülebilir kazanım
- Türkçe, konuya özgü gramer açıklaması
- tutarlı gramer tablosu
- en az 16 kelime/kalıp
- en az 6 özgün çift dilli örnek
- mini kontrol
- boşluk doldurma
- cümle sıralama
- çeviri
- diyalog seçimi
- doğru/yanlış
- çoklu seçim
- özgün altı turluk diyalog
- özgün A2 okuma metni + Türkçe destek
- özgün A2 dinleme metni + Türkçe destek
- 3 içerik-spesifik okuma sorusu
- 3 içerik-spesifik dinleme sorusu
- A2 düzeyine uygun yazma görevi
- konuşma görevi
- gerçek yaşam görevi

## 5. Gramer ilerlemesi
Perfekt + war/hatte → Wechselpräpositionen → würde/tercih/karşılaştırma → temel sıfat çekimi → weil/dass → modal Präteritum → wenn + reflexive fiiller → dolaylı sorular → deshalb/trotzdem → temel Relativsatz → Dativ/Akkusativ zamirleri → als/wenn → karşılaştırma + dass → könnte/sollte/würde → edatlı fiiller → A2 sentezi.

## 6. Sayısal kapsam
- 16 A2 ünitesi
- 64 ölçülebilir kazanım
- 256 kelime/kalıp
- 96 çift dilli temel örnek
- 16 özgün diyalog
- 16 özgün okuma
- 16 özgün dinleme
- 48 okuma sorusu
- 48 dinleme sorusu
- 16 yazma görevi
- 16 konuşma görevi
- 16 gerçek yaşam görevi

## 7. Kalite kapıları
`validate:v34` şu alanları build'den önce kontrol eder:
- tam 16 A2 kimliği
- hedef, açıklama, tablo ve söz varlığı asgarileri
- gramer tablosu sütun bütünlüğü
- cevap-seçenek tutarlılığı
- kabul edilen çeviri/boşluk cevapları
- temel örneklerde birebir tekrar
- okuma/dinleme uzunluğu ve soru sayıları
- bütün anlama sorularında doğru cevabın seçenekler içinde olması
- A1 V33 + A2 V34 overlay bütünlüğü
- A2 zengin içerik bağlantısı
- kaynak eserlerin tanınabilir bazı ders başlıklarının V34 veri katmanında bulunmaması

## 8. Özgünlük ve telif güvenliği
Validator, bazı tanınabilir kaynak ders başlıklarını V34 veri dosyalarında yasaklar ve temel Almanca örneklerde birebir tekrar taraması yapar. Bu, belirgin kopyala-yapıştır riskini azaltır; hukuki telif görüşü veya tüm dış kaynaklara karşı küresel benzerlik garantisi değildir.

## 9. Teknik etki
- Yeni Prisma migration yoktur.
- Kullanıcı, ilerleme ve geçmiş verileri değiştirilmez.
- V33 A1 Gold Standard korunur.
- V34 yalnızca A2 içerik katmanını overlay olarak yeniler.
- V33 kalite kapısı V34 sürümünde de geriye dönük olarak çalışır.

## 10. Yayın notu
Dil içeriğinde mutlak kusursuzluk garanti edilemez. V34 otomatik ve editoryal kalite standardını belirgin biçimde yükseltir. Geniş ücretli yayından önce bağımsız Almanca öğretmeni/ana dil düzeyinde editör kontrolü ve gerçek A2 öğrencileriyle pilot kullanım ek güvence sağlar.
