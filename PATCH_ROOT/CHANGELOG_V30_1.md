# CHANGELOG — V30.1

## Yeni
- Gerçek Almanya Modu ana modül olarak eklendi.
- Sidebar'a Profil üstünde yeni menü öğesi eklendi.
- `/real-germany` rotası eklendi.
- 32 adet gerçek yaşam senaryosu eklendi.
- Seviye seçimi, kategori filtresi ve arama altyapısı eklendi.
- Adım bazlı görev tamamlama ve localStorage kayıt desteği eklendi.

## Güncellendi
- `package.json` sürümü `30.1.0` oldu.
- `prebuild`, `vercel-build` ve `quality:check` akışlarına `validate:v30.1` eklendi.
- `validate-v29.mjs` ve `validate-v29-2.mjs` daha yeni sürümleri kabul edecek şekilde uyumlu hale getirildi.

## Veritabanı
- Değişiklik yok.
- Migration yok.


Hotfix included:
- V29.2 Prisma InputJsonValue cast fix is included in app/api/writing-coach/review/route.ts
