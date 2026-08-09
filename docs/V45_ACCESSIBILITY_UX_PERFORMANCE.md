# Deutschimo V45 — Accessibility + UX + Performance

## Amaç

V45 yeni ürün özelliği eklemez. Amaç mevcut Deutschimo uygulamasının erişilebilirlik,
kullanılabilirlik ve performans temelini güçlendirmektir.

Hedef: WCAG 2.2 AA.

Bu sürüm otomatik kontrol ve teknik iyileştirme sağlar; WCAG uygunluk beyanı değildir.
Son uygunluk kararı klavye, ekran okuyucu, zoom/reflow, renk kontrastı, mobil dokunma,
form hataları ve gerçek cihaz testleriyle manuel olarak verilmelidir.

## Erişilebilirlik değişiklikleri

- Tüm uygulamada görünür "Ana içeriğe geç" skip-link.
- Root HTML dil niteliğinin korunması/eklenmesi.
- Klavye için belirgin `:focus-visible` odak halkası.
- WCAG 2.2 AA Target Size (Minimum) tabanı: 24x24 CSS px.
- Deutschimo ana buton/navigasyon yüzeylerinde 44px mobil kullanım hedefi.
- `prefers-reduced-motion` desteği.
- Windows High Contrast / `forced-colors` desteği.
- `aria-invalid` form hata durumlarının daha belirgin görünmesi.
- Soru seçeneklerinde radiogroup/radio screen-reader semantiği.
- Soru geri bildiriminde status mesajı.
- Dinleme Laboratuvarında erişilebilir metin alternatifi/transkript paneli.
- Erişilebilir transkriptin açılıp açılmadığı çalışma kanıtına eklenir.
- Almanca transkript `lang="de"`, Türkçe çeviri `lang="tr"`.
- Konuşma Laboratuvarında mikrofon butonunun `aria-pressed` durumu.
- Konuşma textarea alanına erişilebilir ad.
- Konuşma/Dinleme durum mesajlarında `role="status"`.
- Başlığı olan icon-only butonlara güvenli runtime aria-label desteği.
- Buton/link içindeki dekoratif SVG ikonları screen reader akışından çıkarılır.

## UX

- Klavye odağının kaybolmaması.
- Sabit üst alanların odaklanan öğeyi örtmesini azaltan scroll-margin.
- Dokunmatik kontrollerde manipulation davranışı.
- Disabled/invalid kontrol durumlarının daha açık görsel davranışı.
- Hareket azaltma tercihine saygı.

## Performans

V45 iki farklı performans katmanı kullanır:

### 1. Build bütçesi

GitHub Actions, Next.js build sonrasında `.next/static/chunks` JS dosyalarını gzip olarak ölçer.

Başlangıç bütçesi:
- Tek JS chunk: en fazla 400 KB gzip
- Tüm static JS chunk toplamı: en fazla 4.6 MB gzip

Bu limitler regresyon kapısıdır; Core Web Vitals değildir.

### 2. Gerçek kullanıcı performansı

Vercel Speed Insights üzerinde özellikle şu yüzeyler izlenmelidir:

- Dashboard
- Kurslar
- Ders
- Test
- Günlük Plan
- Admin

Ana metrikler:
- LCP
- INP
- CLS
- FCP
- TTFB

Next.js `useReportWebVitals` geliştirme ortamında metrikleri console'a da raporlar.

## CI kapıları

V45 workflow:
1. Toolchain / lockfile
2. V44 geriye uyumluluk
3. V45 validator
4. V45 statik accessibility audit
5. PostgreSQL test veritabanı ve migration idempotency
6. Drift
7. Security / DB boundary
8. ESLint
9. TypeScript
10. Next.js production build
11. JS bundle performance budget

## Veri güvenliği

Yeni Prisma migration: YOK

Yeni environment variable: YOK

Mevcut V44 CMS, öğrenci verileri, Gold Standard içerikler, Mastery Engine,
Akıllı Tekrar, Dinleme/Konuşma Laboratuvarı ve Kişisel Öğrenme Motoru korunur.

## Kaynak standartları

- W3C WCAG 2.2 Recommendation:
  https://www.w3.org/TR/WCAG22/
- WCAG 2.2 Target Size (Minimum):
  https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum
- Next.js accessibility:
  https://nextjs.org/docs/architecture/accessibility
- Next.js useReportWebVitals:
  https://nextjs.org/docs/app/api-reference/functions/use-report-web-vitals
- Vercel Speed Insights:
  https://vercel.com/docs/speed-insights
