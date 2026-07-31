# Deutschimo V6 Değişiklikleri

## Alıştırma kontrol butonu düzeltmesi

- Çoktan seçmeli ve diğer alıştırmalarda seçilen cevabın hemen sıfırlanmasına neden olan React effect bağımlılığı düzeltildi.
- Cevap durumu artık yalnızca aktif alıştırma gerçekten değiştiğinde temizlenir.
- Bir seçenek seçildiğinde seçili görünüm korunur ve `Kontrol Et` butonu anında etkinleşir.
- Yanıt kontrol edildikten sonra geri bildirim ve `Sonraki Alıştırma` akışı çalışmaya devam eder.

## Veri referansı kararlılığı

- Slayt ve alıştırma listeleri ünite bazında önceden indekslendi.
- Aynı ünite için her render sırasında yeni dizi üretilmesi önlendi.
- Bu değişiklik gereksiz effect tekrarlarını ve istemsiz form sıfırlamalarını engeller.

## Değiştirilen temel dosyalar

- `components/exercises/exercise-shell.tsx`
- `hooks/use-content-store.ts`
- `package.json`
