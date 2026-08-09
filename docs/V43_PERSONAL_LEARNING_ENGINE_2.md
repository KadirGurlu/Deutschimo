# Deutschimo V43 — Kişisel Öğrenme Motoru 2.0

V43'ün amacı V32 onboarding profilini pasif kullanıcı bilgisi olmaktan çıkarıp
günlük çalışma planının gerçek girdilerinden biri haline getirmektir.

## Girdiler

Motor şu sinyalleri birlikte değerlendirir:

1. V32 onboarding
   - seviye
   - öğrenme hedefi
   - günlük dakika
   - haftalık çalışma günü
   - geliştirilmek istenen beceriler

2. V37 Mastery Engine
   - altı becerinin ustalık puanı
   - kanıt sayısı
   - güven seviyesi
   - son kanıt tarihi

3. V38 Akıllı Tekrar
   - zamanı gelmiş mastery review maddeleri
   - tekrar borcu

4. Açık hata geçmişi
   - çözülmemiş hata sayısı
   - beceri alanı

5. V39/V40 Beceri Laboratuvarları
   - son 21 gündeki skorlar
   - tekrar sayısı
   - son çalışma zamanı

6. Kelime sistemi
   - zamanı gelmiş kişisel kelime tekrarları

## Cold-start ilkesi

Kullanıcı yeni olduğunda sistem ölçülmemiş bir beceriye "zayıf" demez.

Veri kapsamı %50'nin altındaysa:

PROFILE_LED

modu kullanılır. Onboarding hedefleri daha etkili olur ve bütün becerilere
keşif payı bırakılır.

Yeterli gerçek kanıt oluştuğunda:

ADAPTIVE

moduna geçilir.

## Tek kötü sonuca aşırı tepki yok

Bir tek düşük Beceri Laboratuvarı sonucu günlük planı tek başına değiştiremez.

Recent-score etkisi:
- 1 sonuç: düşük güven
- 2 sonuç: orta güven
- 3+ sonuç: tam ağırlık

Mastery zayıflığı da snapshot confidence ile sönümlenir.

## 30 dakikalık örnek

Profil:

A2
Almanya'da yaşamak
30 dakika / gün
5 gün / hafta
Konuşma gelişim odağı

Yeterli performans kanıtı yoksa veya ciddi bir zayıflık yoksa:

8 dk — A2 ana ünite
7 dk — Akıllı tekrar / kelime
8 dk — Konuşma
7 dk — Dinleme

Toplam: 30 dk

## Ertesi gün dinleme güvenilir biçimde zayıfsa

Örneğin:
- en az iki düşük listening lab sonucu
veya
- düşük mastery + yeterli confidence
veya
- çoklu açık hata
veya
- yüksek tekrar borcu

plan geçici olarak:

12 dk — Dinleme
8 dk — Ana ders
5 dk — Tekrar
5 dk — İkinci öncelikli beceri

şeklinde dağıtılabilir.

Toplam yine 30 dakikadır.

## Neden ana ders tamamen kaybolmuyor?

Kişiselleştirme müfredatın yerine geçmez.

COURSE_CONTINUITY sebep kodu ana kurs ilerlemesine korumalı bir pay bırakır.
Böylece sistem yalnız zayıflıklara koşup öğrenciyi kur ilerlemesinden koparmaz.

## Öğrenme hedefi etkisi

GERMANY_LIFE:
- konuşma
- dinleme
- kelime

UNIVERSITY:
- okuma
- yazma
- dinleme

WORK:
- konuşma
- yazma
- dinleme

TESTDAF:
- okuma
- yazma
- dinleme
- gramer

TELC:
- konuşma
- dinleme
- yazma
- okuma

GOETHE:
- dört temel beceri arasında daha dengeli

IMPROVE:
- performans sinyallerine daha fazla alan bırakır

## Açıklanabilirlik

Öğrenci şunları görebilir:

- plan modu
- veri kapsamı
- altı becerinin öncelik skoru
- bugün hangi becerinin neden öne çıktığı
- her görevin plana girme nedeni

Ayrıca:

GET /api/intelligence/personal-learning

yalnız oturumdaki kullanıcının V43 karar özetini döndürür.

## Gün içi stabilite

Plan her sayfa yenilemesinde değişmez.

Aynı gün:
- mevcut v43 planı korunur.

Yeni gün:
- yeni Mastery / review / lab / hata verileriyle yeniden hesaplanır.

Kullanıcı isterse "Planı yeniden hesapla" ile bilinçli refresh yapabilir.

## Veritabanı

Yeni Prisma modeli yok.
Yeni migration yok.

Mevcut:
- LearnerOnboardingProfile
- DailyStudyPlan.tasks JSON
- MasterySkillSnapshot
- MasteryReviewQueueItem
- LearningErrorHistory
- SkillLabAttempt
- VocabularyNotebookItem

kullanılır.

## Sürüm notu

Roadmap talebi gereği paket sürümü 40.0.0'dan 43.0.0'a geçer.
V41/V42 bu paketin teknik bağımlılığı değildir.
