# Deutschimo V46.10 — WCAG Manual Accessibility Pass

**Status: MANUAL PASS REQUIRED**

Bu belge otomatik testlerin yerine geçmez. V46.10'un amacı WCAG 2.2 AA hedefindeki
kritik kullanıcı akışlarını gerçek klavye, gerçek tarayıcı ve ekran okuyucu ile manuel
olarak doğrulamaktır.

## Resmî referanslar

- WCAG 2.2 Quick Reference: https://www.w3.org/WAI/WCAG22/quickref/
- Keyboard 2.1.1: https://www.w3.org/WAI/WCAG22/Understanding/keyboard.html
- No Keyboard Trap 2.1.2: https://www.w3.org/WAI/WCAG22/Understanding/no-keyboard-trap.html
- Focus Order 2.4.3: https://www.w3.org/WAI/WCAG22/Understanding/focus-order.html
- Focus Visible 2.4.7: https://www.w3.org/WAI/WCAG22/Understanding/focus-visible.html
- Focus Not Obscured 2.4.11: https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum.html
- Contrast Minimum 1.4.3: https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html
- Non-text Contrast 1.4.11: https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html
- Labels or Instructions 3.3.2: https://www.w3.org/WAI/WCAG22/Understanding/labels-or-instructions.html
- Name, Role, Value 4.1.2: https://www.w3.org/WAI/WCAG22/Understanding/name-role-value.html
- Status Messages 4.1.3: https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html
- Animation from Interactions 2.3.3 (AAA, ek koruma):
  https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html

## Test edilecek kritik rotalar

### Public / Auth
- /
- /auth?mode=login
- /auth?mode=register
- /forgot-password
- /reset-password

### Student
- /dashboard
- /courses
- /placement-test
- /smart-review
- /study-plan
- /skills
- /vocabulary
- /progress
- /real-germany
- /profile
- /writing-coach

### Admin
- /admin
- Admin Content Studio içindeki create/edit/publish/modal akışları

---

## 1. Keyboard

Her rota için yalnızca klavye kullan:

- [ ] Tab ile bütün temel kontroller erişilebilir.
- [ ] Shift+Tab ile ters sıra mantıklı.
- [ ] Linkler Enter ile çalışıyor.
- [ ] Button'lar Enter ve Space ile çalışıyor.
- [ ] Açılır menü/diyalog varsa Escape ile kapanıyor.
- [ ] Focus hiçbir bölgede tuzağa düşmüyor.
- [ ] Mouse gerektiren tek kritik işlem yok.
- [ ] Drag/drop varsa klavye alternatifi var.

## 2. Focus

- [ ] Focus indicator her interaktif öğede net görünür.
- [ ] Sticky header veya overlay focus alanını tamamen kapatmıyor.
- [ ] Focus sırası görsel/işlevsel sıra ile uyumlu.
- [ ] Pozitif tabindex kullanılmıyor.
- [ ] Route değişimlerinde kullanıcı nerede olduğunu anlayabiliyor.
- [ ] "Ana içeriğe geç" bağlantısı ilk klavye adımlarında görünür ve çalışır.

## 3. Forms

Her input/select/textarea için:

- [ ] Görünür ve doğru label var.
- [ ] Label programatik olarak kontrole bağlı.
- [ ] Yardım metni gerekiyorsa aria-describedby kullanılıyor.
- [ ] Zorunlu alan bilgisi yalnızca renk ile anlatılmıyor.
- [ ] Hata mesajı ilgili alanla anlaşılır ilişki kuruyor.
- [ ] Email/password gibi bilinen alanlarda doğru autocomplete var.
- [ ] Loading sırasında form durumu anlaşılır.

## 4. Screen Reader

NVDA + Chrome/Edge önerilir.

- [ ] Sayfa başlığı ve ana heading anlamlı okunuyor.
- [ ] Navigasyon bölgelerinin aria-label'ları anlaşılır.
- [ ] Aktif sayfa aria-current ile bildiriliyor.
- [ ] Icon-only button'ların erişilebilir adı var.
- [ ] Dekoratif ikonlar gereksiz yere okunmuyor.
- [ ] Hatalar role="alert" / assertive live region ile duyuruluyor.
- [ ] Başarı ve yükleme durumları role="status" / polite live region ile duyuruluyor.
- [ ] Form alanlarının adı, rolü ve değeri doğru okunuyor.
- [ ] SPA rota değişimi live region ile duyuruluyor.

## 5. Contrast

Normal metin için AA hedefi en az 4.5:1; büyük metin için 3:1.

- [ ] Body text / background.
- [ ] Muted/help text / background.
- [ ] Link normal/hover/focus/visited durumları.
- [ ] Button normal/hover/focus/disabled durumları.
- [ ] Form border/focus/error durumları.
- [ ] Success/warning/error metinleri.
- [ ] Turkuaz metinler beyaz zemin üzerinde.
- [ ] Grafik/ikon gibi gerekli non-text UI sınırları.

V46.10 `--turquoise-dark` değerini #087B85'e koyulaştırır; statik token testi bu
rengin beyaz yüzeyde AA normal-text eşiğini geçmesini doğrular. Yine de tüm gerçek
component/state kombinasyonları manuel kontrol edilmelidir.

## 6. Semantic HTML

- [ ] Eylem yapan öğe gerçek `<button>`.
- [ ] Navigasyon yapan öğe gerçek `<a>` / Next Link.
- [ ] Clickable `<div>` / `<span>` kullanılmıyor veya güçlü gerekçesi var.
- [ ] Heading sırası anlamlı.
- [ ] `<main>`, `<nav>`, `<header>`, `<section>`, `<form>` anlamlı kullanılıyor.
- [ ] Custom widget varsa name/role/value/state eksiksiz.

## 7. Motion

Windows/macOS "Reduce motion" açıkken:

- [ ] Dekoratif transition/animation fiilen duruyor veya çok kısa oluyor.
- [ ] Hover lift/translate hareketleri kaldırılıyor.
- [ ] Spin/loader kullanıcıyı rahatsız edecek sürekli hareket üretmiyor.
- [ ] Otomatik başlayan 5 saniyeden uzun hareketli içerik varsa pause/stop/hide yolu var.
- [ ] İşlev için zorunlu olmayan interaction animation'ları azaltılabiliyor.

`prefers-reduced-motion` desteği V45'ten korunur ve V46.10'da hover/loader davranışları
için ek hardening uygulanır.

---

# Release kararı

Aşağıdaki alanlar **PASS** olmadan V46.10 için WCAG manuel pass tamamlandı denmemelidir:

- Keyboard: PASS / FAIL / NOT TESTED
- Focus: PASS / FAIL / NOT TESTED
- Forms: PASS / FAIL / NOT TESTED
- Screen Reader: PASS / FAIL / NOT TESTED
- Contrast: PASS / FAIL / NOT TESTED
- Semantic HTML: PASS / FAIL / NOT TESTED
- Motion: PASS / FAIL / NOT TESTED

Test eden:
Tarih:
Tarayıcı:
Ekran okuyucu:
Bulunan açık problemler:
