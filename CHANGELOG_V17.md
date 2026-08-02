# Deutschimo V17.0 — Ölçme Altyapısı

V17.0, V16'daki 66 üniteyi ölçülebilir öğrenme hedeflerine bağlar. Bu sürüm yeni ders içeriği eklemek yerine öğrencinin hangi kazanımı ne ölçüde öğrendiğini güvenilir biçimde kaydetmek için temel altyapıyı kurar.

## Eklenen özellikler

- A1–B2 bütün üniteler için öğrenme hedefi kataloğu
- Dil bilgisi, kelime, iletişim, okuma, dinleme, yazma ve konuşma beceri etiketleri
- Her alıştırma ve quiz sorusu için:
  - Öğrenme hedefi kodu
  - Konu etiketleri
  - 1–5 zorluk düzeyi
  - Bilişsel düzey
  - Tahmini çözüm süresi
- Her cevabın PostgreSQL'e ölçme kanıtı olarak kaydedilmesi
- Öğrenme hedefi bazlı yetkinlik puanı
- Kanıt sayısına göre güven puanı
- Doğru/yanlış sayıları ve ortalama cevap süresi
- Yanlış cevapların kişisel hata geçmişine eklenmesi
- Aynı sorunun daha sonra doğru yapılmasıyla hatanın otomatik çözülmesi
- Yeni Yetkinlik Haritası ekranı
- Yeni Hata Geçmişi ekranı
- Dashboard'da kişisel yetkinlik özeti

## Yeni adresler

- `/competency`
- `/mistakes`

## Yeni API rotaları

- `POST /api/assessment/evidence`
- `GET /api/assessment/overview`

## Yeni veritabanı tabloları

- `AssessmentEvidence`
- `CompetencyRecord`
- `LearningErrorHistory`

## Veri güvenliği

V17.0 mevcut kullanıcı, parola, kurs ilerlemesi, kelime defteri, laboratuvar, güvenlik ve V16 içerik verilerini silmez. `prisma db push` yalnızca yeni enum, tablo ve ilişkileri ekler.
