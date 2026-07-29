# Deutschimo V3 · Yapılandırılmış Öğrenme Sistemi

Bu sürüm, Deutschimo'nun A1-A2-B1-B2 programlarını aynı slayt, alıştırma, quiz, ilerleme ve admin altyapısı üzerinde çalıştırır.

## Program kapsamı

| Seviye | Ünite | Ders slaytı | Alıştırma | Ünite testi |
|---|---:|---:|---:|---:|
| A1 | 12 | 72 | 96 | 12 |
| A2 | 16 | 96 | 128 | 16 |
| B1 | 18 | 108 | 144 | 18 |
| B2 | 20 | 120 | 160 | 20 |
| **Toplam** | **66** | **396** | **528** | **66** |

Her ünitede varsayılan olarak 6 odaklı ders slaytı, 8 adım alıştırma ve 5 soruluk ünite sonu değerlendirmesi bulunur. Eğitim içerikleri placeholder alanlardır; gerçek ders içerikleri admin panelinden eklenecek şekilde hazırlanmıştır.

## Öne çıkan geliştirmeler

- Bütün seviyelerde öğrenme yolu ve kilitli ünite sistemi
- NOT_STARTED, IN_PROGRESS, COMPLETED ve LOCKED durumları
- Ders slaytlarında kaldığın yerden devam etme
- Mini kontrol ve minimum görüntüleme kontrolü
- Alıştırmalar tamamlanmadan quiz'e geçememe
- Çoktan seçmeli, çoklu seçim, doğru-yanlış, boşluk doldurma, eşleştirme, sıralama, çeviri, diyalog, kısa cevap ve yazma bileşenleri
- Quiz sonucu, minimum başarı puanı ve sonraki üniteyi açma
- Ders %40, alıştırma %40 ve quiz %20 ağırlıklı ilerleme hesabı
- localStorage tabanlı kalıcı demo ilerlemesi
- Dashboard, aktivite listesi ve ünite zaman çizelgesi
- Kullanıcı ve içerik yönetimi admin paneli
- Mobil drawer, dokunmatik sıralama ve responsive kartlar
- Video bileşeni bulunmaz

## Temel rotalar

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
/admin
/admin/users
/admin/content
```

## Kurulum

```bash
npm install
npm run dev
```

Production kontrolü:

```bash
npm run build
```

## Veri katmanı

Şimdilik ilerleme ve admin içerik değişiklikleri tarayıcı localStorage alanında saklanır. Gerçek çok kullanıcılı sürümde bu servislerin PostgreSQL, Prisma ve Auth.js ile değiştirilmesi planlanmıştır.
