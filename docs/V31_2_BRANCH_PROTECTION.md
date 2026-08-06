# V31.2 GitHub Branch Protection

`main` için önerilen kurallar:
- Pull request zorunlu
- En az bir onay
- Branch güncel olmalı
- Zorunlu status check: `Deutschimo V31.2 Release Readiness / release-readiness`
- Force push ve branch silme kapalı
- Doğrudan Production deploy yerine GitHub `production` environment onayı
- Production secrets yalnızca bu environment içinde
