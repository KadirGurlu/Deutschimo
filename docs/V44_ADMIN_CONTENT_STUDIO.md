# Deutschimo V44 — Admin Content Studio

V44'ün amacı içerik operasyonunu JSON/TypeScript dosyası ve browser localStorage bağımlılığından çıkarmaktır.

## Yeni içerik modeli
- Kurs
- Ünite
- Ders
- Kelime
- Soru
- Dinleme

## Yayın akışı
Taslak → İncelemede → Yayına hazır → Yayında

## Sürümleme
Her create/update işlemi CmsContentRevision kaydı üretir.

## Soru pasife alma
Sorular silinmeden active=false yapılabilir; öğrenciye gösterilmez, geçmiş korunur.

## Legacy Gold Standard
Mevcut A1 12, A2 16, B1 18, B2 20 ünite kaybolmaz.
Katalog ilk admin erişiminde CmsContentRecord kayıtlarına bağlanır.
Ünite açıldığında ders/soru/kelime/dinleme kayıtları kademeli materialize edilir.

## Öğrenci akışı
useContentStore(unitId), /api/content/unit/[unitId] üzerinden published CMS içeriğini alır.
CMS olmayan ünitelerde eski static içerik fallback olarak çalışır.

## Kalite
A1 12/12 Gold
A2 16/16 Gold
B1 18/18 Gold
B2 20/20 Gold

## Migration
20260809163500_v44_admin_content_studio

Yeni environment variable yok.
V43 verileri ve Mastery/Review yapıları korunur.
