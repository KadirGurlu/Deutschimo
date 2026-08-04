# Deutschimo V28.4 — Gerçek Seviye Testi Tasarımı

## 1. Ürün akışı

Öğrenci Seviye Testi sayfasına girdiğinde iki seçenek görür:

1. **Hızlı Test:** Yaklaşık başlangıç seviyesi ve dört alanda ön profil.
2. **Ayrıntılı Test:** Altı beceri için ayrı sonuç ve kişisel eksik tamamlama planı.

Testler tek soruluk akışta ilerler. Öğrenci önceki göreve dönebilir. Son görev tamamlandığında sonuç veritabanına kaydedilir, kullanıcının önerilen seviyesi güncellenir ve günlük planın yeniden üretilmesi için eski günlük plan kaydı temizlenir.

## 2. Soru dağılımı

### Hızlı test — 16 görev

Her seviyeden birer gramer, kelime, okuma ve dinleme görevi:

- A1: 4 görev
- A2: 4 görev
- B1: 4 görev
- B2: 4 görev

### Ayrıntılı test — 36 görev

- Gramer: 8
- Kelime: 8
- Okuma: 8
- Dinleme: 8
- Yazma: 2
- Konuşma: 2

Objektif görevlerde A1, A2, B1 ve B2 düzeylerinin her birinden iki görev bulunur.

## 3. Dinleme

Dinleme metinleri istemcide Almanca ses profiliyle okunur:

- Dil: `de-DE`
- Hız: 0.82
- Her görev için en fazla üç oynatma
- Almanca ses varsa otomatik tercih

Bu sürüm tarayıcı konuşma sentezini kullanır. İleriki sürümde profesyonel insan sesleri veya kontrollü ses dosyalarıyla değiştirilebilir.

## 4. Yazma ve konuşma

### Yazma

Öğrenci görevde istenen Almanca metni yazar. Arayüz minimum kelime sayısını gösterir.

### Konuşma

Desteklenen tarayıcılarda Web Speech Recognition ile Almanca konuşma transkripte dönüştürülür. Öğrenci transkripti kontrol edebilir. Desteklenmeyen tarayıcılarda yanıt elle yazılabilir.

### Otomatik ön değerlendirme

Serbest üretim yanıtları şu sinyallerle puanlanır:

- Hedef uzunluğa yaklaşma
- Göreve ait temel içeriklerin bulunması
- Cümle sayısı
- Bağlaç kullanımı
- Kelime çeşitliliği
- Minimum uzunluğun altında kalma cezası

Bu puan dilbilgisel hata analizi veya insan değerlendirmesi yerine geçmez. Sonuç ekranında bu sınır açıkça belirtilir.

## 5. Sonuç hesabı

### Beceri puanları

Her beceri 0–100 arasında hesaplanır ve şu bantlardan birine çevrilir:

- A1
- A1+
- A2
- A2+
- B1
- B1+
- B2

### Genel seviye

Hızlı testte ölçülen dört becerinin ortalaması kullanılır.

Ayrıntılı testte:

- Beceri ortalaması: %72 ağırlık
- En zayıf beceri: %28 ağırlık

Bu yapı, çok güçlü birkaç alanın ciddi bir zayıflığı tamamen gizlemesini engeller.

Genel skor şu bantlardan birine çevrilir:

- A1.1
- A1.2
- A2.1
- A2.2
- B1.1
- B1.2
- B2.1
- B2.2

## 6. Eksik tamamlama planı

Sistem yalnızca testte ölçülen becerileri düşükten yükseğe sıralar ve en zayıf dört alan için görev oluşturur. Her plan kartı şunları içerir:

- Beceri
- Çalışma başlığı
- Açıklama
- Günlük dakika hedefi
- Öncelik
- İlgili çalışma sayfası

Hızlı testte yazma ve konuşma ölçülmediği için bu iki alan yapay biçimde sıfır kabul edilmez ve hızlı test planına eklenmez.

## 7. Veritabanı

`PlacementAssessment` modeline şu alanlar eklenir:

- `mode`
- `skillScores`
- `skillLevels`
- `studyPlan`
- `writtenSamples`
- `speakingSamples`
- `overallBand`
- `confidenceScore`
- `durationSeconds`

Mevcut test kayıtları `mode=QUICK` varsayılanıyla korunur.

## 8. Güvenlik

- Objektif doğru cevaplar istemciye gönderilmez.
- Serbest üretim puanlama anahtarları istemciye gönderilmez.
- Fazladan gönderilen görev kimlikleri yok sayılır.
- Zorunlu görevler eksikse kayıt yapılmaz.
- Yanıt uzunluğu sınırlandırılır.
- Yeni sonuçtan sonra günlük plan yeniden hesaplanmak üzere geçersizleştirilir.

## 9. Gelecek geliştirme alanları

- Profesyonel insan sesli dinleme bankası
- Fonem bazlı telaffuz değerlendirmesi
- CEFR rubriğiyle öğretmen onayı
- Testi durdurup devam etme
- Adaptif soru seçimi ve erken durdurma
- Madde güçlüğü ve ayırt edicilik analizi
- Test sorusu performans paneli
