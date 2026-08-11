# Deutschimo V46.7 — Database Integrity & Migration Safety

## Amaç

V46.7 production veritabanında veri silmeden şu riskleri denetler ve yayın kapısına bağlar:

- foreign key / orphan kayıt riski
- unique constraint ve duplicate kayıtlar
- duplicate progress / completion / mastery / daily plan
- kritik nullable / required alanlar
- cascade / restrict delete davranışı
- transaction gerektiren read-modify-write akışları
- Fresh Database → migrations → seed → application start
- Existing V45/V46 schema → V46.7 migration → veri korunumu

## Mevcut şemada bulunan temel durum

V46.7 incelemesinde mevcut şemada Enrollment, UserUnitProgress, DailyStudyPlan, Mastery snapshot/queue, writing revision, Real Germany progress/attempt ve CMS revision için önemli unique korumalarının zaten bulunduğu doğrulandı.

Buna karşılık V37/V38 Mastery tablolarında userId/courseId alanları fiziksel FK değildi. `UserUnitProgress.courseId` de Course FK'sı değildi. V46.7 bunları additive foreign key'lerle güçlendirir.

### Legacy unitId sınırı

V45/V46 test/legacy veri akışında `unitId` değerleri bulunmasına rağmen karşılık gelen `Unit` satırları her zaman oluşturulmuyor. Bu nedenle V46.7, `unitId -> Unit` FK'sını zorla eklemez. Böyle bir FK mevcut veriler üzerinde destructive olmayan fakat deployment'ı engelleyen uyumluluk sorunları üretebilir.

V46.7 bunun yerine:

- unitId orphan/logical-reference sayılarını **read-only** raporlar,
- course/unit uyuşmazlığını raporlar,
- hiçbir kaydı otomatik silmez veya yeniden yazmaz,
- daha sonraki içerik/Unit normalizasyonu için görünür teknik borç olarak bırakır.

## Yeni FK politikası

- `UserUnitProgress.courseId -> Course.id`: `ON DELETE RESTRICT`
- Mastery `userId -> User.id`: `ON DELETE CASCADE`
- Mastery `courseId -> Course.id`: `ON DELETE RESTRICT`

Böylece kullanıcı hesabı kontrollü olarak silindiğinde kullanıcıya ait mastery kayıtları orphan kalmaz; ancak kurs silme işlemi öğrenme geçmişini sessizce yok edemez.

## Duplicate koruması

V46.7 integrity checker aşağıdaki anahtarları kontrol eder:

- Enrollment `(userId, courseId)`
- UserUnitProgress `(userId, unitId)` — progress/completion
- DailyStudyPlan `(userId, planDate)`
- MasteryAttempt `eventKey`
- MasterySkillSnapshot `(userId, scopeKey, skill)`
- MasteryTopicSnapshot `(userId, scopeKey, tag)`
- MasteryReviewQueueItem `(userId, courseId, questionId, skill)`
- WritingCoachAttempt `(sessionId, revisionNumber)`
- RealGermanyScenarioProgress `(userId, scenarioId)`
- RealGermanyScenarioAttempt `(progressId, attemptNumber)`
- CmsContentRevision `(contentId, version)`

Checker SELECT-only çalışır. Duplicate bulursa production verisini silmez; deployment'ı durdurur ve manuel inceleme ister.

## Transaction incelemesi

- `/api/progress`: çoklu progress/enrollment/session yazımları zaten transaction içinde; korunur.
- Mastery evidence: attempt + snapshot + topic + review queue zaten transaction içinde; korunur. V46.7 ayrıca course referansını DB'den canonical olarak doğrular.
- Writing Coach: revision/session/error/profile/plan yan etkileri zaten transaction içindedir; korunur.
- Real Germany draft PATCH: tek atomik upsert olduğu için ekstra transaction gerekli değildir.
- Daily Plan PATCH: daha önce read → JSON değiştir → update şeklindeydi. V46.7 bunu transaction + `SELECT ... FOR UPDATE` row lock ile yarış durumlarına karşı korur.

## Migration güvenliği

Yeni migration:

`20260811123000_v46_7_database_integrity`

özellikleri:

- sadece foreign key ekler ve validate eder,
- `DROP TABLE` yok,
- `DROP COLUMN` yok,
- `TRUNCATE` yok,
- `DELETE FROM` yok,
- veri backfill/update yok,
- orphan/duplicate otomatik temizleme yok.

**Destructive migration: YOK.**

## Production yayın sırası

Vercel build zinciri V46.7 ile şu sıraya gelir:

1. migration SQL safety scan
2. database integrity preflight (SELECT-only)
3. mevcut `db-deploy.mjs` / `prisma migrate deploy`
4. database integrity assert
5. Prisma generate / Next.js build
6. V46.7 static validator

Preflight veri sorunu bulursa migration uygulanmadan deployment durur.

## Fresh DB CI

GitHub Actions PostgreSQL 16 üzerinde:

`Fresh DB → prisma migrate deploy → seed → integrity assert → build → npm start → /api/health`

akışını doğrular.

## Existing V45/V46 DB upgrade CI

Repository'de V44 sonrasında V45/V46 için ayrı Prisma migration bulunmadığından, “Existing V45/V46 schema” mevcut V46.7 migration'ından önceki tüm migration zinciri anlamına gelir.

CI bu zinciri geçici PostgreSQL veritabanına uygular, sentinel kullanıcı/progress/completion/daily-plan/mastery verisi ekler, V46.7 migration'ını uygular ve migration öncesi/sonrası veri fingerprint'inin değişmediğini doğrular.

Test yalnızca `DATABASE_ENVIRONMENT=test` ve localhost/ephemeral PostgreSQL hedefinde çalışabilir.

## Production kuralı

V46.7 hiçbir koşulda production veritabanında otomatik:

- reset,
- db push,
- delete,
- truncate,
- duplicate merge,
- orphan cleanup

yapmaz. Sorun varsa build/deploy **fail closed** olur.
