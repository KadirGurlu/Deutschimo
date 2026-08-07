# Deutschimo V32.0 — Akıllı Onboarding

## Amaç
Yeni kullanıcıyı kayıt sonrası doğrudan karmaşık öğrenci paneline bırakmak yerine, beş kısa adımda kişisel başlangıç planı oluşturmak.

## Akış
1. Almanca seviyesi: Hiç bilmiyorum, Biraz biliyorum, A1, A2, B1, B2, Emin değilim.
2. Emin değilim seçeneği mevcut V28.4 seviye testine bağlanır. Test onboarding'i tek başına tamamlamaz; sonuç V32 planında kullanılır.
3. Öğrenme amacı seçilir: Almanya'da yaşamak, Üniversite, İş hayatı, Günlük Almanca, TestDaF, TELC, Goethe veya genel gelişim.
4. Günlük süre: 10, 20, 30, 45, 60+ dakika.
5. Haftalık çalışma sıklığı: 3, 4, 5, 6 gün veya her gün.
6. Öncelikli beceriler: Kelime, Gramer, Okuma, Dinleme, Yazma, Konuşma.
7. Sistem başlangıç seviyesi, haftalık dakika, tahmini kurs tamamlama süresi ve öncelikleri içeren kişisel planı kaydeder.

## Veri modeli
`LearnerOnboardingProfile` kullanıcı başına tek kayıt tutar. Taslak seçimler onboarding boyunca kaybolmaz. Tamamlama sırasında `User.currentLevel`, `User.dailyGoalMinutes` ve `User.onboardingCompleted` atomik transaction içinde güncellenir.

## Tahmini süre
V32.0 tahmini, Deutschimo kurs içi çalışma saatlerine göre kaba bir başlangıç tahminidir; CEFR yeterliliği veya sınav başarısı garantisi değildir. A1 için 25 saatlik kurs içi çalışma baz alınır; 30 dakika × 5 gün örneği yaklaşık 10 hafta verir.

## Geriye uyumluluk
V31.2 kritik E2E testi yeni onboarding davranışına göre güncellenmiştir. V31.2 validator 32.0.0 sürümünü de kabul edecek şekilde kurulum sırasında yamalanır.
