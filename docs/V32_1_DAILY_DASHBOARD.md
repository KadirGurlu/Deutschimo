# Deutschimo V32.1 — Gün Odaklı Öğrenci Paneli

V32.1, V32.0 akıllı onboarding verilerini öğrencinin günlük çalışma deneyimine bağlar.

## Ana davranışlar

- Dashboard başlığı `Guten Tag, <ad>` ve günlük dakika hedefini gösterir.
- `Bugünkü Planın` kartı `/api/intelligence/daily-plan` üzerinden kalıcı günlük planı getirir.
- Günlük plan ders + tekrar + kişisel odak çalışmasını süre bütçesine göre seçer.
- 10–15 dakikalık hedeflerde tek ana görev, 16–25 dakikada iki görev, 26–44 dakikada üç görev, 45+ dakikada dört görev üretilir.
- Planlanan toplam dakika kullanıcının günlük hedefini aşmaz; V32.1 planlarında toplam doğrudan hedef dakikaya eşittir.
- V32.0'da seviyesini kendisi seçmiş ve onboarding'i tamamlamış kullanıcıya gereksiz seviye testi görevi çıkarılmaz.
- Onboarding `focusSkills` seçimi günlük destek görevini etkiler.
- `Kaldığın yerden devam et` kartı mevcut kurs/ünite ilerlemesi ve son çalışma zamanını gösterir.
- Streak/seri ana motivasyon metriği kaldırılmıştır. Bunun yerine haftalık sürdürülebilir çalışma günü hedefi gösterilir.
- V32.0 E2E testi yeni `Guten Tag` dashboard başlığıyla uyumlu hale getirilmiştir.

## Veritabanı

Yeni Prisma modeli veya migration yoktur. V32.1 mevcut `DailyStudyPlan`, `LearnerOnboardingProfile`, `LearningStateSnapshot` ve ilerleme modellerini kullanır.

## Kalite kapısı

`npm run validate:v32.1` gün odaklı dashboard bileşenlerini, V32.1 günlük plan motorunu, eski V32 validator uyumluluğunu ve E2E/CI dosyalarını kontrol eder.
