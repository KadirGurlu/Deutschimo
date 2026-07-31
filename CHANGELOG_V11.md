# Deutschimo V11 — Gerçek kullanıcı ve veritabanı altyapısı

## Eklenenler

- Auth.js ile e-posta/şifre oturumu
- İsteğe bağlı Google OAuth
- bcrypt ile parola hashleme
- PostgreSQL + Prisma ORM
- Gerçek kullanıcı kayıt API'si
- Şifre sıfırlama altyapısı
- İsteğe bağlı e-posta doğrulama
- Rol bazlı erişim: öğrenci, eğitmen, editör, moderatör, yönetici, süper yönetici
- Admin panelinde gerçek PostgreSQL kullanıcı listesi
- Kullanıcı askıya alma, rol/seviye güncelleme ve silme
- Öğrenme ilerlemesinin kullanıcı hesabına göre sunucuya senkronizasyonu
- Farklı cihazlarda kaldığın yerden devam etme
- Çevrimdışı durumda localStorage yedeği ve bağlantı geldiğinde senkronizasyon
- Gerçek profil bilgileri ve günlük hedef güncelleme
- Vercel build sırasında Prisma şemasını oluşturma ve ilk admin hesabını seed etme

## Korunan sistemler

- V10 A1–B2 içerikleri
- 66 ünite ve slayt tabanlı ders sistemi
- Alıştırma ve quiz motoru
- İçerik yönetim ekranı
- Ünite kilitleri ve ilerleme hesapları
- Responsive tasarım

## Veri geçişi

V10'daki eski öğrenme verileri, kullanıcı ilk kez gerçek hesabıyla giriş yaptığında mümkünse yeni kullanıcıya özel V11 localStorage alanına taşınır ve sunucuya yüklenir. Yeni anahtar yapısı aynı cihazda farklı hesapların ilerlemesini birbirinden ayırır.
