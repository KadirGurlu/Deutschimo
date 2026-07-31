# Deutschimo V8 kalite ve doğrulama raporu

## Kapsam

- Seviye: A1, A2, B1, B2
- Ünite: 66
- Ders slaytı: 990
- Ana alıştırma: 660
- Konu sonu kontrol sorusu: 594
- Ünite testi sorusu: 462

## Yapısal kontroller

- A1: 12 ünite
- A2: 16 ünite
- B1: 18 ünite
- B2: 20 ünite
- Her ünitede 15 zorunlu ders slaytı
- Her ünitede 9 bağımsız konu sonu kontrol sorusu
- Her ünitede en az 8 temel kelime
- Her temel örnekte Almanca ve Türkçe alanı
- Soru ve storage kimliklerinde V8 sürümü

## Arayüz kontrolleri

- Ana navigasyonda arama kutusu yok.
- `Kayıt Ol` CTA'sı `/auth` rotasına bağlı.
- Kelime renderer'ında `.`, `v`, `i` veya açıklamasız tür rozetleri yok.
- İsimler artikel ile birlikte, çoğullar ayrı metin olarak gösteriliyor.
- Almanca örnek, diyalog, okuma ve dinleme satırlarının altında Türkçe karşılık bulunuyor.
- Responsive kelime satırları ve mobil dokunma hedefleri için V8 CSS kuralları eklendi.

## İçerik ve geri bildirim kontrolleri

- Slayt mini kontrolü, konu sonu kontrolü, ana alıştırmalar ve quiz farklı soru kimlikleri kullanır.
- Mini kontrol yanlış geri bildirimi seçilen seçeneğe göre eşleştirilir.
- Konu sonu kontrolünde seçilen cevap, doğru cevap ve soru açıklaması birlikte gösterilir.
- Ana alıştırmalardaki V7 soru-özel açıklama sistemi korunur ve V8 kimlikleriyle çalışır.

## Teknik kontrol sonucu

- `node scripts/validate-content.mjs`: başarılı
- `node scripts/validate-v8.mjs`: başarılı
- V8 değişikliklerini kapsayan strict TypeScript kontrolü: başarılı

Tam `npm run build` bu çalışma ortamındaki paket kayıt servisinin `@types/node` paketini döndürmemesi nedeniyle burada çalıştırılamadı. Production derlemesi GitHub commit'inden sonra Vercel tarafından yapılmalıdır.
