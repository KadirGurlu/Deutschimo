# V31.2 Hata Kodları

Biçim: `ALAN-İŞLEM-0000`.

Örnekler:
- `AUTH-LOGIN-0042`: hatalı/uygun olmayan oturum bilgisi
- `AUTH-REGISTER-0001`: kayıt işlemi tamamlanamadı
- `API-ROUTE-xxxx`: yakalanmamış API hatası
- `API-HTTP_4xx-xxxx`: başarısız API yanıtı
- `UI-RENDER-xxxx`: React render hatası

Kullanıcı hata kodunu görür; başarısız API yanıtlarında kod `x-error-code` başlığında da bulunur. Yönetici `/admin/errors` ekranında rota, işlem, zaman, tekrar sayısı, gizlilik korumalı etkilenen oturum sayısı, mesaj ve request ID görür.

Hata raporları saatlik IP-hash tabanlı sınıra sahiptir. E-posta, parola, token, authorization, cookie, session, secret, API anahtarı ve veritabanı bağlantı bilgileri kayıt öncesinde maskelenir; ham IP saklanmaz.
