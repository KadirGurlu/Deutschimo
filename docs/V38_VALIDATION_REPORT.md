# Deutschimo V38 — Paket Doğrulama Raporu

## Paket durumu

V38 installer paketi üretim öncesi statik kontrollerden geçti.

### Doğrulananlar

- `PATCH_DEUTSCHIMO_V38.mjs`: Node sözdizimi OK.
- `validate-v38.mjs`: Node sözdizimi OK.
- `mastery-review-3.ts`: TypeScript parse/sözdizimi OK; gerçek modül çözümlemesi repository/Vercel içinde yapılacak.
- `smart-review-v38.ts`: TypeScript parse/sözdizimi OK.
- Sentetik V37 fixture üzerinde V37 -> V38 patch işlemi başarılı.
- Sentetik fixture üzerinde `validate:v38` başarılı.
- Standalone Mastery queue öğelerinin `/smart-review` yüzeyine bağlanması doğrulandı.
- V38 migration yıkıcı SQL içermiyor.
- `tags` PostgreSQL listesi Prisma'nın required `String[]` modeliyle uyumlu: NOT NULL + boş dizi default.
- `updatedAt` alanına database default eklenmiyor; V37'de çözülen `Some(Now) -> None` drift problemi yeniden üretilmiyor.

## Mimari kabul kriterleri

- V28.3 scheduler korunuyor.
- V37 `recordMasteryEvidence()` içine yanlış cevap queue hook'u ekleniyor.
- `correct=false` Mastery kanıtı `MasteryReviewQueueItem` kuyruğuna alınır.
- SMART_REVIEW sonucunun V38 fazı ayrıca senkronize edilir; V37 bridge üzerinden çift failure sayımı engellenir.
- Eski Smart Review state'in doğrudan çözemediği V38 queue kaydı kaybolmaz; standalone Mastery tekrar kartı olarak gösterilebilir.
- Kurs progress/tamamlama Mastery evidence değildir.
- Dört faz: RECALL -> SENTENCE -> PRODUCTION -> CONTRAST.
- Dokuz sinyal: son doğru, son yanlış, response time, error count, skill/mastery, difficulty, last review, confidence, similar-topic performance.

## Vercel Preview'da nihai olarak doğrulanacaklar

Yerel paket ortamında Deutschimo'nun gerçek `node_modules`, Prisma Client ve Preview PostgreSQL bağlantısı bulunmadığı için aşağıdakiler Vercel Preview'da son kez doğrulanacaktır:

1. `prisma migrate deploy`
2. migration sonrası schema-drift kontrolü
3. `prisma generate`
4. tam TypeScript/Next.js production build
5. gerçek kullanıcı yanlışı -> V38 queue kaydı
6. `/smart-review` üzerinde dokuz sinyal ve dört fazın gerçek verilerle görünmesi
7. doğru/yanlış tekrar sonrası faz ve `dueAt` senkronizasyonu

## Yeni environment variable

Yok.
