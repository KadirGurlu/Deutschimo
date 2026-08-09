# V45 Final Manual Checklist

Bu liste V45/V46 yol haritasının sonunda gerçek cihaz ve tarayıcılarla uygulanacaktır.

## Sayfalar

- [ ] Dashboard
- [ ] Kurslar
- [ ] En az bir A1 dersi
- [ ] En az bir B2 dersi
- [ ] Seviye Testi
- [ ] Akıllı Tekrar
- [ ] Günlük Plan
- [ ] Dinleme Laboratuvarı
- [ ] Konuşma Laboratuvarı
- [ ] Yazma Koçu
- [ ] Profil
- [ ] Admin
- [ ] Admin Content Studio
- [ ] Admin Kalite Merkezi

## Klavye

- [ ] Yalnız Tab / Shift+Tab / Enter / Space / Esc ile ana akışlar tamamlanabiliyor.
- [ ] Odak sırası mantıklı.
- [ ] Hiçbir odak görünmez değil.
- [ ] Skip-link ana içeriğe taşıyor.
- [ ] Açılır menü/modal varsa klavye tuzağı oluşmuyor.
- [ ] Focus sabit header/sidebar altında tamamen kaybolmuyor.

## Görsel

- [ ] Normal metin kontrastı en az 4.5:1.
- [ ] Büyük metin kontrastı en az 3:1.
- [ ] UI component/focus sınırları yeterli kontrasta sahip.
- [ ] %200 zoom kullanılabilir.
- [ ] 320 CSS px genişlikte yatay zorunlu scroll yok (uygun istisnalar hariç).
- [ ] Renk tek başına bilgi taşımıyor.

## Formlar

- [ ] Her input'un label/accessible name'i var.
- [ ] Hata yalnız renk ile anlatılmıyor.
- [ ] Hatalı alan programatik olarak işaretleniyor.
- [ ] Hata mesajı alanla ilişkilendiriliyor.
- [ ] Giriş/kayıt akışı erişilebilir kimlik doğrulama açısından manuel kontrol edildi.

## Screen reader

- [ ] Heading hiyerarşisi.
- [ ] Navigation/main/aside landmark'ları.
- [ ] Icon-only kontrollerin accessible name'i.
- [ ] Dinamik sonuç/status mesajları okunuyor.
- [ ] Soru seçenekleri grup ve seçili durumuyla okunuyor.
- [ ] Almanca/Türkçe dil geçişleri uygun `lang` ile okunuyor.

## Dinleme / Konuşma

- [ ] Dinleme metin alternatifi erişilebilir.
- [ ] Transkript klavye ile açılabiliyor.
- [ ] Mikrofon kayıt durumu ekran okuyucuya anlaşılır.
- [ ] Mikrofon reddedildiğinde elle devam alternatifi var.
- [ ] Sesli içerikte durdur/tekrar/hız kontrolleri klavye ile çalışıyor.

## Mobil

- [ ] Ana touch hedefleri rahat kullanılabiliyor.
- [ ] 24x24 px altına düşen kritik kontrol yok.
- [ ] Sidebar/menu küçük ekranda taşmıyor.
- [ ] Form alanları ve butonlar üst üste binmiyor.

## Performans / Vercel Speed Insights

Her yüzey için LCP, INP, CLS ve trafik yeterliyse trend karşılaştırması:

- [ ] Dashboard
- [ ] Kurslar
- [ ] Ders
- [ ] Test
- [ ] Günlük Plan
- [ ] Admin

Kontrol sırasında regresyon bulunursa yeni büyük özellik eklenmeden önce düzeltilecektir.
