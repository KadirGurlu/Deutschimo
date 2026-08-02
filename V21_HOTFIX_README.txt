Deutschimo V21.0.1 Hotfix

Düzeltilen hata:
components/vocabulary/vocabulary-sets-center.tsx dosyasında hem hazır set filtresinin setter fonksiyonu hem de yeni set formunun seviye state'i "setLevel" adını kullanıyordu. Bu, Webpack derlemesinde "Identifier 'setLevel' has already been declared" hatasına yol açıyordu.

Kurulum:
1. Bu ZIP'i çıkartın.
2. İçindeki components klasörünü GitHub Desktop'ta Repository > Show in Explorer ile açtığınız Deutschimo ana klasörüne kopyalayın.
3. Hedefteki dosyayı değiştirin.
4. Commit mesajı: Fix V21 duplicate setLevel declaration
5. Commit to main > Push origin
6. Vercel yeni deployment'ı otomatik başlatacaktır.
