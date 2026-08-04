Deutschimo V28.3 — V28.1 Validator Uyumluluk Düzeltmesi

Sorun:
V28.1 doğrulayıcısı package.json sürümünü yalnızca 28.1.0 olarak kabul ediyordu.
V28.3 paketi doğal olarak 28.3.0 sürümünü kullandığı için build migration aşamasına ulaşmadan duruyordu.

Düzeltme:
V28.1 altyapı doğrulayıcısı artık 28.1.0 ve sonraki sürümleri kabul eder.
Diğer V28.1 güvenlik, migration ve CI kontrolleri aynen korunur.

Kurulum:
1. ZIP'i ayıklayın.
2. İçindeki scripts klasörünü Deutschimo proje köküne kopyalayın.
3. Mevcut scripts/validate-v28-1.mjs dosyasının değiştirilmesini onaylayın.
4. v28-3-staging dalında commit ve push yapın.

Önerilen commit mesajı:
Fix V28.1 validator compatibility for V28.3
