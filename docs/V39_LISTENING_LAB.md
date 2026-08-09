# Deutschimo V39 — Dinleme Laboratuvarı

## Hedef

V33–V36 Gold Standard içeriklerinde bulunan 66 dinleme metnini, Beceri Laboratuvarı içindeki gerçek bir dinleme çalışma sistemine dönüştürmek.

Kapsam:

- A1: 12 ünite
- A2: 16 ünite
- B1: 18 ünite
- B2: 20 ünite
- Toplam: 66 Gold Standard dinleme görevi

## V39 akışı

### 0. Dinlemeden önce

Öğrenci metni görmez.

Ünitenin kelime havuzundan 5–7 anahtar kelime gösterilir. Amaç metni önceden okumak değil; ses içinde kritik sözcükleri daha hızlı tanımaktır.

### 1. Aktif dinleme

Her görevde:

- Normal hız
- %75 hız
- Tekrar dinle
- Durdur

A1 normal rate: 0.84
A2 normal rate: 0.91
B1 normal rate: 1.00
B2 normal rate: 1.04

%75 modu bu normal rate'in %75'idir.

A1–A2 kontrollü öğrenen temposunda kalır.
B1–B2 doğal konuşmaya yakın normal tempo kullanır.

Tarayıcıdaki Almanca `speechSynthesis` sesi kullanılır; yeni ücretli TTS API'si gerekmez.

### 2. Anlama

Her Gold Standard görevinde dört dinleme boyutu bulunur:

1. Ana fikir
2. Detay
3. Çıkarım
4. Konuşmacının tutumu

V33–V36'nın özgün `listeningQuestions` soruları detay havuzunun çekirdeğini oluşturur.
V39 ana fikir, çıkarım ve tutum katmanlarını ekler.

### 3. Dikte modu

- Hedef cümle görünmez.
- Öğrenci cümleyi dinler.
- Almanca olarak yazar.
- Noktalama/büyük-küçük harf normalize edilir.
- Levenshtein tabanlı yazım benzerliği hesaplanır.
- Kontrolden sonra doğru cümle gösterilir.

Dikte segment uzunluğu CEFR düzeyine göre ayarlanır.

### 4. Shadowing

Döngü:

1. Metne bakmadan dinle
2. Cümleyi gör ve sesli tekrar et
3. Yeniden dinle
4. Sonraki segmente geç

V39 shadowing **telaffuza otomatik puan vermez**. Mikrofon tabanlı telaffuz skoru eklenmeden kullanıcıya sahte doğruluk puanı gösterilmez. V39 yalnızca çalışma döngüsünün tamamlanmasını izler.

### 5. Transkript kontrolü

Anlama + dikte + shadowing bittikten sonra:

- Almanca transkript
- Türkçe çeviri
- Anahtar kelimeler
- Kişisel kelime defterine ekleme

açılır.

### 6. Puan

Toplam Dinleme yeterliği:

- %70 anlama soruları
- %20 dikte
- %10 shadowing döngüsü tamamlama

Shadowing yüzdesi telaffuz puanı değildir.

## Mastery

Mevcut `/api/skills/attempts` akışı korunur.

LISTENING skill attempt kaydedildiğinde V37 `captureMasteryExchange` köprüsü sonucu Mastery Engine'e iletmeye devam eder. V39 feedback içinde ayrıca:

- listeningScore
- comprehensionScore
- dictationScore
- shadowingCompletion
- questionResults
- unitId
- sourceVersion

tutulur.

Bu sürüm yeni Prisma migration gerektirmez.

## Gold Standard kaynağı

V39 mevcut Deutschimo içeriklerini yeniden kullanır:

- V33 A1 enrichment
- V34 A2 enrichment
- V35 B1 enrichment
- V36 B2 enrichment

Dinleme metinleri ve çekirdek sorular yeniden kopyalanmaz; runtime adapter bu mevcut dosyaları laboratuvar görevine dönüştürür. Böylece içerik ile laboratuvar arasında iki ayrı kopya oluşmaz.

## Preview kabul testi

1. `/skills` açılır.
2. Dinleme Laboratuvarı kartı dikte + shadowing özelliklerini gösterir.
3. `/listening` açılır.
4. A1/A2/B1/B2 sekmelerinde sırasıyla 12/16/18/20 görev görünür.
5. Anahtar kelimeler metinden önce görünür.
6. Transkript ilk dinleme aşamasında görünmez.
7. Normal hız çalışır.
8. %75 hız çalışır.
9. Tekrar dinle çalışır.
10. Ana fikir etiketi görünür.
11. Detay etiketi görünür.
12. Çıkarım etiketi görünür.
13. Konuşmacının tutumu etiketi görünür.
14. Dikte alanı ses dinlemeden hedef cümleyi göstermez.
15. Dikte kontrolü benzerlik yüzdesi üretir.
16. Shadowing üç adımlı döngüyle ilerler.
17. Son aşamada transkript ve Türkçe çeviri açılır.
18. Çalışma kaydedilir.
19. Skills overview'da LISTENING çalışma sayısı artar.
20. `/mastery` üzerinde Dinleme becerisi mevcut sistemi kullanmaya devam eder.
