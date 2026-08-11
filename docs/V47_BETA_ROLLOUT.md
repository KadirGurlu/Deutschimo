# V47 Controlled Beta Rollout

Stages:
1. Internal testing
2. 10-25 beta users
3. 50-100 users
4. Limited public beta
5. Public launch

Metrics per stage:
- registration success
- login success
- onboarding completion
- level-test completion
- first lesson completion
- time to first learning success
- API/runtime error rate
- D1/D7 retention where consent exists
- support/content-error requests

Release blockers:
- P0: data loss, auth unavailable, authorization bypass, DB unavailable, critical migration failure, critical page unavailable, learning-progress corruption.
- P1: broken admin workflow, severe performance regression, major mobile issue, analytics completely unavailable.
- P2: important non-blocking defects.
- P3: cosmetic/low-impact defects.

Feature flags support internal users and deterministic percentage rollout. Prefer 5% -> 25% -> 50% -> 100% only after metrics remain healthy.
