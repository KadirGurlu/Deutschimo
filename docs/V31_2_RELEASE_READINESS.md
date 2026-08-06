# Deutschimo V31.2 — Release Readiness

V31.2 yeni eğitim modülü eklemekten önce sürüm güvenliğini standartlaştırır.

## Zorunlu kapılar
1. Node.js 22.22.2 ve npm 10.9.2
2. `package-lock.json` + `npm ci`
3. Ortam değişkeni ve veri sınıflandırması
4. Prisma generate + migration deploy
5. Lint + TypeScript + Production build
6. Gerçek kayıt/giriş/ilerleme/çıkış Playwright akışı
7. Güvenlik taraması
8. Sifreli pre-migration backup
9. Değişmez Git etiketi
10. Korumalı Production deployment

Bir kapı başarısızsa Production workflow'u durur. Vercel Preview otomatik dağıtımı test amaçlıdır; Production yalnızca korumalı workflow ve runbook ile yapılır.
