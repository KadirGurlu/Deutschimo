# V28.3 Akıllı Tekrar 2.0 — Teknik ve pedagojik tasarım

## 1. Hafıza durumu

Her kelime veya öğrenme hedefi için aşağıdaki durum tutulur:

- `mastery`: 0–100 ustalık
- `easeFactor`: aralığın büyüme katsayısı
- `intervalDays`: mevcut gün aralığı
- `stability`: bilginin uzun süreli istikrarı
- `retrievability`: son denemeden sonraki tahmini geri çağırılabilirlik
- `confidenceScore`: öğrencinin güven seçimi ile gerçek doğruluğunun kalibrasyonu
- `sameErrorStreak`: aynı hedefte art arda hata
- `hintUseCount`: toplam ipucu kullanımı
- `averageResponseMs`: ağırlıklı ortalama cevap süresi
- `nextReviewAt`: bir sonraki tekrar zamanı

## 2. Sinyal puanı

Planlayıcı önce 0–1 arasında bir `signalScore` üretir. Doğru cevap taban puanı yükseltir; hızlı cevap, ipucusuz çözüm ve doğru “Eminim” seçimi puanı artırır. İpucu, yavaş cevap, yüksek zorluk ve tekrar eden hata aralığı kısaltır.

Özellikle şu durum ayrı değerlendirilir:

> Öğrenci “Eminim” seçip yanlış cevap verirse bu yalnızca bilgi hatası değil, güven kalibrasyonu hatasıdır.

Bu durumda ustalık ve güven puanı daha güçlü güncellenir ve hedef daha yakın tekrar edilir.

## 3. Zamanlama

### Yanlış cevap

- Doğru seri sıfırlanır.
- Hata ve lapse sayısı artar.
- Aynı hata serisi artar.
- Zorluk ve tekrar sayısına göre 10–120 dakika içinde yeniden gösterilir.

### Doğru cevap

- Önceki aralık, kolaylık katsayısı, sinyal puanı, zorluk, güven ve ipucu katsayılarıyla çarpılır.
- İlk tekrarlar daha kontrollü büyür.
- Aralık en az 1, en fazla 365 gündür.

## 4. Kuyruk önceliği

Aynı anda birden fazla tekrar bekliyorsa öncelik şu bileşenlerle hesaplanır:

- Ne kadar geciktiği
- Ustalığın düşüklüğü
- Zorluk
- Aynı hata serisi
- Geçmiş ipucu kullanımı
- Ortalama cevabın hedef süreden yavaş olması

Böylece yalnızca tarihi en eski kart değil, öğrenme riski en yüksek kart önce gelir.

## 5. Tekrar biçimi seçimi

Kelimenin sahip olduğu verilere göre kullanılabilir biçimler otomatik açılır:

| Biçim | Gerekli veri | Değerlendirme |
|---|---|---|
| Almanca → Türkçe | Kelime + çeviri | Tam eşleşme |
| Türkçe → Almanca | Kelime + çeviri | Kelime veya artikel + kelime |
| Dinle → Yaz | Kelime | Ses sentezi + yazılı cevap |
| Boşluğu doldur | Kelimeyi içeren örnek | Eksik kelime |
| Cümleyi sırala | En az 3 kelimelik örnek | Cümlenin normalize edilmiş tam sırası |
| Sesli söyle | Kelime | Dinle + üret + öz değerlendirme |
| Yeni cümlede kullan | Örnek/kelime | Kelimenin geçtiği anlamlı yeni cümle + öz değerlendirme |

## 6. Kelime dışındaki öğrenme hedefleri

Kişisel Akıllı Tekrar sayfasındaki gramer, okuma, iletişim ve diğer hedefler `CompetencyRecord` üzerinden ayrı izlenir. Her hedef için aynı planlama alanları kullanılır. Kavram görevleri artık ders notunu açıp tek tıkla bitmez; öğrenci kendi Almanca örneğini üretir.

## 7. Analitik

`AdaptiveReviewAttempt` tablosu her denemede şunları saklar:

- Alan: `VOCABULARY` veya `SMART_REVIEW`
- Hedef ve öğrenme hedefi kodu
- Mod
- Doğruluk
- Süre
- İpucu
- Güven
- Zorluk
- Tekrar eden hata sayısı
- Sinyal puanı
- Yeni tekrar tarihi

Bu yapı ileride FSRS benzeri parametre kalibrasyonu, soru zorluğu analizi ve öğrenciye özel model eğitimi için temel oluşturur.
