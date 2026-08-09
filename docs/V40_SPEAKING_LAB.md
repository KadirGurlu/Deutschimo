# Deutschimo V40 — Konuşma Laboratuvarı

V40, Beceri Laboratuvarı içindeki Konuşma Laboratuvarını gerçek bir üretim ve
geri bildirim döngüsüne dönüştürür.

## Temel akış

1. Seviyeye uygun gerçek yaşam görevi seç.
2. İletişim hedeflerini ve hazırlık iskeletini gör.
3. Model yanıtı dinle.
4. Mikrofonla Almanca konuş.
5. Tarayıcının oluşturduğu transkripti kontrol et.
6. İletişim odaklı değerlendirme al.
7. Doğal kullanım ve gramer/yapı önerilerini gör.
8. Aynı görevi yeniden kaydet veya sonraki göreve geç.

## Değerlendirme

Sayısal metrikler:

- Görevi tamamlama
- Anlaşılırlık
- Akıcılık
- Kelime seçimi
- Gramer

Genel iletişim başarısı bu beş metriğin ağırlıklı birleşimidir.

## Telaffuz kararı

V40, tarayıcı konuşma tanıma güvenini tek başına bir “telaffuz puanı” olarak
kullanmaz. Telaffuz bölümü üç nitel banttan birini verir:

- CLEAR — genel olarak anlaşılır görünüyor
- CHECK — bazı bölümleri yeniden söyle
- RETRY — kayıt koşullarını ve anlaşılabilirliği kontrol et

Bu geri bildirim fonetik uzman değerlendirmesi değildir. Mikrofon, ortam gürültüsü
ve tarayıcı konuşma tanıma sistemi sonucu etkileyebilir.

## Doğal kullanım

Görev bankası belirli kalıplar için bağlama uygun doğal alternatifler içerir.
Örneğin öğrenci randevu bağlamında:

`Ich möchte einen Termin vereinbaren.`

derse sistem uygun olduğunda:

`Ich würde gern einen Termin vereinbaren.`

alternatifini sunabilir.

## İçerik

Toplam 16 özgün görev:

- A1: 4
- A2: 4
- B1: 4
- B2: 4

V13'ten beri kullanılan 12 mevcut speaking taskId korunur; böylece geçmiş
SkillAttempt kayıtları anlamsız hale gelmez. Her seviyeye bir yeni görev eklenir.

## Teknik kapsam

- Yeni Prisma migration yok.
- Yeni Vercel environment variable yok.
- Ses dosyası sunucuya yüklenmez.
- Mevcut `/api/skills/attempts` kayıt akışı kullanılır.
- Mevcut V37 Mastery bridge korunur.
- V39.1 technical hardening tabanı korunur.
