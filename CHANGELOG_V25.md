# Deutschimo V25 — Kişisel giriş sayfası ve akıllı yönlendirme

## Amaç

Herkese açık ana sayfa yalnızca ziyaretçiler ve oturum açmamış kullanıcılar için gösterilir. Giriş yapmış öğrenciler Deutschimo logosuna veya kök adrese gittiğinde kişisel Öğrenci Paneline ulaşır.

## Yapılan değişiklikler

- `/` rotası oturum bilgisini sunucu tarafında kontrol eder.
- Oturum açmış kullanıcı `/dashboard` adresine yönlendirilir.
- Deutschimo logosunun hedefi oturum durumuna göre değişir:
  - ziyaretçi: `/`
  - öğrenci: `/dashboard`
- Mobil alt navigasyon yalnızca giriş yapan kullanıcılara gösterilir ve ilk sekme Öğrenci Paneline gider.
- Öğrenci Paneli en son güncellenen öğrenme konumundan aktif kursu belirler.
- Aktif kurs bulunamazsa kullanıcının profilindeki mevcut seviye kullanılır.
- “Kaldığın yerden devam et” kartı üst bölüme taşındı.
- Üst istatistikler kişisel verilerden hesaplanır:
  - devam edilen kurs,
  - gerçek çalışma serisi,
  - seçili kurs ilerlemesi,
  - günlük çalışma hedefi.
- Sabit `6 gün` seri değeri kaldırıldı.
- Çalışma serisi; ders etkinlikleri, çalışma oturumları ve güncellenen öğrenme konumlarından hesaplanır.
- Mevcut ve kişisel en uzun seri ayrı gösterilir.

## Veri güvenliği

- Prisma şeması değişmedi.
- Kullanıcılar, kurs ilerlemeleri, kelime setleri ve hata kayıtları korunur.
- Yeni environment variable gerekmez.
- Ayrı bir veritabanı komutu çalıştırılmaz.
