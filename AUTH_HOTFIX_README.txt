Deutschimo V11 Auth.js / Prisma Adapter Hotfix

Duzeltilen hata:
- @auth/prisma-adapter ile next-auth tarafinda iki farkli @auth/core tipinin kurulmasi
- AdapterUser icin uygulamaya ozel alanlarin zorunlu tanimlanmasi

Degisen dosyalar:
- package.json
- auth.ts
- types/next-auth.d.ts

GitHub Desktop ile bu dosyalari mevcut Deutschimo klasorunun uzerine kopyalayin,
commit edin ve Push origin yapin. Vercel yeni deployment baslatir.
