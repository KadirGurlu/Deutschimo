Deutschimo V12.1 Edge Runtime hotfix

Sorun:
Next.js instrumentation.ts dosyasını hem Node.js hem Edge runtime için derler.
Önceki instrumentation kodu Prisma tabanlı logging.ts modülünü içe aktardığı için
Edge derlemesine node:crypto taşınıyor ve Vercel build'i duruyordu.

Düzeltme:
- instrumentation.ts artık runtime-bağımsız yapılandırılmış console kaydı üretir.
- API route hata ve başarısız istek kayıtları PostgreSQL'e yazılmaya devam eder.
- Veritabanı, kullanıcılar ve ilerleme verileri etkilenmez.
