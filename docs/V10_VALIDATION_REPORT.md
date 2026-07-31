# V10 Doğrulama Raporu

## Kontrol edilen kapsam

- 66 ünite: A1 12, A2 16, B1 18, B2 20
- Her ünite için ayrı olumsuz cümle bankası
- Her ünite için ayrı soru cümlesi bankası
- A1 düzeyinde 96 kelime/ifade için özel örnek cümle
- Almanca örneklerin Türkçe karşılıkları
- Yasaklanan yapay kalıplar
- A1 cümle uzunluğu
- Türkçe kişi adlarının Almanca öğretim örneklerinde bulunmaması
- Değiştirilen TypeScript dosyalarının strict tip kontrolü

## Sonuçlar

| Kontrol | Sonuç |
|---|---|
| Ünite örnek bankası | 66 / 66 başarılı |
| A1 özel kelime örnekleri | 96 / 96 başarılı |
| `Der Ausdruck ...` kalıbı | 0 |
| `Wir verwenden das Verb ...` kalıbı | 0 |
| Yapay Türkçe ünite başlıklı Almanca cümle | 0 |
| A1 örneklerinde 12 kelimeyi aşan cümle | 0 |
| Türkçe kişi adı bulunan Almanca örnek | 0 |
| Boş Almanca/Türkçe örnek çifti | 0 |
| Değiştirilen TypeScript kaynakları | Strict kontrol başarılı |

## Çalıştırılan komutlar

```bash
node scripts/validate-v10.mjs
tsc -p tsconfig.v10check.json
```

Tam `npm run build`, çalışma ortamının özel npm kayıt servisinde `@types/node` paketinin bulunmaması nedeniyle burada çalıştırılamadı. Vercel production build'i son kontrolü gerçekleştirecektir.
