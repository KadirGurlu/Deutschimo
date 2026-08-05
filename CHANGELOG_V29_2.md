# Deutschimo V29.2 — Yazma Koçu 2.0

## Öğrenme akışı

- İlk metin → AI geri bildirimi → öğrenci revizyonu → ikinci değerlendirme → ilk/son karşılaştırması akışı eklendi.
- Öğrenci hatayı düzeltmeden “düzelttim” kontrolünü kendi işaretleyebiliyor.
- Her revizyon ayrı kaydediliyor; ilk, son ve önceki puan farkları hesaplanıyor.

## Geri bildirim arayüzü

- Hatalar cümle bağlamında gösteriliyor.
- Hata türleri gramer, kelime/üslup, bağlantı/görev ve yazım/noktalama renkleriyle ayrılıyor.
- İlk ve son metin yan yana karşılaştırılıyor.
- Altı rubrik boyutu için puan değişimi ayrı gösteriliyor.
- Revizyon geçmişi puan ve hata sayısıyla listeleniyor.

## Pedagojik öneriler

- Seviyeye uygun kısa kelime/kalıp önerileri eklendi.
- Bağlaç ve metin bağlantısı önerileri eklendi.
- AI tam model cümle, düzeltilmiş paragraf veya öğrencinin yerine yazılmış metin üretemiyor.
- “Bu metni benim için yaz” benzeri talepler API seviyesinde reddediliyor.

## Değerlendirme modları

- Deutschimo gelişim rubriği
- Goethe görevlerine yakın pratik rubriği
- telc görevlerine yakın pratik rubriği

Goethe ve telc modları resmî sınav puanı veya sertifika sonucu değildir; arayüzde bu ayrım açıkça belirtilir.

## Akıllı Tekrar bağlantısı

- Tekrarlanan veya yüksek öncelikli yazma hataları `AdaptiveReviewAttempt` kuyruğuna ekleniyor.
- Hatalar `CompetencyRecord` ustalık kayıtlarını güncelliyor.
- Revizyonda giderilen hata türleri çözülmüş olarak işaretleniyor.
- Günlük plan, yeni hata veya düzeltme sonrasında yeniden üretilebiliyor.

## Veritabanı

- `WritingCoachSession` içine rubrik modu ve ilk/son puan özetleri eklendi.
- `WritingCoachAttempt` içine revizyon bağlantısı, gelişim, hata karşılaştırması ve öneri alanları eklendi.
- Migration yalnızca yeni sütun ve indeks ekler; mevcut metinleri veya kullanıcı verilerini silmez.
