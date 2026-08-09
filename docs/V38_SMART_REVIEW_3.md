# Deutschimo V38 — Akıllı Tekrar 3.0

## Amaç

V38, V28.3'te kurulan uyarlanabilir tekrar motorunu V37 Mastery Engine'e bağlar.

Bir yanlış cevap artık yalnızca "tekrar edilecek öğe" değildir. Sistem tekrar önceliğini ve tekrar biçimini şu sinyallerle üretir:

1. Son doğru cevap tarihi
2. Son yanlış cevap tarihi
3. Yanıt süresi / ortalama yanıt süresi
4. Hata sayısı
5. Becerinin türü ve beceri ustalığı
6. Zorluk seviyesi
7. Son tekrar tarihi
8. Güven seviyesi
9. Benzer topic/tag performansı

## Dört fazlı tekrar döngüsü

1. **Hatırlama (RECALL)** — bilgiyi ipucusuz geri çağır.
2. **Cümle (SENTENCE)** — bilgiyi cümle bağlamında kullan.
3. **Üretim (PRODUCTION)** — seçenek yerine kendi Almanca cümleni üret.
4. **Karşılaştırma (CONTRAST)** — karıştırılabilecek biçimleri ayırt et.

Doğru cevapta faz bir sonraki biçime ilerler ve V28.3 scheduler'ın verdiği sonraki tekrar tarihine taşınır.
Yanlış cevapta öğe Hatırlama fazına döner ve V28.3 kısa tekrar aralığı korunur.

## Her yanlış otomatik kuyruğa girer

V37 `recordMasteryEvidence()` içinde, `correct === false` olan öğrenme kanıtı V38 kuyruğuna yazılır.

Kapsanan V37 kaynakları:
- Exercise / Unit Quiz
- Beceri Laboratuvarı
- Vocabulary Review
- Placement
- Writing Coach
- Real Germany
- Assessment
- V37 Mastery API

`PROGRESS` / kurs tamamlama V38 ustalık kanıtı değildir.

## Veri modeli

Yeni model: `MasteryReviewQueueItem`

Önemli alanlar:
- `skill`
- `tags`
- `phase`
- `dueAt`
- `priorityScore`
- `failureCount`
- `successCount`
- `lastCorrectAt`
- `lastIncorrectAt`
- `lastResponseMs`
- `averageResponseMs`
- `confidenceLabel`
- `difficulty`
- `masteryScore`
- `similarTopicScore`
- `lastReviewedAt`

## Öncelik

V38 öncelik puanı şu riskleri birlikte kullanır:
- düşük mastery
- benzer topiclerde zayıflık
- tekrarlayan hata
- yüksek zorluk
- yavaş cevap
- yüksek güvenle yanlış cevap
- uzun tekrar boşluğu

V28.3 scheduler korunur; V38 onun yerine geçmez, Mastery bağlamıyla üst katman oluşturur.

## Güvenlik / migration

Migration yalnız `MasteryReviewQueueItem` tablosunu ve indekslerini ekler.

Yok:
- DROP TABLE
- DROP COLUMN
- TRUNCATE
- DELETE FROM

`updatedAt` alanında database `DEFAULT CURRENT_TIMESTAMP` kullanılmaz. Böylece V37'de çözülen Prisma schema-drift problemi tekrarlanmaz.

## Preview kabul testi

1. Yeni V38 Preview `Ready` olmalı.
2. `/smart-review` açılmalı.
3. Header `V38 · AKILLI TEKRAR 3.0` göstermeli.
4. Bir öğrenci yanlış soru çözdükten sonra V38 queue kaydı oluşmalı.
5. Tekrar kartında faz ve Mastery sinyalleri görünmeli.
6. Doğru tekrar fazı ilerletmeli.
7. Yanlış tekrar fazı `RECALL`'a döndürmeli.
8. V28.3 confidence/hint kontrolleri çalışmaya devam etmeli.
9. `/mastery` V37 sayfası çalışmaya devam etmeli.
10. Kurs ilerleme yüzdesi Mastery/Smart Review puanı olarak kullanılmamalı.
