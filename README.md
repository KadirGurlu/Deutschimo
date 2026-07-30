# Deutschimo V7

Deutschimo, A1-B2 düzeylerinde yazılı ders anlatımı, etkileşimli alıştırmalar, ünite testleri ve ayrıntılı ilerleme takibi sunan responsive bir Next.js eğitim platformudur.

## Güncel içerik kapsamı

| Seviye | Ünite | Ders slaytı | Alıştırma | Quiz sorusu |
|---|---:|---:|---:|---:|
| A1 | 12 | 96 | 120 | 84 |
| A2 | 16 | 128 | 160 | 112 |
| B1 | 18 | 144 | 180 | 126 |
| B2 | 20 | 160 | 200 | 140 |
| **Toplam** | **66** | **528** | **660** | **462** |

Her ünitede varsayılan olarak:

- 8 odaklanmış ders slaytı
- Dikey ve okunabilir kelime tablosu
- Ünitedeki fiiller için Präsens çekim tabloları
- Ayrıntılı gramer açıklaması ve kullanım stratejisi
- Cümle kalıpları ve bağlam örnekleri
- 10 etkileşimli alıştırma
- 7 soruluk ünite sonu değerlendirmesi
- Slayt, alıştırma ve quiz ağırlıklı ilerleme hesabı

## Öne çıkan V7 düzeltmeleri

- Slayt mini kontrolü, normal alıştırmalar ve ünite testi için üç bağımsız soru katmanı oluşturuldu.
- Slayttaki soru normal alıştırmada veya quizde yeniden kullanılmıyor.
- Her normal alıştırma doğru cevaba ve ilgili dil kuralına özel bir açıklama gösteriyor.
- Çoklu seçim sorularında yanlış geri bildirim artık başka bir sorunun açıklamasını göstermiyor.
- Ünite testi sonunda her soru için kullanıcının yanıtı, doğru yanıt ve “Neden?” açıklaması gösteriliyor.
- Soru ve quiz kimlikleri V7 olarak yenilendi; eski demo cevaplarının yeni sorulara karışması engellendi.
- Alıştırma seçimi ve `Kontrol Et` butonu V6 düzeltmesiyle çalışmaya devam ediyor.
- Kelime tabloları, fiil çekimleri ve genişletilmiş sekiz slaytlı ders yapısı korunuyor.

## Kurulum

```bash
npm install
npm run dev
```

Yerel adres:

```text
http://localhost:3000
```

Production kontrolü:

```bash
npm run build
npm start
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

Bu sürüm demo kullanıcı ilerlemesini ve admin içerik değişikliklerini tarayıcı `localStorage` alanında saklar. Tüm cihazlardan ortak kullanıcı ve içerik yönetimi için PostgreSQL, Prisma ve Auth.js bağlantısı gerekir.


## V7 soru sistemi

Ders slaytı mini kontrolleri, normal alıştırmalar ve ünite testleri birbirinden bağımsız soru havuzları kullanır. Her sorunun kendine ait açıklaması vardır ve ünite testi sonunda soru bazlı inceleme gösterilir.
