# Deutschimo V20 — Sade Ana Sayfa ve Google ile Giriş

## Ana sayfa ve header

- Üst menüdeki **Kurslar**, **Seviyeler** ve **Sınav Hazırlık** bağlantıları kaldırıldı.
- Header yalnızca marka, **Giriş Yap**, **Kayıt Ol** ve oturum açmış kullanıcı araçlarını gösterir.
- Hero alanındaki **Seviyeleri İncele** butonu kaldırıldı.
- “Seviyeni seç ve başla” kartındaki A1, A2, B1 ve B2 seçeneklerinin tamamı kayıt sayfasına yönlendirilir.
- Seçilen seviye kayıt formundaki “Mevcut seviye” alanına otomatik aktarılır.
- Alt seviye kartları da aynı kayıt akışını kullanır.
- Öğrenme yolu kartındaki “Ders anlatımı → alıştırma → ünite ilerlemesi” satırı kaldırıldı.
- Ana CTA tek ve net bir **Kayıt Ol** eylemine indirildi.

## Giriş ve kayıt akışı

- Header’daki **Giriş Yap** bağlantısı artık `/auth?mode=login` adresini açar ve sayfa doğrudan giriş sekmesiyle başlar.
- **Kayıt Ol** bağlantıları `/auth?mode=register` adresini açar.
- Auth sekmeleri seçildiğinde URL modu da güncellenir.
- Kayıt formundaki seviye seçimi ana sayfadaki tercihi korur.
- Şifre alanı V12.1 güvenlik politikasına uygun olarak en az 12 karakter bilgisini gösterir.

## Google hesabı

- Kayıt ve giriş ekranına Google markalı **Google ile devam et** butonu eklendi.
- Auth.js Google provider yapılandırması aktif ortam değişkenleriyle çalışır.
- Google’ın `email_verified` alanı kontrol edilir.
- Doğrulanmış Google e-postası, aynı e-postayla oluşturulmuş mevcut Deutschimo hesabına güvenli biçimde bağlanabilir.
- OAuth hataları kullanıcıya anlaşılır Türkçe mesajlarla gösterilir.

## Veri güvenliği

- Veritabanı şeması değiştirilmedi.
- Mevcut kullanıcılar, şifreler, kurs ilerlemeleri ve öğrenme verileri korunur.
- Yeni Google kullanıcıları mevcut Prisma Adapter ve varsayılan STUDENT/A1/B2 alanlarıyla oluşturulur.
