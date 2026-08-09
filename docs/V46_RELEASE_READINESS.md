# Deutschimo V46 — Release Readiness / End-to-End Quality

## Ana hedef

V46'nın başarı kriteri yalnızca `build başarılı` değildir.

Başarı kriteri:

> Deutschimo gerçek kullanıcıya güvenli, kararlı, erişilebilir ve performanslı
> biçimde açılabilecek durumda olmalıdır.

V46.0 paketi V46.1–V46.4 alanlarını tek release gate içinde uygular.

## Temel geliştirme prensibi

V45 çalışan tabanı korunur.

Gereksiz refactor yapılmaz. Authentication, kullanıcı verisi, kurslar, progress,
admin, database modelleri, Mastery Engine, Smart Review, Personal Learning Engine,
mevcut UI/UX ve responsive yapı yalnız test uğruna yeniden yazılmaz.

Bir problemde:
1. Kök neden bulunur.
2. En küçük güvenli düzeltme yapılır.
3. Regresyon testi eklenir.
4. V45 kapıları tekrar çalışır.

## V46.1 — Authentication -> Onboarding -> Placement -> Dashboard

Playwright gerçek browser senaryosu:

- Korunan dashboard/onboarding/placement route guard
- Yeni kullanıcı kaydı
- Onboarding'e doğru yönlendirme
- "Seviyemden emin değilim" -> Seviye Testi köprüsü
- Onboarding'e dönüş
- Seviye / hedef / günlük dakika / haftalık gün / beceri seçimi
- Plan tamamlama
- Dashboard
- DB'de onboardingCompleted ve profil persistence
- Logout
- Session sınırı
- Yanlış parola
- Doğru parola ile aynı kullanıcıya dönüş
- Duplicate e-posta ile ikinci kullanıcı oluşmaması

Seviye Testi soru bankasının tüm sorularının otomatik cevaplanması V46.0'ın
amacı değildir; V46.1 onboarding-placement yönlendirme ve koruma sözleşmesini
gerçek browser üzerinden doğrular. Placement'ın kendi ölçüm motoru mevcut
validator/entegrasyon tabanında korunur.

## V46.2 — A1 -> A2 -> B1 -> B2 Course Progression

Gerçek browser + `/api/progress` sunucu persistence testi:

Course -> Unit -> Lesson -> Exercise -> Completion -> Unit Progress ->
Course/User Progress zincirinin veri sınırı test edilir.

Kontroller:
- A1/A2/B1/B2 kurs sayfaları açılır.
- Dört seviyede tamamlanmış ünite state'i kaydedilir.
- Aynı state iki kez yazıldığında duplicate completion activity oluşmaz.
- Refresh sonrası progress korunur.
- İkinci browser/context girişinde aynı progress okunur.
- Yayınlanmış A1 ünitesi öğrenci content API'sinden gelir.
- Bilinmeyen/yayınlanmamış content 404 verir.
- Course service yalnız PUBLISHED/active içerikleri öğrenci tarafına taşır.

## V46.3 — Mastery + Smart Review + Personal Learning + Daily Plan

Düşük LISTENING performansı gerçek `/api/skills/attempts` üzerinden gönderilir.

Beklenen zincir:

Student Activity
-> SkillLabAttempt
-> MasterySkillSnapshot
-> MasteryReviewQueueItem
-> Personal Learning decision
-> Daily Plan

Kontroller:
- Düşük listening sonucu Mastery snapshot üretir.
- Score düşük olarak görünür.
- ACTIVE Smart Review queue item oluşur.
- Personal Learning kararında LISTENING sinyali bulunur.
- Günlük plan endpoint'i çalışır.
- Aynı gün tekrar çağrısı duplicate DailyStudyPlan üretmez.
- Personal Learning sorguları duplicate review borcu üretmez.
- Ertesi gün plan isteği geçerli kalır.

## V46.4 — Dinleme ve Konuşma Laboratuvarları

### Listening

V46 yeni ses mimarisi yazmaz; V39/V45 mevcut browser speech synthesis tabanını
korur ve hata dayanıklılığını yükseltir.

- speechSynthesis desteklenmiyorsa açıklayıcı durum
- Speech synthesis hata event'i
- speak() exception
- çalışma ekranının çökmemesi
- V45 erişilebilir transkript/metin alternatifi korunması

### Speaking

V40 browser SpeechRecognition tabanı korunur.

V46 hata ayrımı:
- `not-allowed` / `service-not-allowed`
- `audio-capture`
- `network`
- `no-speech`
- diğer speech-recognition hataları
- `recognition.start()` exception

Mikrofon izni reddedildiğinde kullanıcıya elle konuşma metni girme yolu açık kalır.

E2E ayrıca `/api/skills/attempts` için geçici HTTP 503 simüle eder; değerlendirme
UI'sinin çökmeden sonucu göstermesi/kaydetme hatasını açıklaması beklenir.

390px mobil viewport'ta sistemik yatay overflow kontrol edilir.

## Release Gate

V46 başarılı sayılmak için:

- V44 validator
- V45 validator
- V45 accessibility audit
- V46 validator
- V46 source contracts
- Geçici PostgreSQL
- migration deploy x2 / idempotency
- migration status
- schema drift
- V46 DB readiness
- security release
- DB data boundaries
- ESLint
- TypeScript
- Next.js production build
- V45 JS bundle performance budget
- V46.1 E2E
- V46.2 E2E
- V46.3 E2E
- V46.4 E2E

tamamı geçmelidir.

## Test DB güvenliği

GitHub Actions production veya preview Neon veritabanını kullanmaz.

CI PostgreSQL 16 service container:
`deutschimo_v46_ci`

Workflow tamamlandığında container yok edilir.

## Veri modeli

Yeni Prisma migration: YOK

Yeni environment variable: YOK

Production/Preview verisi: test amacıyla kullanılmaz.

## Manuel final review

V45'te hazırlanan accessibility/performance manuel checklist korunur.
V46 otomasyonundan sonra production açılışı öncesi gerçek cihaz, gerçek mikrofon,
klavye, mobil browser, screen reader ve Vercel Speed Insights kontrolü ayrıca yapılır.
