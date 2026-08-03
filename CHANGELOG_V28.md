# V28.0 — CI ve otomatik testler

- GitHub Actions tabanlı üç aşamalı CI hattı eklendi.
- TypeScript, ESLint ve içerik doğrulama kontrolleri tek kalite komutunda birleştirildi.
- Playwright kuruldu ve kritik ziyaretçi, kimlik doğrulama, güvenlik ve mobil görünüm akışları test edildi.
- Playwright HTML raporu GitHub Actions artifact olarak saklanacak şekilde ayarlandı.
- Production build, kalite ve E2E işleri başarılı olmadan çalışmayacak bir kapıya bağlandı.
- Next.js 15 projesi için ESLint CLI ve flat config yapısı eklendi.
- V28 dosyalarını ve kalite kapısını doğrulayan `validate-v28.mjs` eklendi.
