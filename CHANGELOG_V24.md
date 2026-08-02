# Deutschimo V24 — Altyapı, performans ve güvenlik

V24 yeni bir öğrenci özelliği eklemek yerine uygulamanın üretim altyapısını güçlendirir. Kullanıcılar, kurs ilerlemeleri, kelime setleri ve ölçme verileri korunur; Prisma şeması değiştirilmez.

## Dağıtım güvenliği

- Production build içinden `prisma db push` ve otomatik admin seed kaldırıldı.
- Build artık veritabanı şemasını kendiliğinden değiştirmez.
- Kritik ortam değişkenleri deployment başlamadan doğrulanır.
- Prisma seed ayarı `prisma.config.ts` dosyasına taşındı.
- Node.js çalışma sürümü `>=20.10 <23` olarak sabitlendi.

## Web ve tarayıcı güvenliği

- HSTS, CSP, Permissions-Policy ve ek güvenlik başlıkları eklendi.
- `X-Powered-By` başlığı kapatıldı.
- Production source map yayımlanması kapatıldı.
- Korumalı sayfalar `noindex`, `noarchive` ve `private/no-store` olarak işaretlendi.
- Özel API işlemlerine same-origin / CSRF kontrolü eklendi.
- Her isteğe izlenebilir `x-request-id` ekleniyor.

## Kimlik doğrulama

- Eksik korumalı rotalar tek merkezî listeye eklendi.
- İstemciden gelen `session.update()` verisinin rol ve yetki alanlarını değiştirebilmesi engellendi.
- Kullanıcının rolü ve hesap durumu belirli aralıklarla veritabanından güvenli biçimde yenileniyor.
- Şifre değişikliği ve şifre sıfırlama sonrasında eski JWT oturumları iptal ediliyor.
- Şifre işlemleri denetim geçmişine kaydediliyor.
- Tek kullanımlık şifre sıfırlama ve e-posta doğrulama bağlantılarında yarış durumu koruması eklendi.

## API dayanıklılığı

- JSON API isteklerinde gövde boyutu sınırı eklendi.
- Geçersiz JSON istekleri 500 yerine 400 döndürüyor.
- API yanıtlarına `no-store`, `nosniff`, same-origin kaynak politikası ve `Server-Timing` ekleniyor.
- Hata yanıtlarında kullanıcıya güvenli bir istek kimliği veriliyor.
- Kayıt ve hesap kurtarma uç noktalarındaki oran sınırları güçlendirildi.

## Veritabanı ve yedekleme

- Prisma hata çıktıları production ortamında sadeleştirildi.
- Transaction bekleme ve çalışma sürelerine güvenli sınırlar eklendi.
- Günlük mantıksal yedekler önce gzip ile sıkıştırılıp ardından AES-256-GCM ile şifreleniyor.
- OAuth access/refresh/id token değerleri yedek dışına çıkarıldı.
- `BACKUP_RETENTION_DAYS` süresini aşan Blob yedekleri otomatik siliniyor.
- Eski başarısız yedek kayıtları bakım göreviyle temizleniyor.

## Operasyon ve gözlemlenebilirlik

- `/api/health` veritabanı erişimini ve gecikmesini kontrol eden sağlık uç noktası olarak eklendi.
- Admin güvenlik ekranına V24 sürümü, veritabanı gecikmesi ve güvenlik yapılandırma durumu eklendi.
- Ortam değişkeni kontrolü `npm run validate:env`, tam V24 kontrolü `npm run validate:v24` komutlarıyla çalıştırılabilir.
