# Deutschimo V14 doğrulama raporu

## Kapsam

- Gelişmiş kelime kayıt alanları
- Yedi tekrar türü
- Dört aralıklı tekrar değerlendirmesi
- Tekrar planlama algoritması
- Kelime defteri düzenleme ekranı
- Dashboard özeti
- Prisma modelleri ve veri dışa aktarımı
- TypeScript/TSX sözdizimi taraması

## Doğrulanan kritik noktalar

- `VocabularyReviewAttempt` modeli mevcut.
- Mevcut `VocabularyNotebookItem` kayıtlarını koruyan varsayılan alanlar eklendi.
- `Unuttum`, `Zor`, `İyi`, `Çok kolay` seçenekleri farklı tekrar aralıkları üretir.
- Yanlış cevapta `İyi` veya `Çok kolay` seçimi güvenli biçimde `Unuttum` planına düşürülür.
- Artikel ve çoğul gibi eksik veriye bağlı görevler yalnızca uygun kelimelerde gösterilir.
- Hesap dışa aktarımı ve şifreli veritabanı yedeği tekrar geçmişini içerir.

## Sınırlama

Çalışma ortamındaki npm paket deposu `@auth/prisma-adapter` paketini sağlamadığı için tam Next.js production build yerel olarak çalıştırılamadı. Nihai Prisma üretimi, veritabanı şema güncellemesi ve Next.js build Vercel tarafından gerçekleştirilecektir.
