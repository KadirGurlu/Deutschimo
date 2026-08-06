# Deutschimo V31.1 – 7 Günlük Kontrol Listesi

Her gün Production ve Preview deployment'larını kontrol edin. Aşağıdaki kapıların tamamı başarılıysa günlük kayıt oluşturun.

## Günlük kontrol

- [ ] Ana sayfa açılıyor.
- [ ] Yeni kullanıcı kaydı tamamlanıyor.
- [ ] Kullanıcı giriş yapabiliyor.
- [ ] Kullanıcı çıkış yapabiliyor.
- [ ] Dashboard açılıyor.
- [ ] Sidebar bağlantılarının tamamı açılıyor.
- [ ] Production build başarılı.
- [ ] Playwright testleri başarılı.
- [ ] Preview ve Production veritabanı ayrımı doğrulandı.
- [ ] Kritik hata sayısı 0.

## Günlük kayıt komutu

```bash
npm run stability:report -- record --build=pass --e2e=pass --db-separation=pass --critical-errors=0 --note="Gunluk Production ve Preview kontrolu tamamlandi"
```

Durum:

```bash
npm run stability:report -- status
```

Son yedi takvim gününün tamamında build, E2E ve veritabanı ayrımı başarılı; kritik hata sayısı sıfır olduğunda stabilite kapısı geçilir. Yerel kayıtlar `.stability/v31-1/` altında tutulur ve Git'e eklenmez.
