# Deutschimo V46.10 — WCAG Manual Accessibility Pass

## Kapsam

V45 accessibility foundation korunarak kritik kullanıcı akışları manuel WCAG pass için
sertleştirildi.

### Keyboard / Focus
- Root main hedefi server markup içinde `main-content` + `tabIndex=-1`.
- Mobil hesap menüsünde `aria-controls`, `aria-expanded` ve Escape-close davranışı.
- Aktif sidebar/mobile navigation öğelerinde `aria-current="page"`.
- Focus-visible override, daha önceki `outline: 0` stillerini de geçecek şekilde güçlendirildi.
- Sticky header için scroll-padding desteği.

### Forms / Screen Reader
- Auth hata mesajları `role=alert`, başarı/durum mesajları `role=status`.
- Forgot/reset password alanlarında açık label bağlantısı ve autocomplete.
- Reset password yardım metni `aria-describedby` ile ilişkilendirildi.
- SPA route değişimleri polite live region ile duyuruluyor.
- Dekoratif layout ikonları screen reader'dan saklanıyor.

### Contrast
- `--turquoise-dark` #16A8B0 → #087B85.
- Amaç: beyaz yüzeyde normal boyutlu turkuaz metinler için 4.5:1 AA tabanını aşmak.
- V46.10 audit script'i temel global renk tokenlarının kontrastını hesaplıyor.

### Semantic HTML
- Kritik navigation/auth dosyalarında clickable div/span yasak release kontrolü.
- Native link/button semantiği korunuyor.

### Motion
- V45 `prefers-reduced-motion` tabanı korunuyor.
- V46.10 reduced-motion altında hover transform ve spinner hareketini devre dışı bırakıyor.

## Test / Release gate
- `validate:v46.10`
- `a11y:v46.10`
- `test:e2e:v46.10`
- `release:v46.10`
- GitHub Actions V46.10 accessibility workflow

## Database

- Yeni Prisma migration: YOK.
- Schema değişikliği: YOK.
- Production/Preview DB işlemi: YOK.
- Veri silme/reset/db push: YOK.

## Önemli

Otomatik kontroller WCAG conformance beyanı değildir.
`docs/V46_10_MANUAL_WCAG_CHECKLIST.md` gerçek klavye, focus, screen reader, contrast,
semantic HTML ve reduced-motion testiyle tamamlanmalıdır.
