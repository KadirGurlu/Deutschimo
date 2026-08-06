# V31.2 Rollback Runbook

1. Hata kapsamını doğrula ve yeni deployları durdur.
2. GitHub Actions > `One-Step Application Rollback` aç.
3. Bilinen çalışan etiketi (`v31.1.0` gibi) ve `ROLLBACK_PRODUCTION` onayı gir.
4. Workflow denetlenebilir rollback dalı oluşturur ve etiketli uygulamayı yeniden deploy eder.
5. Sağlık/kayıt/giriş/dashboard kontrollerini yap.
6. Veritabanını otomatik aşağı migrate etme. Schema değişikliği uyumsuzsa expand/contract planı veya doğrulanmış backup ile ayrı restore prosedürü kullan.
