# Deutschimo V35 — B1 Gold Standard İçerik Kalite Raporu

## Amaç
V35, V33 A1 ve V34 A2 ile kurulan Gold Standard içerik sistemini B1'in 18 ünitesine taşır. Bu sürüm yeni ürün özelliği eklemek yerine B1'in Almanca doğruluğu, CEFR seviye sınırı, pedagojik ilerlemesi, bağlantılı metin üretimi, özgünlüğü ve gerçek yaşam görev kalitesini yükseltir.

## Kaynak yöntemi
Kullanıcının sağladığı **Hueber Deutsch üben – Lesen & Schreiben B1** kaynağı B1'in günlük yaşam ve metin türü kapsamını denetlemek için kullanıldı. Kaynakta kişilerarası iletişim, konut, hobi, film/televizyon, eğitim, tüketim, seyahat, güncel haber ve farklı metin türleri gibi alanlar bulunur. Kaynağın cümle, metin, soru, görev veya cevapları Deutschimo'ya kopyalanmadı.

Deutschimo V27 kalite raporundaki 10 ölçüt V35'e taşındı: dil doğruluğu, seviye uygunluğu, Türkçe doğallık, öğretilmeyen yapının soruda kullanılmaması, cevap tutarlılığı, gereksiz tekrar, kelime-konu ilişkisi, artikel/fiil bağlamı, okuma-dinleme öğretim değeri ve şablon hissi. V27'de özellikle B1 5, 7, 11, 12 ve 18. ünitelerde gramer tablosu bütünlüğü sorunu görülmüştü; V35 tüm B1 tablolarında eşit satır sayısını zorunlu kılar.

CEFR B1 ve Goethe-Zertifikat B1, beceri sınırını doğrulamak için kullanıldı. B1 öğrencisi tanıdık iş/okul/boş zaman alanlarında standart dilin ana noktalarını anlayabilmeli, seyahatte çoğu durumla başa çıkabilmeli, tanıdık konularda bağlantılı metin üretebilmeli ve görüş/planları için kısa gerekçe sunabilmelidir. Goethe B1 okuma, dinleme, yazma ve konuşma modüllerini ayrı biçimde ölçer; yazma ve konuşmada görüş, resmî/gündelik iletişim, partnerle planlama ve kısa sunum önemlidir.

## B1 Gold Standard müfredatı
1. İlişkiler, Kişilik ve Sosyal İletişim
2. Konut, WG ve Ortak Yaşam
3. İş, Başvuru ve Mesleki Hedefler
4. Öğrenme, Diller ve Çalışma Stratejileri
5. Medya, Haberler ve Farklı Görüşler
6. Tüketim, Reklam ve Bilinçli Seçimler
7. Seyahat, Ulaşım ve Beklenmeyen Durumlar
8. Sağlık, Stres ve Yaşam Dengesi
9. Çevre, İklim ve Sürdürülebilir Yaşam
10. Toplum, Gönüllülük ve Katılım
11. Kültür, Film ve Eleştiri
12. Kurallar, Haklar ve Sorumluluklar
13. Teknoloji, Dijitalleşme ve Gelecek
14. Para, Bütçe ve Tüketici Kararları
15. Güncel Olaylar, Haber Aktarma ve Zaman Sırası
16. Planlar, Hedefler ve Amaç Bildirme
17. Resmî İletişim, Talep ve Şikâyet
18. B1 Genel Uygulama ve Bağımsız İletişim


## Gramer ilerlemesi
Relativsatz Nom/Akk/Dat → Adjektivdeklination → zu + Infinitiv / um ... zu → indem / dadurch, dass → obwohl / trotzdem / während → zweiteilige Konnektoren → bevor / nachdem / während / seitdem → Konjunktiv II → Passiv Präsens/Präteritum → Relativsätze mit Präpositionen → je ... desto/umso → Modalpassiv → Futur I → Genitiv + wegen/trotz → Plusquamperfekt → damit / um...zu / ohne...zu / statt...zu → Verben mit Präpositionen + wo(r)/da(r) → B1 sentezi.

## Her ünitenin sabit kalite yapısı
- 4 ölçülebilir kazanım
- Türkçe destekli, konuya özgü B1 gramer açıklaması
- eşit satırlı gramer tablosu
- en az 18 kelime/kalıp
- en az 6 özgün çift dilli örnek
- mini kontrol + boşluk + sıralama + çeviri + diyalog + doğru/yanlış + çoklu seçim
- en az 8 turluk özgün diyalog
- özgün B1 okuma ve dinleme metni
- 4 okuma + 4 dinleme sorusu
- B1 hedef bandıyla uyumlu bağlantılı yazma görevi
- kısa sunum/partnerle konuşma görevi
- gerçek yaşam transfer görevi

## B1'in A2'den bilinçli farkı
B1 yalnızca daha zor gramer değildir. Öğrenciden ana fikir ve önemli ayrıntıyı ayırması, görüşünü gerekçe ve örnekle desteklemesi, karşı görüş veya alternatif bakış açısını anlayabilmesi, paragraf akışı oluşturması, resmî ve gündelik üslup arasında seçim yapması ve kısa sunum/partnerle planlama yapması beklenir.

## Özgünlük ve kalite kapısı
V35 validator, Hueber kaynağındaki tanınabilir bölüm başlıklarını V35 veri dosyalarında yasaklar; temel Almanca örneklerde birebir tekrar tarar; doğru cevapların seçeneklerde bulunmasını, çeviri kabul listelerini, 18 kelime/kalıp eşiğini, B1 okuma/dinleme uzunluklarını ve soru açıklamalarını doğrular. Bu teknik kontrol telif açısından hukuki görüş değildir.

## Teknik etki
- Prisma migration yoktur.
- Kullanıcı ve ilerleme verileri değiştirilmez.
- V33 A1 ve V34 A2 Gold Standard overlay'leri korunur.
- V35 yalnız B1 içeriğini overlay olarak yeniler.
- B2 mevcut içerikte kalır; ileriki içerik sürümünde ayrıca ele alınabilir.
- `npm run validate:v35` yeni yayın kapısıdır.

## Yayın öncesi sınır
Otomatik ve editoryal kontroller kaliteyi yükseltir ancak dil içeriği için mutlak kusursuzluk garanti edilemez. Geniş veya ücretli yayın öncesinde bağımsız bir Almanca öğretmeni/ana dil düzeyinde editör ve gerçek B1 öğrencileriyle pilot test önerilir.
