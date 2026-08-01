# Deutschimo V14 — Gelişmiş Kelime Öğrenme Sistemi

V14, V13'teki kişisel kelime defterini tam bir aralıklı tekrar sistemine dönüştürür. V11–V13 kullanıcı, ilerleme, güvenlik, öğrenme zekâsı ve beceri laboratuvarı verileri korunur.

## Yeni öğrenme akışı

- Her kelime için kişisel tekrar tarihi ve ustalık puanı
- Dört öz değerlendirme seçeneği: **Unuttum, Zor, İyi, Çok kolay**
- Cevaba göre 10 dakika ile uzun gün aralıkları arasında otomatik planlama
- Unutma sayısı, doğru seri, toplam tekrar ve son değerlendirme kaydı
- Bugün bekleyen kelimeler için tek kartlık odaklı çalışma akışı

## Yedi tekrar türü

1. Almanca → Türkçe
2. Türkçe → Almanca
3. Ses → Kelime
4. Boşluk doldurma
5. Artikel seçme
6. Çoğul biçimini yazma
7. Kelimeyi cümle içinde kullanma

Sistem, kelimenin sahip olduğu bilgilere göre kullanılabilir görev türlerini otomatik belirler. Örneğin artikel bilgisi olmayan bir kelime artikel sorusuna girmez.

## Genişletilmiş kelime kaydı

Her kayıtta aşağıdaki alanlar desteklenir:

- Artikel ve çoğul
- Türkçe anlam
- Telaffuz notu ve tarayıcıdan Almanca seslendirme
- Kelime türü
- Almanca örnek cümle ve Türkçe çeviri
- Fiil çekimi: ich, du, er/sie/es, wir, ihr, sie/Sie
- Perfekt biçimi
- Kullanıldığı edat veya yapı
- Kaynak kurs/ünite
- Öğrenci notu
- Ustalık, tekrar aralığı ve hata geçmişi

Dinleme ve okuma laboratuvarlarından eklenen kelimeler kaynak görev başlığıyla otomatik etiketlenir. Eksik alanlar kelime defterinden düzenlenebilir.

## Yeni veritabanı yapısı

`VocabularyNotebookItem` modeline aralıklı tekrar ve ayrıntılı kelime alanları eklendi. Yeni model:

- `VocabularyReviewAttempt`

Bu tablo her tekrarın görev türünü, değerlendirmesini, doğruluk durumunu, cevabını ve yanıt süresini saklar.

## Dashboard ve yedekleme

- Dashboard'a bekleyen tekrar, toplam kelime ve ustalık özeti eklendi.
- Hesap verisi dışa aktarımına tekrar geçmişi dahil edildi.
- Şifreli günlük veritabanı yedeğine `VocabularyReviewAttempt` tablosu eklendi.
- Yedek şema sürümü `14.0` olarak güncellendi.

## Veri güvenliği

- Mevcut kullanıcılar ve kelime kayıtları silinmez.
- Yeni alanlar güvenli varsayılan değerlerle eklenir.
- Yeni ortam değişkeni gerekmez.
- V12.1 güvenlik ve Blob yedekleme altyapısı korunur.
