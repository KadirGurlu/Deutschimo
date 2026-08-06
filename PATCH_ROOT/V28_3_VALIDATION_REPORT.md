# Deutschimo V28.3 Validation Report

**Sürüm:** 28.3.0  
**Paket:** Akıllı Tekrar 2.0  
**Doğrulama tarihi:** 4 Ağustos 2026

## Başarılı kontroller

### Dosya ve build kapıları

- `package.json` JSON olarak ayrıştırıldı.
- `validate:v28.3` komutu tanımlı.
- Vercel build sırası V28.3 doğrulamasını migration işleminden önce çalıştırıyor.
- TypeScript ve TSX dosyaları TypeScript 5.8.3 `transpileModule` ile sözdizimi açısından başarıyla işlendi.
- V28.3 statik doğrulama betiği başarıyla tamamlandı.

### Algoritma

- Doğru/yanlış, cevap süresi, ipucu, tekrar eden hata, son görülme, zorluk ve güven sinyalleri doğrulandı.
- Doğru ve hızlı, ipucusuz “Eminim” cevabının aralığı uzattığı test edildi.
- Yanlış, ipuçlu ve tekrar eden hatanın 10–120 dakikalık kısa tekrar ürettiği test edildi.
- Uzun zaman sonra doğru hatırlamanın `stability` değerini daha fazla güçlendirdiği test edildi.
- Kuyruk önceliğinin düşük ustalık, yüksek zorluk ve tekrar eden hatayla yükseldiği test edildi.

### Tekrar biçimleri

Mock kelime kaydıyla aşağıdaki biçimlerin kart üretimi ve cevap değerlendirmesi test edildi:

- `DE_TO_TR`
- `TR_TO_DE`
- `LISTEN_WRITE`
- `FILL_BLANK`
- `SENTENCE_ORDER`
- `SPEAK`
- `NEW_SENTENCE`
- Ek destek olarak `ARTICLE` ve `PLURAL`

### Prisma ve migration

- Prisma şemasındaki model blokları ve süslü parantez dengesi kontrol edildi.
- `AdaptiveReviewAttempt` modeli ve User ilişkisi doğrulandı.
- Yeni kelime ve öğrenme hedefi alanları doğrulandı.
- Migration içindeki indeks adları Prisma'nın beklenen otomatik adlarıyla eşleştirildi; drift riski azaltıldı.
- Migration'da `DROP TABLE`, `DROP COLUMN`, `TRUNCATE` veya `DELETE FROM` bulunmadığı doğrulandı.
- Migration yalnızca kolon, tablo, ilişki ve indeks ekliyor.

## Sayısal örnek test

Aynı başlangıç hafıza durumu için:

- Güçlü doğru cevap: **18 gün**, ustalık **56**, sinyal puanı **1.000**
- Zor, ipuçlu, tekrar eden yanlış: **57 dakika**, ustalık **22**, sinyal puanı **0.000**

Bu sonuçlar, güçlü geri çağırmanın aralığı büyüttüğünü ve riskli hatanın yakın tekrara alındığını doğruluyor.

## Canlı ortamda doğrulanacaklar

Bu çalışma ortamında Deutschimo'nun tüm `node_modules` klasörü ve canlı PostgreSQL bağlantısı bulunmadığı için aşağıdakiler Vercel Preview deployment'ında doğrulanmalıdır:

1. `prisma migrate deploy`
2. V28.1 schema drift kontrolü
3. Tam Next.js typecheck/build
4. Prisma Client'ın yeni model ve alanlarla üretilmesi
5. Gerçek test kullanıcısıyla yedi tekrar biçiminin uçtan uca çalışması

Paketin V28.1 güvenli deployment akışı bu kontrollerden biri başarısız olursa yayın işlemini durdurur.
