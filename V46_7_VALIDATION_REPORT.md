# V46.7 Validation Report

## Statik inceleme sonucu

- Existing unique constraints: progress, daily plan, mastery snapshots/queue, completion/revision kayıtları için mevcut.
- Eksik fiziksel ownership FK'ları: Mastery user/course ve UserUnitProgress course ilişkileri.
- Legacy unitId referansları: bazı test/legacy akışlarda Unit satırı olmadan kullanılabildiği için V46.7'de fiziksel FK'ya zorlanmadı; read-only audit uyarısı olarak ele alındı.
- Daily plan PATCH: read-modify-write yarış riski bulundu; transaction + row lock eklendi.
- Progress: transaction zaten mevcut.
- Mastery: transaction zaten mevcut; course canonical DB doğrulaması eklendi.
- Writing Coach: çoklu veri güncellemeleri transaction içinde.

## Migration

Migration: `20260811123000_v46_7_database_integrity`

Destructive migration: **YOK**.

Migration herhangi bir öğrenci kaydını otomatik silmez, birleştirmez veya güncellemez. Preflight duplicate/orphan bulursa fail olur.

## CI kapıları

- Fresh Database → migrations → seed → application start
- Existing pre-V46.7 (V45/V46 schema) → sentinel data → preflight → V46.7 migration → integrity assert → fingerprint unchanged

Bu iki canlı PostgreSQL testi GitHub Actions üzerinde çalıştırılmalıdır. Local APPLY dosyası production/preview database'e migration uygulamaz.
