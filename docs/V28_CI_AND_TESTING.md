# Deutschimo V28.0 — CI ve otomatik testler

## Eklenen kalite kapıları

1. **TypeScript:** `npm run typecheck`
2. **ESLint:** `npm run lint`
3. **İçerik:** `npm run validate:content` ve `npm run validate:v27`
4. **V28 yapı doğrulaması:** `npm run validate:v28`
5. **Kritik kullanıcı akışları:** `npm run test:e2e`
6. **Production build:** yalnızca kalite ve E2E işleri başarılı olduktan sonra çalışır.

## Playwright kapsamı

- Ana sayfanın açılması ve kayıt akışı
- A1–B2 seviye seçiminin kayıt formuna taşınması
- Giriş ekranının doğru modda açılması
- Oturumsuz kullanıcının öğrenci panelinden giriş sayfasına yönlendirilmesi
- Güvenlik başlıklarının doğrulanması
- Cross-site kritik API isteğinin reddedilmesi
- Mobil görünümde yatay taşma kontrolü

## Yerel kullanım

```bash
npm install
npx playwright install chromium
npm run quality:check
npm run test:e2e
npm run build
```

Hatalı E2E çalışmasından sonra rapor:

```bash
npm run test:e2e:report
```

## GitHub ayarı

GitHub deposunda **Settings → Branches → Branch protection rules** bölümünde `main` için şu kontrol zorunlu yapılmalıdır:

- `Production build gate`

Bu ayar etkinleştirildiğinde kalite kapısı başarısız bir değişikliğin `main` dalına birleştirilmesini engeller.

## Kilit dosyası notu

Projede önceki sürümden `package-lock.json` gelmediği için workflow iki durumu da destekler. İlk yerel `npm install` işleminden sonra oluşan `package-lock.json` dosyasını repoya eklemek, sonraki CI çalıştırmalarında otomatik olarak `npm ci` kullanılmasını ve daha tekrarlanabilir kurulumları sağlar.
