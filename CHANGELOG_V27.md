# Deutschimo V27 - İçerik Kalite Güvencesi

V27, yeni özellik eklemek yerine A1-B2 içeriklerinin doğruluğu, özgünlüğü, seviye uygunluğu ve öğretim değeri üzerine odaklanır.

## Yapılan ana çalışmalar

- 66 ünitenin temel ders içeriği, alıştırma cevapları ve dil bilgisi tabloları sistematik olarak tarandı.
- Her ünitedeki yapay ve tekrarlı beşinci öğrenme hedefi kaldırıldı; hedefler dört açık kazanıma indirildi.
- Ünite başına altı temel örnekten, öğretim değeri düşük iki şablon örnek çıkarıldı; dört bağlama uygun örnek bırakıldı.
- 13 ünitedeki eksik dil bilgisi tablosu satırları tamamlandı.
- A1 düzeyindeki örnekler, sorular, diyaloglar ve Türkçe karşılıklar manuel olarak gözden geçirildi.
- A2-B2 içerikleri tekrar, şablon, cevap tutarlılığı, kelime-bağlam ilişkisi ve tablo bütünlüğü bakımından denetlendi; son ana dili düzeyindeki editör kontrolü için durumları "Editör kontrolünde" olarak işaretlendi.
- V16 okuma, dinleme ve diyalog bankası yeniden yazıldı. Aynı diyalog satırlarının ve aynı anlama sorularının farklı ünitelerde aynen tekrarlanması kaldırıldı.
- 66 hazır kelime setindeki 2.250 kart tarandı. Üniteyle ilişkisiz, genel ve yapay şablon örnekler bağlama uygun örneklerle değiştirildi.
- Almanca alanlarda Türkçe karakter ve Türkçe ünite başlığı kalıntıları temizlendi.
- B2 düzeyindeki akademik ve profesyonel örnekler daha doğal, işlevsel ve konuya özgü hâle getirildi.
- Her ünite için kalite durumu, kontrol tarihi ve kontrol başlıklarını içeren kayıt eklendi.
- Admin içerik editöründe seçili ünitenin kalite durumu ve kontrol listesi görünür hâle getirildi.

## Kalite durumları

- A1: 12 ünite - Yayına hazır
- A2: 16 ünite - Editör kontrolünde
- B1: 18 ünite - Editör kontrolünde
- B2: 20 ünite - Editör kontrolünde

"Editör kontrolünde" durumu içeriğin hatalı olduğu anlamına gelmez. Otomatik ve sistematik kontroller tamamlanmıştır; ticari yayından önce bağımsız Almanca editörünün son okuması önerilir.

## Otomatik doğrulama

Yeni `npm run validate:v27` komutu şunları denetler:

- ünite ve kalite kaydı sayıları,
- öğrenme hedefi ve örnek sayıları,
- dil bilgisi tablosu bütünlüğü,
- Almanca alanlarda Türkçe karakter kalıntıları,
- eski şablon ifadeler,
- cevap-seçenek tutarlılığı,
- aynı diyalog ve anlama sorularının tekrarları,
- seviyeye göre örnek cümle uzunluğu,
- kelime seti kart sayısı ve alan bütünlüğü,
- kelime kartlarındaki aşırı tekrarlar,
- zorunlu kalite kontrol kayıtları.

## Veri güvenliği

Prisma şeması değiştirilmedi. Kullanıcılar, kurs ilerlemeleri, kelime setleri, akıllı tekrar kayıtları ve hata geçmişleri korunur. Yeni ortam değişkeni gerekmez.

Ayrıntılı inceleme için `docs/V27_CONTENT_QUALITY_REPORT.md` dosyasına bakın.
