# Deutschimo V16 doğrulama raporu

## Sonuç

V16 içerik bankası ve içerik bağlantıları hedeflenen veri yapısı üzerinde doğrulandı.

## Otomatik kontroller

Çalıştırılan komutlar:

```bash
npm run validate:v16
npm run validate:v16:types
node scripts/validate-content.mjs
```

Başarılı kontroller:

- 66/66 ünite mevcut
- A1: 12, A2: 16, B1: 18, B2: 20
- 66 özgün içerik paketi
- 396 yeni okuma/dinleme kontrol sorusu
- Her ünitede en az 10 kelime
- Her ünitede en az 6 Almanca–Türkçe örnek
- Her ünitede diyalog, okuma, dinleme, yazma, konuşma ve gerçek yaşam görevi
- V16 soru kimlikleri benzersiz
- Doğru cevaplar seçeneklerde mevcut
- Okuma, dinleme ve diyalog metinleri birebir tekrar etmiyor
- Öğrenciye gösterilen metinlerde kaynak kitap adları bulunmuyor
- Ünite başına 14 ana alıştırma bağlantısı
- Ünite sonu değerlendirmesinde 10 soru bağlantısı
- Değiştirilen içerik veri hattında TypeScript hedefli tip kontrolü başarılı
- 189 TypeScript/TSX dosyasında sözdizimi taraması başarılı

## Tam üretim derlemesi hakkında

Bu çalışma ortamındaki npm paket aynasında `@auth/prisma-adapter@2.8.0` paketi bulunmadığı için bağımlılıklar yeniden kurularak tam `next build` çalıştırılamadı. Bu durum proje kodundan değil, kullanılan geçici paket aynasından kaynaklanmaktadır. V16 ile değiştirilen içerik veri hattı ayrı TypeScript kontrolünden başarıyla geçti. Vercel, GitHub'a gönderilen projeyi kendi npm ortamında normal şekilde kurup derleyecektir.
