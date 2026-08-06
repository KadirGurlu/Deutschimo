# V31.2 Backup ve Restore

- Günlük workflow, PostgreSQL custom dump üretir ve dosyayı belleğe yüklemeden AES-256-GCM akışıyla şifreler.
- Her Production migration öncesinde ayrı `pre-migration` backup zorunludur.
- Şifre anahtarı dosyaya/repoya yazılmaz; yalnızca GitHub Production environment secret'ından okunur.
- Şifreli dosyanın SHA-256 checksum'u, IV ve GCM doğrulama etiketi ayrı manifestte tutulur.
- Backup ve manifest GitHub Actions artifact olarak 30 gün saklanır.
- Haftalık restore tatbikatı yalnızca izole sentetik veritabanında çalışır.
- Restore; checksum ve GCM bütünlüğünü doğrulamadan başlamaz.
- `database-restore.mjs` Production hedefini ve açık onay bulunmayan restore işlemini teknik olarak reddeder.

Gerçek felaket kurtarma sırasında önce uygulama trafiği durdurulur, yeni boş veritabanı hazırlanır, şifreli backup doğrulanır ve kontrollü restore yapılır. Mevcut Production DB üzerine doğrudan restore edilmez.
