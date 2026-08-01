# Deutschimo V12.1 — Stabilizasyon ve Güvenlik

- Günlük cron tabanlı, AES-256-GCM şifreli özel Blob yedekleri
- Sistem hatası ve başarısız API isteği kayıtları
- Giriş, kayıt ve şifre sıfırlama hız sınırları
- 12 karakterli güçlü şifre politikası
- Yönetici rol/durum/test etiketi/silme denetim geçmişi
- Kullanıcı veri dışa aktarma, şifre değiştirme ve kendi hesabını silme
- KVKK, gizlilik, çerez ve kullanım koşulu sayfaları
- Test kullanıcılarının ayrı işaretlenmesi ve filtrelenmesi
- Build sırasında varsayılan seed kaldırıldı; güvenli isteğe bağlı bootstrap eklendi
- Güvenlik başlıkları, global hata ekranı ve günlük bakım temizliği

## Önemli
Gerçek dış ortam yedeği için Vercel projesine **Private Blob** bağlanmalı ve `BACKUP_ENCRYPTION_KEY` ile `CRON_SECRET` tanımlanmalıdır. Aynı veritabanında tutulan kopya gerçek yedek sayılmaz; bu sürüm bu nedenle şifrelenmiş dosyayı ayrı Blob depolamasına yazar.

## OIDC Blob uyumluluğu
- Vercel içindeki yedekleme, bağlı Private Blob mağazasında OIDC ve `BLOB_STORE_ID` ile çalışır.
- `BLOB_READ_WRITE_TOKEN` yalnızca Vercel dışındaki çalışma ortamları için isteğe bağlı geri dönüş olarak desteklenir.
