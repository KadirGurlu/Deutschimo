# CHANGELOG — V31 Platform Core 2.0

## Güvenlik
- API v1 standart başarı/hata sözleşmesi eklendi.
- API monitor; v1 hatalarında standart envelope üretir ve açıkça belirlenen cache başlıklarını korur.
- Request ID ve API version response header standardı eklendi.
- Cihaz kimlikleri hashlenerek saklanıyor.
- Cihaz kayıt/iptal işlemleri audit log'a bağlandı.
- Idempotency-Key tabanlı tekrar koruması eklendi.
- API health deep check gizli anahtarla korundu.
- CSP Report-Only, CORP, Origin-Agent-Cluster ve API noindex başlıkları eklendi.
- AI ve senaryo mutasyonlarında body-size sınırları sıkılaştırıldı.

## Mobil hazırlık
- `/api/v1/bootstrap` eklendi.
- `/api/v1/health` eklendi.
- `/api/v1/devices` eklendi.
- Platform auth soyutlaması eklendi.
- Client compatibility sözleşmesi eklendi.

## Veritabanı
- `ClientPlatform` enum'u eklendi.
- `ClientDevice` modeli eklendi.
- `ApiIdempotencyRecord` modeli eklendi.
- Yeni indeksler ve cascade foreign key'ler eklendi.

## Optimizasyon
- Günlük bakım veri-retention politikası güncellendi.
- Manuel `maintenance:cleanup` scripti eklendi.
- Görsel minimum cache süresi 24 saate çıkarıldı.
- V30.2 JSON okuma hotfix'i pakette korundu.

## Sürüm
- package.json: `31.0.0`
- `validate:v31` kalite kapısı eklendi.
