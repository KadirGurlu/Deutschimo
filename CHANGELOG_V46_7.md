# Deutschimo V46.7 — Database Integrity & Migration Safety

- DB integrity preflight/assert katmanı eklendi.
- Duplicate progress/mastery/daily plan/completion kontrolleri eklendi.
- Mastery user/course ve progress course FK'ları güçlendirildi.
- Legacy unitId orphan riski görünür audit uyarısına dönüştürüldü; otomatik veri düzeltme yapılmıyor.
- Daily plan concurrent PATCH transaction + row lock ile korundu.
- Mastery course referansı canonical DB kaydına doğrulanıyor.
- Migration destructive SQL içermiyor.
- Fresh DB ve V45/V46-schema upgrade CI senaryoları eklendi.
