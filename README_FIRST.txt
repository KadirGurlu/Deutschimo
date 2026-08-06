DEUTSCHIMO V31 — COMPLETE RECOVERY PACKAGE
============================================

Bu paket V28.1, V28.3, V28.4, V29, V29.2, V30.1, V30.2 ve V31 dosyalarını
tek pakette birleştirir. Önceki parça parça hotfix'ler bu pakete dahildir.

EN GÜVENLİ YÜKLEME YÖNTEMİ
--------------------------
1. ZIP dosyasını tamamen ayıklayın.
2. INSTALL_V31_COMPLETE_RECOVERY.bat dosyasına çift tıklayın.
3. Deutschimo repository klasörünüzün tam yolunu yapıştırın.
   Örnek:
   C:\Users\kadir\OneDrive\Documents\GitHub\Deutschimo
4. Kurulum tamamlandığında GitHub Desktop'ı açın.
5. Değişiklikleri kontrol edin.
6. Commit mesajı:
   Apply Deutschimo V31 Complete Recovery
7. Commit to v29-staging -> Push origin yapın.
8. Eski deployment'a Redeploy basmayın. Yeni commit'in açtığı Preview deployment'ı bekleyin.

ÖNEMLİ
------
- Kurulum scripti klasörleri silmez; yalnızca dosyaları ekler veya günceller.
- PATCH_ROOT klasörünü repository içine klasör olarak taşımayın.
- Repository içindeki app, lib, prisma gibi klasörleri elle silmeyin.
- Yeni environment variable zorunlu değildir.
- Veritabanını sıfırlamayın ve eski migration dosyalarını silmeyin.

PAKETİN KAPSADIĞI KRİTİK DÜZELTMELER
-------------------------------------
- Eksik vocabulary ve intelligence review route'ları
- Eksik placement assessment route'u
- Eksik Writing Coach sayfası ve API route'u
- Eksik Real Germany sayfası, progress ve evaluate route'ları
- V29.2 Prisma JSON InputJsonValue dönüşüm düzeltmesi
- V30.2 Real Germany JSON okuma düzeltmesi
- V31 devices API kesin Response dönüş tipi
- Real Germany progress API gövde boyutu sınırı
- V31 migration, güvenlik başlıkları, API v1, cihaz ve idempotency altyapısı
- V28.1–V31 doğrulama dosyaları ve gerekli geçmiş migration'lar

Doğrulama sonucu VALIDATION_RESULTS.txt dosyasındadır.
