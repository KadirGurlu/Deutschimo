# Gerçek Kullanıcı ve İçerik Veritabanı

Bu pakette öğrenci ilerlemesi, kayıt formu ve admin içerik değişiklikleri hemen denenebilmesi için tarayıcı `localStorage` alanında çalışır. Bu nedenle aynı tarayıcıdaki kayıtlar admin panelinde görünür; farklı cihazlardaki gerçek kullanıcıların ortak listesi için PostgreSQL kurulmalıdır.

## Hazır veri modeli

`prisma/schema.prisma` aşağıdaki ana modelleri içerir:

- `User`: kullanıcı, rol, durum ve seviye bilgileri
- `Course`: A1-A2-B1-B2 kursları
- `Unit`: yazılı ders anlatımı ve ünite metadatası
- `Exercise`: çoktan seçmeli, boşluk doldurma, çeviri ve sıralama soruları
- `UnitProgress`: kullanıcı bazlı tamamlanan ünite ve puan

## Önerilen geçiş

1. Vercel Postgres, Neon veya Supabase üzerinde PostgreSQL veritabanı oluştur.
2. Vercel proje ayarlarına `DATABASE_URL` ve `AUTH_SECRET` ekle.
3. Prisma ve Auth.js paketlerini yükle.
4. `localStorage` fonksiyonlarını Server Action/API çağrılarıyla değiştir.
5. Admin kullanıcı ve içerik ekranlarını Prisma sorgularına bağla.

Bu geçişten sonra kayıt olan herkes, hangi cihazdan kayıt olursa olsun admin panelinde görünür; içerik değişiklikleri tüm öğrencilere ortak biçimde yansır.
