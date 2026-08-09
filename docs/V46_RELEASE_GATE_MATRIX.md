# V46 Release Gate Matrix

| Alan | Otomasyon | Başarı kriteri |
|---|---|---|
| V45 regression | validate:v45 + a11y:v45 | PASS |
| V46 contract | validate:v46 + audit:v46 | PASS |
| Auth guard | Playwright V46.1 | PASS |
| Registration | Playwright V46.1 | PASS |
| Duplicate email | Browser + Prisma count | Tek kullanıcı |
| Login/logout | Playwright V46.1 | PASS |
| Onboarding persistence | Browser + Prisma | PASS |
| Placement bridge | Browser | PASS |
| A1-A2-B1-B2 pages | Playwright V46.2 | HTTP < 400 |
| Unit progress | API E2E | 100% state korunur |
| Duplicate completion | API E2E | Duplicate ID yok |
| Refresh persistence | Browser/API | PASS |
| Cross-browser persistence | İkinci context | PASS |
| Published content boundary | Content API | Published 200 / unknown 404 |
| Mastery evidence | Real skills attempt | Snapshot oluşur |
| Low mastery | Prisma | <= 40 test sinyali |
| Smart Review | Prisma | ACTIVE queue |
| Personal Learning | API | LISTENING signal |
| Same-day Daily Plan | API + Prisma | Duplicate plan yok |
| Duplicate review debt | Prisma | Count stabil |
| Listening unsupported browser | Browser simulation | Recoverable UX |
| Accessible transcript | Browser | Görünür |
| Mic permission denied | Browser simulation | Recoverable UX |
| Manual speaking fallback | Browser | Kullanılabilir |
| Skill attempt HTTP error | 503 simulation | UI çökmez |
| Mobile overflow | 390px Chromium | <= 4px |
| DB schema | v46-db-readiness | Kritik tablolar var |
| Security | security:release | PASS |
| TypeScript | tsc | PASS |
| Production build | Next.js | PASS |
| Performance | perf:v45 | Bundle bütçesi PASS |

V46 = RELEASE READY ancak bütün zorunlu otomatik kapılar yeşil olduğunda kabul edilir.
Gerçek production açılışı için manuel V45 accessibility/performance checklist ayrıca tamamlanmalıdır.
