# Deutschimo V4 · Tam İçerikli Yapılandırılmış Öğrenme Sistemi

Deutschimo'nun A1, A2, B1 ve B2 programları aynı slayt, alıştırma, quiz, ilerleme ve admin altyapısı üzerinde çalışır. Bu sürümde önceki placeholder ders metinleri ve sorular kaldırılmış, 66 ünitenin tamamı özgün eğitim içeriğiyle doldurulmuştur.

## Program kapsamı

| Seviye | Ünite | Ders slaytı | Alıştırma | Quiz sorusu |
|---|---:|---:|---:|---:|
| A1 | 12 | 72 | 96 | 60 |
| A2 | 16 | 96 | 128 | 80 |
| B1 | 18 | 108 | 144 | 90 |
| B2 | 20 | 120 | 160 | 100 |
| **Toplam** | **66** | **396** | **528** | **330** |

Her ünitede 6 odaklı ders slaytı, 8 adım alıştırma ve 5 soruluk ünite sonu değerlendirmesi bulunur.

## Her ünitenin içeriği

- Türkçe üniteye giriş ve öğrenme hedefleri
- Seviyeye uygun Almanca dil bilgisi anlatımı
- Yapı ve kullanım tablosu
- En az sekiz Almanca–Türkçe kelime/ifade
- Dört özgün Almanca örnek ve Türkçe anlamı
- Sık yapılan hata veya kullanım notu
- Mini kontrol sorusu
- Çoktan seçmeli, çoklu seçim, doğru/yanlış, boşluk doldurma, eşleştirme ve cümle sıralama
- A1–A2 düzeyinde çeviri ve diyalog
- B1–B2 düzeyinde kısa cevap ve yazma görevi
- Beş soruluk ünite sonu testi

## Öğrenme sistemi

- NOT_STARTED, IN_PROGRESS, COMPLETED ve LOCKED ünite durumları
- Slayt → alıştırma → quiz sıralaması
- Kaldığın slayt veya alıştırmadan devam etme
- Ders %40, alıştırma %40, quiz %20 ağırlıklı ilerleme
- Minimum %70 quiz başarı kuralı
- Tamamlanan üniteden sonra sıradaki ünitenin otomatik açılması
- localStorage tabanlı kalıcı demo ilerlemesi
- Dashboard, aktivite listesi ve ünite zaman çizelgesi
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

Öğrenci ilerlemesi ve admin içerik değişiklikleri şimdilik tarayıcı localStorage alanında saklanır. Gerçek çok kullanıcılı sürümde servis katmanı PostgreSQL, Prisma ve Auth.js ile değiştirilebilir.
