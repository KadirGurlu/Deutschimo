# Deutschimo V13 — Beceri Laboratuvarları

## Genel
V12 öğrenme zekâsı ve V12.1 güvenlik altyapısı korunarak dört temel dil becerisi ayrı laboratuvarlara dönüştürüldü.

## Dinleme Laboratuvarı
- A1–B2 için 12 günlük ve akademik dinleme görevi.
- Metin görünmeden ilk dinleme.
- Ana fikir ve ayrıntı sorularının tek tek gösterilmesi.
- İkinci dinleme aşaması.
- Almanca transkript ve Türkçe çeviri.
- Bilinmeyen kelimeleri kişisel kelime defterine ekleme.
- Sonuçların PostgreSQL hesabına kaydedilmesi.

## Konuşma Laboratuvarı
- A1–B2 için 12 konuşma görevi.
- Mikrofon üzerinden Almanca konuşma ve tarayıcı tabanlı yazıya dönüştürme.
- Görev başarısı, kelime kullanımı, akıcılık ve anlaşılırlık puanları.
- Hedef kelime ve eksik içerik analizi.
- Model yanıtı Almanca sesle dinleme.
- Tarayıcı desteklemiyorsa metni elle düzenleyerek değerlendirme.

## Okuma Laboratuvarı
- A1–B2 için 12 özgün metin.
- Mesaj, ilan, e-posta, haber, görüş yazısı ve araştırma özeti türleri.
- Ana fikir ve ayrıntı soruları.
- Sorulardan sonra açılan Türkçe çeviri.
- Metinden kişisel kelime defterine kayıt.

## Yazma Laboratuvarı
- A1–B2 için 12 görev.
- A1: form, kısa mesaj, kendini tanıtma.
- A2: davet, randevu değişikliği, gezi anlatımı.
- B1: şikâyet, görüş, deneyim.
- B2: tartışma, grafik yorumlama, rapor.
- Dört ölçüt: görev başarısı, dil bilgisi, kelime kullanımı, metin düzeni.
- Göreve özel kontrol listesi, temel düzeltme örüntüleri ve model metin.
- Yerel taslak kaydı ve sunucuya sonuç kaydı.

## Kişisel Kelime Defteri
- Dinleme ve okuma laboratuvarlarından kelime ekleme.
- Artikel, çoğul, Türkçe anlam ve örnek cümle görüntüleme.
- Almanca sesli okuma.
- Kaynağa göre istatistik ve kelime silme.

## Öğrenme Zekâsı Entegrasyonu
- Dashboard'a dört beceri özeti eklendi.
- Günlük kişisel plana seviye bazlı dinleme veya konuşma görevi eklenebilir.
- Beceri çalışmaları kullanıcı aktivitesine ve gelişim geçmişine kaydedilir.

## Veritabanı
Yeni tablolar:
- `SkillLabAttempt`
- `VocabularyNotebookItem`

Mevcut kullanıcılar, ders ilerlemeleri, V12 öğrenme zekâsı ve V12.1 güvenlik kayıtları korunur.
