DEUTSCHIMO V31 GLOBALS.CSS FIX

Hata:
Module not found: Can't resolve './globals.css'

Bu paket eksik app/globals.css dosyasını geri getirir.
Dosya, Deutschimo repository'sinin main dalındaki mevcut globals.css sürümünden alınmıştır.

Yükleme:
1. ZIP'i ayıklayın.
2. İçindeki app klasörünü Deutschimo repository ana klasörüne kopyalayın.
3. Klasörleri birleştirin. Mevcut app klasörünü silmeyin.
4. GitHub Desktop'ta yalnızca app/globals.css dosyasının Added/New olduğunu doğrulayın.
5. Commit mesajı: Restore Deutschimo global stylesheet
6. Commit to v29-staging -> Push origin
7. Eski deployment'a Redeploy basmayın; yeni commit'in oluşturduğu Preview deployment'ı bekleyin.

Not:
- app/layout.tsx dosyasını yeniden değiştirmeyin.
- Migration veya environment variable değişikliği gerekmez.
- SWC lockfile satırı uyarıdır; bu build'i durduran hata değildir.
