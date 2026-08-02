# Deutschimo V23 — Öğrenci Paneli ve Kişisel Akıllı Tekrar

## Sol menü

- `Dashboard` adı `Öğrenci Paneli` olarak değiştirildi.
- Aşağıdaki bağımsız menü öğeleri kaldırıldı:
  - Kurslarım
  - Zayıf Konular
  - Yetkinlik Haritası
  - Hata Geçmişi
  - Sınavlar
- Korunan menü akışı:
  - Öğrenci Paneli
  - Seviye Testi
  - Akıllı Tekrar
  - Günlük Plan
  - Beceri Laboratuvarı
  - Kelime Setlerim
  - İlerleme
  - Profil
  - Ayarlar

Kurs içerikleri silinmedi. Öğrenci, Öğrenci Paneli'ndeki `Derse Devam Et` kartı ve ünite bağlantıları üzerinden derslerine erişmeye devam eder.

## Kişisel Akıllı Tekrar

Akıllı tekrar kuyruğu artık her kullanıcı için üç veri kaynağını birleştirir:

1. Çözülmemiş hata geçmişi kayıtları
2. Zayıf konu analizi
3. Öğrencinin son yanlış alıştırmaları

### Önceliklendirme

- Üç veya daha fazla kez tekrarlanan hatalar `Öncelikli` olarak işaretlenir.
- İki kez tekrarlanan hatalar `Yüksek öncelik` alır.
- Tekil açık hatalar ve orta düzey zayıf konular `Tekrar edilmeli` olarak gösterilir.
- Kuyruk en fazla 12 kişisel çalışma öğesi içerir.
- Aynı soru veya aynı konu gereksiz biçimde tekrarlanmaz.

### Hata geçmişi bağlantısı

- Öğrenci hata geçmişinden gelen soruyu doğru tamamlarsa açık hata kaydı çözülür.
- Aynı soruyu akıllı tekrarda yeniden yanlış yaparsa hata sayısı ve son hata tarihi güncellenir.
- Yeni hata veya yeni öğrenme verisi oluştuğunda kuyruk en geç 30 dakika içinde otomatik yenilenir.
- `Listeyi Yenile` kullanıldığında kuyruk anında yeniden hesaplanır.

## Öğrenci Paneli

- Bağımsız `Yetkinlik Haritası` kartı kaldırıldı.
- Öğrenme merkezi üç temel karta sadeleştirildi:
  - Seviye belirleme
  - Kişisel Akıllı Tekrar
  - Bugünkü plan
- Zayıf konu bilgisi ayrı sayfaya yönlendirmek yerine Akıllı Tekrar kartında kullanılır.

## Eski bağlantılar

Eski yer imlerinin boşa düşmemesi için:

- `/weak-topics` → `/smart-review`
- `/competency` → `/smart-review`
- `/mistakes` → `/smart-review`
- `/exams` → `/dashboard`

## Veri güvenliği

- Veritabanı şeması değiştirilmedi.
- Mevcut kullanıcılar silinmez.
- Kurs ilerlemeleri, kelime setleri, hata kayıtları ve yetkinlik verileri korunur.
- Yeni Vercel Environment Variable gerekmez.
