# Deutschimo V31 — Platform Core 2.0

## Amaç

V31, yeni bir öğrenme özelliği eklemekten çok Deutschimo'nun teknik temelini yeniden düzenler. Hedef; web uygulamasını daha güvenli, daha gözlemlenebilir ve ileride geliştirilecek Android/iOS istemcileri için daha kararlı bir backend haline getirmektir.

## 1. Güvenlik katmanı

- Kritik mutasyonlar için tekrar eden isteği önleyen **idempotency** altyapısı eklendi.
- İstemci tarafından verilen cihaz kimliği veritabanında açık halde tutulmaz; `SECURITY_HASH_KEY` ile hashlenir.
- API v1 yanıtları ortak bir başarı/hata sözleşmesi kullanır.
- Her yanıtta istek kimliği ve API sürümü bulunur.
- Cihaz kayıt ve iptal işlemleri AuditLog'a yazılır.
- Cihaz endpoint'i kullanıcı/IP tabanlı kalıcı rate limit kullanır.
- Yazma Koçu ve Gerçek Almanya endpoint'lerinde istek gövdesi boyutu sınırlandırıldı.
- Derin health check yalnızca gizli anahtarla çalışır.
- Next.js güvenlik başlıkları CSP, CSP Report-Only, CORP, Origin-Agent-Cluster ve API noindex politikasıyla güçlendirildi.

## 2. Mobil uygulamaya hazırlık

Yeni stabil API sözleşmesi:

- `GET /api/v1/health`
- `GET /api/v1/bootstrap`
- `GET /api/v1/devices`
- `POST /api/v1/devices`
- `DELETE /api/v1/devices`

`/api/v1/bootstrap` şu bilgileri verir:

- API ve platform sürümü
- güvenli kullanıcı özeti
- aktif yetenekler
- kurs / Gerçek Almanya / Yazma Koçu / Akıllı Tekrar özeti
- istemci uyumluluk bilgisi

Mobil uygulama henüz yayınlanmadığı için `mobileAuthentication`, `offlineSync` ve `pushNotifications` açık gösterilmez. Bu ayrım, hazır olmayan özelliklerin istemci tarafından yanlışlıkla kullanılmasını önler.

`getPlatformApiUser()` soyutlaması bugün web oturumunu kullanır. Gelecekte mobil bearer-token doğrulaması eklendiğinde endpoint iş mantığının yeniden yazılmasına gerek kalmaz.

## 3. Cihaz kaydı ve iptal

`ClientDevice` modeli aşağıdaki bilgileri güvenli biçimde saklar:

- kullanıcı
- hashlenmiş cihaz kimliği
- WEB / IOS / ANDROID platformu
- uygulama sürümü
- cihaz adı, locale ve timezone
- ilk ve son görülme tarihi
- iptal tarihi

Ham cihaz kimliği veritabanına yazılmaz.

## 4. Idempotency

Mobil ağlarda aynı istek bağlantı hatası nedeniyle birden fazla kez gönderilebilir. V31'de `Idempotency-Key` başlığıyla yapılan mutasyonlar:

1. kullanıcı + route + anahtar bazında hashlenir,
2. istek gövdesinin fingerprint'i alınır,
3. aynı istek yeniden gelirse önceki sonuç döndürülür,
4. aynı anahtar farklı veriyle kullanılırsa `409 CONFLICT` üretilir.

Bu altyapı ileride çevrim dışı senkronizasyon ve ödeme işlemleri için kullanılabilir.

## 5. Performans ve veri hijyeni

Günlük bakım şu kayıtları kontrollü sürelerle temizler:

- süresi dolmuş idempotency kayıtları
- kısa ömürlü rate limit olayları
- 35 günden eski session revocation kayıtları
- eski login denemeleri
- eski API hata kayıtları
- eski sistem hata kayıtları
- 365 günden eski audit kayıtları
- uzun süredir iptal edilmiş cihazlar

Session revocation verileri kısa rate limit kayıtlarıyla aynı şekilde silinmez; aktif 30 günlük oturumların güvenliği korunur.

Static dosyalar uzun süreli cache kullanmaya devam eder. API'ler ve korunan sayfalar `no-store` kalır. Görseller için minimum cache süresi artırıldı.

## 6. Veritabanı değişiklikleri

Yeni modeller:

- `ClientDevice`
- `ApiIdempotencyRecord`

Yeni enum:

- `ClientPlatform`

Migration yalnızca ekleme yapar; mevcut kullanıcı, kurs, yazma veya Gerçek Almanya verisini silmez.

## 7. Operasyon ve gözlemlenebilirlik

- Shallow health check veritabanına sorgu atmaz.
- `?deep=1` kullanıldığında yetkili ve zaman aşımı kontrollü DB testi yapılır.
- Günlük cron mevcut yedekleme akışını korur ve V31 temizliğini ekler.
- Manuel bakım için `npm run maintenance:cleanup` komutu eklendi.

## 8. V31 sonrasında önerilen teknik sıra

1. Mobil bearer-token / refresh-token oturum sistemi
2. Cursor tabanlı delta sync
3. Offline mutation kuyruğu
4. Push notification cihaz tokenları
5. Feature flag ve kademeli yayın
6. Premium yetkilendirme ve ödeme webhook idempotency

V31 bu adımların güvenli biçimde eklenebileceği çekirdeği oluşturur; henüz mobil uygulamayı aktif hale getirmez.
