# V47 Cache and Performance Policy

Private user data must never be shared through a public cache.

Private/no-store surfaces include:
- dashboard
- progress
- daily plan
- smart review
- profile
- admin operations

Published course content may use cache/revalidation where the existing content architecture supports it. After admin publish/edit, prefer targeted `revalidateTag` or `revalidatePath` rather than a broad cache purge.

V47 keeps the V46 Core Web Vitals thresholds and adds a regression budget file for:
- bundle growth
- large images
- API latency
- database latency
- LCP/INP/CLS/TTFB

Database audit warnings are review signals; V47 does not automatically rewrite queries.
