# Deutschimo V20 Doğrulama Raporu

## Kontrol edilen değişiklikler

- Header’dan Kurslar, Seviyeler ve Sınav Hazırlık bağlantıları kaldırıldı.
- Giriş Yap bağlantısı login moduna, Kayıt Ol bağlantısı register moduna yönlendirildi.
- Hero’daki ikinci buton kaldırıldı.
- A1–B2 seçimlerinin tamamı kayıt sayfasına bağlandı.
- Seçilen seviye kayıt formuna query parametresiyle aktarılıyor.
- Öğrenme yolu alt açıklaması kaldırıldı.
- Google ile devam et butonu, Auth.js provider ve doğrulanmış e-posta kontrolü eklendi.
- Şifre yardım metni güncel güvenlik politikasıyla eşleştirildi.
- V20’nin değiştirdiği TS/TSX dosyaları TypeScript transpile kontrolünden geçirildi.

## Veri etkisi

Prisma şeması değiştirilmedi. Kullanıcı, oturum, öğrenme ve ilerleme tablolarında silme veya yeniden oluşturma işlemi yoktur.

## Deployment ön koşulu

Google ile girişin canlıda çalışması için Vercel’de `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET` ve `NEXT_PUBLIC_GOOGLE_AUTH_ENABLED=true` değerleri tanımlanmalı; Google Cloud istemcisinde production callback URI tam olarak eşleşmelidir.
