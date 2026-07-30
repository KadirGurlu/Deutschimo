# Deutschimo V9 V8

Deutschimo, A1-B2 düzeylerinde yapılandırılmış yazılı dersler, etkileşimli alıştırmalar, ünite testleri ve ayrıntılı ilerleme takibi sunan responsive bir Next.js eğitim platformudur.

## V8 içerik kapsamı

| Seviye | Ünite | Ders slaytı | Ana alıştırma | Konu sonu kontrolü | Quiz sorusu |
|---|---:|---:|---:|---:|---:|
| A1 | 12 | 180 | 120 | 108 | 84 |
| A2 | 16 | 240 | 160 | 144 | 112 |
| B1 | 18 | 270 | 180 | 162 | 126 |
| B2 | 20 | 300 | 200 | 180 | 140 |
| **Toplam** | **66** | **990** | **660** | **594** | **462** |

Her ünitede 15 odaklanmış ders slaytı bulunur:

1. Konuya giriş, kullanım alanları, hedefler ve ön bilgiler
2. Artikel, çoğul, anlam, örnek ve telaffuz içeren kelime listesi
3. Dil bilgisi yapısının tanımı ve işlevi
4. Olumlu, olumsuz, evet-hayır ve W-soruları
5. Fiil çekimleri ve özne-fiil uyumu
6. Tekil-çoğul, resmî-samimi hitap ve istisnalar
7. Almanca-Türkçe bağlam örnekleri
8. Günlük yaşam diyaloğu
9. Okuma metni ve stratejisi
10. Dinleme metni ve not alma
11. Yazma çalışması
12. Konuşma ve telaffuz çalışması
13. Yanlış-doğru karşılaştırmaları ve mini kontrol
14. Konu özeti ve öz değerlendirme
15. Ana alıştırmalardan farklı dokuz soruluk konu sonu kontrolü

## V8 yenilikleri

- Ana navigasyondaki arama çubuğu kaldırıldı ve menü dengeli biçimde yeniden hizalandı.
- Ana CTA metni `Kayıt Ol` olarak değiştirildi ve `/auth` rotasına bağlandı.
- Kelime listelerindeki anlamsız `.`, `v`, `i` rozetleri kaldırıldı.
- İsimler `artikel + kelime – die çoğul` düzeninde gösteriliyor.
- Her kelimede doğal Türkçe anlam, Almanca örnek, Türkçe çeviri ve telaffuz düğmesi bulunuyor.
- Bütün Almanca öğretim örneklerinin Türkçe karşılığı doğrudan altında gösteriliyor.
- Dersler okuma, dinleme, yazma ve konuşma görevleriyle genişletildi.
- Konu sonu kontrolü ana alıştırma ve quiz havuzundan bağımsızdır.
- Mini kontrol ve konu sonu kontrol geri bildirimleri seçilen soruyla eşleştirilir.
- Storage anahtarları V8 olarak yenilendi; eski demo kayıtlarının yeni yapıyı bozması engellendi.

## Kurulum

```bash
npm install
npm run dev
```

Yerel adres:

```text
http://localhost:3000
```

Doğrulama:

```bash
npm run validate:content
npm run validate:v8
npm run build
```

## Ana rotalar

```text
/courses/a1
/courses/a2
/courses/b1
/courses/b2
/learn/a1/a1-u01
/learn/a1/a1-u01/exercises
/learn/a1/a1-u01/quiz
/dashboard
/progress
/admin/content
/admin/users
```

## Veri notu

Demo ilerleme ve admin içerik değişiklikleri tarayıcı `localStorage` alanında saklanır. Çok cihazlı gerçek kullanıcı yönetimi için PostgreSQL, Prisma ve Auth.js bağlantısı gerekir.
