# Deutschimo V10 — Seviyeye Uygun Doğal Örnekler

## Amaç

V10, ders kartlarında görülen yapay, tekrar eden ve seviyeye uygun olmayan Almanca örnekleri kaldırır. İçerik üretimi artık her ünitenin iletişim hedefi ve CEFR düzeyine göre ayrı örnek bankalarından beslenir.

## Başlıca değişiklikler

- `Der Ausdruck ... ist in diesem Thema wichtig.` kalıbı kaldırıldı.
- `Wir verwenden das Verb ...` kalıbı kaldırıldı.
- Türkçe ünite başlığını Almanca cümle içine yerleştiren örnekler kaldırıldı.
- A1 için kısa, somut ve günlük cümle sınırı getirildi.
- A2 örnekleri gündelik plan, geçmiş, alışveriş, sağlık, resmî işlemler ve gelecek bağlamlarına uyarlandı.
- B1 örnekleri deneyim, gerekçe, süreç, görüş ve resmî iletişim bağlamlarına göre yazıldı.
- B2 örnekleri akademik temkin, kanıt, veri, müzakere ve karmaşık metin yapılarıyla eşleştirildi.
- 66 ünitenin tamamına özgü olumlu, olumsuz ve soru cümlesi bankası eklendi.
- A1 seviyesindeki 96 temel kelime ve ifade için elle yazılmış doğal Almanca örnek ve Türkçe çeviri eklendi.
- Kelime kartlarının geri kalanında seviye ve kelime türüne göre güvenli, doğal yedek örnek üretimi eklendi.
- A1 örneklerinde Türkçe kişi adları yerine Anna, Sophie, Jonas, Lukas, Marie ve Felix gibi Almanca konuşulan ülkelerde yaygın isimler kullanıldı.
- Eski admin içerik önbelleğinin V10 içeriklerini ezmemesi için içerik storage anahtarı `deutschimo-content-v10` olarak güncellendi.

## A1 örnek dönüşümü

Eski:

```text
Der Ausdruck „Hallo“ ist in diesem Thema wichtig.
Wir verwenden das Verb „kommen“ in einem eigenen Satz.
Ich übe Kennenlernen und Begrüßung heute nicht allein.
Welche Wendung brauchst du bei Kennenlernen und Begrüßung?
```

Yeni:

```text
Hallo, ich bin Anna.
Ich komme aus Hamburg.
Ich heiße nicht Paul.
Woher kommen Sie?
```

## Teknik değişiklikler

- Yeni dosya: `data/v10-example-bank.ts`
- Güncellenen dosya: `lib/learning/content-enrichment.ts`
- Güncellenen çağrı: `data/slides.ts`
- Güncellenen içerik: `data/curriculum-content.json`
- Güncellenen storage sürümü: `lib/storage/learning-storage.ts`
- Yeni doğrulama: `scripts/validate-v10.mjs`
