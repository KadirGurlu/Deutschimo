import type { PlacementQuestion, PlacementSkill, PlacementTestMode } from "@/types/intelligence";

const option = (id: string, label: string) => ({ id, label, value: label });

function mc(args: Omit<PlacementQuestion, "kind">): PlacementQuestion {
  return { ...args, kind: "MULTIPLE_CHOICE" };
}

function listening(args: Omit<PlacementQuestion, "kind" | "skill">): PlacementQuestion {
  return { ...args, kind: "LISTENING", skill: "LISTENING" };
}

export const detailedPlacementQuestions: PlacementQuestion[] = [
  mc({
    id: "v284-g-a1-01", level: "A1", topic: "sein fiili", skill: "GRAMMAR",
    prompt: "Cümleyi tamamla: Ich ___ heute müde.",
    options: [option("a", "bin"), option("b", "bist"), option("c", "ist"), option("d", "sind")],
    correctAnswer: "bin", explanation: "sein fiili ich öznesiyle bin biçimini alır.",
  }),
  mc({
    id: "v284-g-a1-02", level: "A1", topic: "Fiil çekimi", skill: "GRAMMAR",
    prompt: "Doğru cümleyi seç.",
    options: [option("a", "Du wohnst in Köln."), option("b", "Du wohnen in Köln."), option("c", "Du wohnt in Köln."), option("d", "Du wohne in Köln.")],
    correctAnswer: "Du wohnst in Köln.", explanation: "wohnen fiili du öznesiyle wohnst olur.",
  }),
  mc({
    id: "v284-g-a2-01", level: "A2", topic: "Perfekt", skill: "GRAMMAR",
    prompt: "Doğru Perfekt cümlesini seç.",
    options: [option("a", "Wir haben gestern gekocht."), option("b", "Wir sind gestern gekocht."), option("c", "Wir haben gestern kochen."), option("d", "Wir gestern gekocht haben.")],
    correctAnswer: "Wir haben gestern gekocht.", explanation: "kochen fiilinin Perfekt biçimi haben + gekocht yapısıyla kurulur.",
  }),
  mc({
    id: "v284-g-a2-02", level: "A2", topic: "Yan cümlede fiil", skill: "GRAMMAR",
    prompt: "Doğru weil cümlesini seç.",
    options: [option("a", "Ich bleibe zu Hause, weil ich krank bin."), option("b", "Ich bleibe zu Hause, weil ich bin krank."), option("c", "Ich bleibe, weil krank ich bin, zu Hause."), option("d", "Weil bin ich krank, bleibe ich zu Hause.")],
    correctAnswer: "Ich bleibe zu Hause, weil ich krank bin.", explanation: "weil yan cümlesinde çekimli fiil sona gider.",
  }),
  mc({
    id: "v284-g-b1-01", level: "B1", topic: "Relativsatz", skill: "GRAMMAR",
    prompt: "Doğru relatif cümleyi seç.",
    options: [option("a", "Das ist die Kollegin, die in Berlin arbeitet."), option("b", "Das ist die Kollegin, sie arbeitet in Berlin."), option("c", "Das ist die Kollegin, den in Berlin arbeitet."), option("d", "Das ist die Kollegin, arbeitet die in Berlin.")],
    correctAnswer: "Das ist die Kollegin, die in Berlin arbeitet.", explanation: "Feminin Nominativ relatif zamiri die olur ve fiil sona gider.",
  }),
  mc({
    id: "v284-g-b1-02", level: "B1", topic: "Passiv", skill: "GRAMMAR",
    prompt: "Aktif cümle: „Die Techniker reparieren die Anlage.“ Doğru Passiv cümlesi hangisidir?",
    options: [option("a", "Die Anlage wird von den Technikern repariert."), option("b", "Die Anlage hat repariert."), option("c", "Die Techniker werden die Anlage."), option("d", "Die Anlage ist reparieren.")],
    correctAnswer: "Die Anlage wird von den Technikern repariert.", explanation: "Präsens Passiv werden + Partizip II ile kurulur.",
  }),
  mc({
    id: "v284-g-b2-01", level: "B2", topic: "Konjunktiv I", skill: "GRAMMAR",
    prompt: "Dolaylı anlatım için doğru cümleyi seç.",
    options: [option("a", "Der Sprecher erklärte, die Lage sei stabil."), option("b", "Der Sprecher erklärte, die Lage ist stabil gewesen sein."), option("c", "Der Sprecher erkläre, stabil die Lage."), option("d", "Die Lage erklärte der Sprecher sei stabil.")],
    correctAnswer: "Der Sprecher erklärte, die Lage sei stabil.", explanation: "Konjunktiv I, aktarılan söze mesafe koyan dolaylı anlatım biçimidir.",
  }),
  mc({
    id: "v284-g-b2-02", level: "B2", topic: "Nominalisierung", skill: "GRAMMAR",
    prompt: "„Die Stadt erweitert das Verkehrsnetz.“ cümlesinin uygun nominal biçimi hangisidir?",
    options: [option("a", "Die Erweiterung des Verkehrsnetzes durch die Stadt"), option("b", "Das Erweitern sind Verkehrsnetz"), option("c", "Die Stadt der Erweiterung Verkehrsnetz"), option("d", "Verkehrsnetz erweitert die Stadt")],
    correctAnswer: "Die Erweiterung des Verkehrsnetzes durch die Stadt", explanation: "Fiil isimleştirilmiş, nesne Genitiv ile ve yapan kişi durch ile aktarılmıştır.",
  }),

  mc({
    id: "v284-v-a1-01", level: "A1", topic: "Artikel", skill: "VOCABULARY",
    prompt: "“Name” kelimesinin doğru artikeli hangisidir?",
    options: [option("a", "der Name"), option("b", "die Name"), option("c", "das Name"), option("d", "den Name")],
    correctAnswer: "der Name", explanation: "Name sözcüğü maskulindir ve der artikeliyle kullanılır.",
  }),
  mc({
    id: "v284-v-a1-02", level: "A1", topic: "Günlük fiiller", skill: "VOCABULARY",
    prompt: "“einkaufen” fiilinin Türkçe karşılığı hangisidir?",
    options: [option("a", "alışveriş yapmak"), option("b", "uyumak"), option("c", "çalışmak"), option("d", "yüzmek")],
    correctAnswer: "alışveriş yapmak", explanation: "einkaufen, alışveriş yapmak anlamına gelir.",
  }),
  mc({
    id: "v284-v-a2-01", level: "A2", topic: "Ev arama", skill: "VOCABULARY",
    prompt: "“eine Wohnung besichtigen” ne demektir?",
    options: [option("a", "Bir evi gezip görmek"), option("b", "Bir evi temizlemek"), option("c", "Bir evi kiraya vermek"), option("d", "Bir evden taşınmak")],
    correctAnswer: "Bir evi gezip görmek", explanation: "besichtigen bir yeri incelemek veya gezip görmek anlamına gelir.",
  }),
  mc({
    id: "v284-v-a2-02", level: "A2", topic: "Sağlık", skill: "VOCABULARY",
    prompt: "“einen Termin vereinbaren” ifadesinin anlamı hangisidir?",
    options: [option("a", "Randevu ayarlamak"), option("b", "Randevuyu unutmak"), option("c", "İlaç satın almak"), option("d", "Hastaneden çıkmak")],
    correctAnswer: "Randevu ayarlamak", explanation: "einen Termin vereinbaren, randevu kararlaştırmak anlamına gelir.",
  }),
  mc({
    id: "v284-v-b1-01", level: "B1", topic: "İş başvurusu", skill: "VOCABULARY",
    prompt: "“sich um eine Stelle bewerben” ne anlama gelir?",
    options: [option("a", "Bir pozisyona başvurmak"), option("b", "İşten ayrılmak"), option("c", "Maaş ödemek"), option("d", "Toplantıyı ertelemek")],
    correctAnswer: "Bir pozisyona başvurmak", explanation: "sich bewerben um, iş veya eğitim başvurularında kullanılan temel kalıptır.",
  }),
  mc({
    id: "v284-v-b1-02", level: "B1", topic: "Görüş bildirme", skill: "VOCABULARY",
    prompt: "“etwas in Betracht ziehen” ifadesinin en yakın anlamı hangisidir?",
    options: [option("a", "Bir şeyi değerlendirmeyi düşünmek"), option("b", "Bir şeyi kesin olarak reddetmek"), option("c", "Bir şeyi unutmak"), option("d", "Bir şeyi gizlemek")],
    correctAnswer: "Bir şeyi değerlendirmeyi düşünmek", explanation: "in Betracht ziehen, bir seçeneği dikkate almak anlamına gelir.",
  }),
  mc({
    id: "v284-v-b2-01", level: "B2", topic: "Veri yorumlama", skill: "VOCABULARY",
    prompt: "“Die Zahl ist gegenüber dem Vorjahr erheblich zurückgegangen.” cümlesinde hangi değişim anlatılır?",
    options: [option("a", "Belirgin bir düşüş"), option("b", "Küçük bir artış"), option("c", "Değişmeyen değer"), option("d", "Kesin olmayan tahmin")],
    correctAnswer: "Belirgin bir düşüş", explanation: "erheblich zurückgegangen, belirgin biçimde azalmış anlamına gelir.",
  }),
  mc({
    id: "v284-v-b2-02", level: "B2", topic: "Akademik ifade", skill: "VOCABULARY",
    prompt: "“eine These widerlegen” ifadesinin anlamı hangisidir?",
    options: [option("a", "Bir tezin yanlışlığını göstermek"), option("b", "Bir tezi ezberlemek"), option("c", "Bir tezi kısaltmak"), option("d", "Bir tezi tercüme etmek")],
    correctAnswer: "Bir tezin yanlışlığını göstermek", explanation: "widerlegen, kanıtlarla çürütmek anlamına gelir.",
  }),

  mc({
    id: "v284-r-a1-01", level: "A1", topic: "Kişisel bilgi", skill: "READING",
    prompt: "Metin: „Mila wohnt in Bremen. Sie arbeitet in einer Bäckerei.“ Mila nerede çalışıyor?",
    options: [option("a", "Bir fırında"), option("b", "Bir okulda"), option("c", "Bir bankada"), option("d", "Bir otelde")],
    correctAnswer: "Bir fırında", explanation: "Metinde Mila'nın bir fırında çalıştığı belirtilir.",
  }),
  mc({
    id: "v284-r-a1-02", level: "A1", topic: "Saat ve program", skill: "READING",
    prompt: "Duyuru: „Der Deutschkurs beginnt am Montag um 18 Uhr.“ Kurs ne zaman başlıyor?",
    options: [option("a", "Pazartesi 18.00'de"), option("b", "Salı 18.00'de"), option("c", "Pazartesi 08.00'de"), option("d", "Cuma 18.00'de")],
    correctAnswer: "Pazartesi 18.00'de", explanation: "Duyuruda Montag um 18 Uhr bilgisi verilir.",
  }),
  mc({
    id: "v284-r-a2-01", level: "A2", topic: "Ulaşım duyurusu", skill: "READING",
    prompt: "Duyuru: „Der Zug nach Köln fährt heute nicht von Gleis 4, sondern von Gleis 7.“ Yolcu ne yapmalı?",
    options: [option("a", "7. perona gitmeli"), option("b", "4. peronda beklemeli"), option("c", "Biletini iptal etmeli"), option("d", "Başka şehre gitmeli")],
    correctAnswer: "7. perona gitmeli", explanation: "Trenin bugün 7. perondan kalkacağı belirtilir.",
  }),
  mc({
    id: "v284-r-a2-02", level: "A2", topic: "E-posta", skill: "READING",
    prompt: "E-posta: „Ich kann morgen nicht zum Treffen kommen, weil ich bis 19 Uhr arbeiten muss. Können wir uns am Donnerstag sehen?“ Gönderen ne istiyor?",
    options: [option("a", "Buluşmayı perşembeye almak"), option("b", "İşini bırakmak"), option("c", "Toplantıyı tamamen iptal etmek"), option("d", "Yarın daha erken buluşmak")],
    correctAnswer: "Buluşmayı perşembeye almak", explanation: "Gönderen perşembe günü görüşmeyi öneriyor.",
  }),
  mc({
    id: "v284-r-b1-01", level: "B1", topic: "Metin çıkarımı", skill: "READING",
    prompt: "Metin: „Obwohl der Kurs anstrengend war, hat Nina ihn nicht abgebrochen. Sie wollte ihr Zertifikat unbedingt schaffen.“ Nina neden devam etti?",
    options: [option("a", "Sertifikayı almak istediği için"), option("b", "Kurs kolay olduğu için"), option("c", "Öğretmeni zorladığı için"), option("d", "Başka kurs olmadığı için")],
    correctAnswer: "Sertifikayı almak istediği için", explanation: "İkinci cümle Nina'nın sertifika hedefini açıklar.",
  }),
  mc({
    id: "v284-r-b1-02", level: "B1", topic: "Görüş ve gerekçe", skill: "READING",
    prompt: "Metin: „Viele Beschäftigte wünschen sich flexible Arbeitszeiten. Sie können dadurch Familie und Beruf besser organisieren. Manche vermissen jedoch klare Grenzen zwischen Arbeit und Freizeit.“ Metnin ana fikri nedir?",
    options: [option("a", "Esnek çalışmanın hem avantajları hem de zorlukları vardır"), option("b", "Esnek çalışma herkes için zararlıdır"), option("c", "Aile ve iş birlikte yürütülemez"), option("d", "Çalışanlar daha uzun süre çalışmak ister")],
    correctAnswer: "Esnek çalışmanın hem avantajları hem de zorlukları vardır", explanation: "Metin hem yararı hem de sınır sorununu birlikte sunar.",
  }),
  mc({
    id: "v284-r-b2-01", level: "B2", topic: "Eleştirel okuma", skill: "READING",
    prompt: "Metin: „Die Studie zeigt einen Zusammenhang zwischen Schlaf und Konzentration. Daraus folgt jedoch nicht automatisch, dass Schlafmangel die einzige Ursache für schwache Leistungen ist.“ Temel uyarı nedir?",
    options: [option("a", "İlişki ile tek nedenin aynı şey olmadığı"), option("b", "Uyku ile başarının hiçbir ilişkisi olmadığı"), option("c", "Çalışmanın kesin bir neden kanıtladığı"), option("d", "Uyku süresinin ölçülemediği")],
    correctAnswer: "İlişki ile tek nedenin aynı şey olmadığı", explanation: "Metin korelasyonun tek başına tekil nedensellik göstermediğini vurgular.",
  }),
  mc({
    id: "v284-r-b2-02", level: "B2", topic: "Yazar tutumu", skill: "READING",
    prompt: "Metin: „Die Digitalisierung kann Verwaltungsprozesse beschleunigen. Voraussetzung dafür sind jedoch verständliche Systeme und ausreichende Unterstützung für Menschen mit wenig technischer Erfahrung.“ Yazarın yaklaşımı hangisidir?",
    options: [option("a", "Koşullu ve dengeli bir değerlendirme"), option("b", "Teknolojiyi tamamen reddetme"), option("c", "Koşulsuz teknoloji övgüsü"), option("d", "Konuyla ilgisiz bir anlatım")],
    correctAnswer: "Koşullu ve dengeli bir değerlendirme", explanation: "Yarar kabul edilirken başarı için gerekli koşullar da belirtilir.",
  }),

  listening({
    id: "v284-l-a1-01", level: "A1", topic: "Tanışma",
    prompt: "Kaydı dinle. Konuşan kişi nerede yaşıyor?",
    audioText: "Hallo, ich heiße Jonas. Ich komme aus Österreich, aber jetzt wohne ich in Hamburg.",
    options: [option("a", "Hamburg'da"), option("b", "Viyana'da"), option("c", "Berlin'de"), option("d", "Zürih'te")],
    correctAnswer: "Hamburg'da", explanation: "Konuşan kişi jetzt wohne ich in Hamburg diyor.",
  }),
  listening({
    id: "v284-l-a1-02", level: "A1", topic: "Alışveriş",
    prompt: "Kaydı dinle. Müşteri ne satın almak istiyor?",
    audioText: "Guten Tag. Ich möchte ein Brot und zwei Brötchen, bitte.",
    options: [option("a", "Bir ekmek ve iki küçük ekmek"), option("b", "İki kahve"), option("c", "Bir pasta"), option("d", "Üç elma")],
    correctAnswer: "Bir ekmek ve iki küçük ekmek", explanation: "Brot ve zwei Brötchen istenir.",
  }),
  listening({
    id: "v284-l-a2-01", level: "A2", topic: "Randevu",
    prompt: "Kaydı dinle. Yeni randevu ne zaman?",
    audioText: "Der Termin am Dienstag fällt leider aus. Wir sehen uns stattdessen am Donnerstag um halb drei.",
    options: [option("a", "Perşembe 14.30'da"), option("b", "Salı 14.30'da"), option("c", "Perşembe 15.30'da"), option("d", "Cuma 14.00'te")],
    correctAnswer: "Perşembe 14.30'da", explanation: "Donnerstag um halb drei, perşembe 14.30 demektir.",
  }),
  listening({
    id: "v284-l-a2-02", level: "A2", topic: "Yol tarifi",
    prompt: "Kaydı dinle. Müze nerede?",
    audioText: "Gehen Sie geradeaus bis zur Ampel. Dann links. Das Museum ist direkt gegenüber der Post.",
    options: [option("a", "Postanenin karşısında"), option("b", "Trafik ışığının yanında"), option("c", "İstasyonun arkasında"), option("d", "Sağdaki ilk sokakta")],
    correctAnswer: "Postanenin karşısında", explanation: "direkt gegenüber der Post ifadesi postanenin karşısı anlamına gelir.",
  }),
  listening({
    id: "v284-l-b1-01", level: "B1", topic: "İş yeri konuşması",
    prompt: "Kaydı dinle. Çalışanın temel sorunu nedir?",
    audioText: "Seitdem wir das neue Programm benutzen, brauche ich für jede Bestellung länger. Besonders schwierig ist, dass die Fehlermeldungen nicht erklärt werden.",
    options: [option("a", "Yeni programın işi yavaşlatması ve hataları açıklamaması"), option("b", "Sipariş gelmemesi"), option("c", "Çalışma saatlerinin azalması"), option("d", "Bilgisayarın hiç açılmaması")],
    correctAnswer: "Yeni programın işi yavaşlatması ve hataları açıklamaması", explanation: "Konuşan kişi sürenin uzadığını ve hata mesajlarının açıklanmadığını söylüyor.",
  }),
  listening({
    id: "v284-l-b1-02", level: "B1", topic: "Radyo haberi",
    prompt: "Kaydı dinle. Belediye hangi değişikliği yapacak?",
    audioText: "Ab nächsten Monat fahren die Busse am Wochenende bis zwei Uhr nachts. Damit möchte die Stadt den nächtlichen Autoverkehr reduzieren.",
    options: [option("a", "Hafta sonu otobüsleri gece daha geç çalışacak"), option("b", "Otobüs biletleri kaldırılacak"), option("c", "Gece bütün yollar kapanacak"), option("d", "Hafta sonu otobüs olmayacak")],
    correctAnswer: "Hafta sonu otobüsleri gece daha geç çalışacak", explanation: "Otobüslerin hafta sonları gece ikiye kadar çalışacağı belirtilir.",
  }),
  listening({
    id: "v284-l-b2-01", level: "B2", topic: "Uzman görüşü",
    prompt: "Kaydı dinle. Konuşmacının temel görüşü hangisidir?",
    audioText: "Künstliche Intelligenz kann Routineaufgaben erleichtern. Entscheidend ist jedoch, dass Entscheidungen transparent bleiben und Menschen weiterhin Verantwortung übernehmen.",
    options: [option("a", "Yapay zekâ yararlı olabilir fakat şeffaflık ve insan sorumluluğu korunmalıdır"), option("b", "Bütün kararlar tamamen yapay zekâya bırakılmalıdır"), option("c", "Yapay zekânın hiçbir kullanım alanı yoktur"), option("d", "Sadece rutin işler kaldırılmalıdır")],
    correctAnswer: "Yapay zekâ yararlı olabilir fakat şeffaflık ve insan sorumluluğu korunmalıdır", explanation: "Konuşmacı yararı kabul ederken iki temel koşul koyuyor.",
  }),
  listening({
    id: "v284-l-b2-02", level: "B2", topic: "Tartışma", 
    prompt: "Kaydı dinle. İkinci konuşmacı neye itiraz ediyor?",
    audioText: "Erste Person: Homeoffice spart Bürofläche und Pendelzeit. Zweite Person: Das stimmt zwar, aber langfristig kann der informelle Austausch im Team darunter leiden.",
    options: [option("a", "Evden çalışmanın ekip içi gayriresmî iletişimi zayıflatabileceğini söylüyor"), option("b", "Ofis maliyetlerinin artacağını söylüyor"), option("c", "Yolculuk süresinin uzadığını söylüyor"), option("d", "Evden çalışmayı tamamen yasaklamak istiyor")],
    correctAnswer: "Evden çalışmanın ekip içi gayriresmî iletişimi zayıflatabileceğini söylüyor", explanation: "İtiraz, informeller Austausch im Team ifadesiyle ekip iletişimine yöneliktir.",
  }),

  {
    id: "v284-w-a2-01", level: "A2", topic: "Günlük e-posta", skill: "WRITING", kind: "WRITING",
    prompt: "Bir arkadaşına hafta sonu buluşmayı öneren kısa bir Almanca mesaj yaz.",
    instruction: "Yer, gün/saat ve birlikte yapmak istediğin bir etkinliği belirt.",
    explanation: "Yanıt; görevi yerine getirme, anlaşılabilirlik, kelime çeşitliliği ve bağlaç kullanımıyla otomatik olarak ön değerlendirilir.",
    minWords: 35, maxWords: 70,
    keywords: ["samstag", "sonntag", "uhr", "treffen", "möchtest", "können", "weil", "gern"],
  },
  {
    id: "v284-w-b1-01", level: "B1", topic: "Resmî e-posta", skill: "WRITING", kind: "WRITING",
    prompt: "Bir dil kursuna e-posta yaz: Ders saatlerinin değişmesi nedeniyle yaşadığın sorunu açıkla ve çözüm iste.",
    instruction: "Hitap, problem, gerekçe, çözüm talebi ve kapanış ifadesi kullan.",
    explanation: "Yanıt; görev kapsamı, yapı, bağlaçlar ve dilsel çeşitlilikle otomatik olarak ön değerlendirilir.",
    minWords: 70, maxWords: 130,
    keywords: ["sehr geehrte", "kurs", "unterricht", "problem", "weil", "könnten", "lösung", "mit freundlichen grüßen"],
  },
  {
    id: "v284-s-a1-01", level: "A1", topic: "Kendini tanıtma", skill: "SPEAKING", kind: "SPEAKING",
    prompt: "Mikrofona Almanca olarak kendini tanıt.",
    instruction: "Adın, yaşadığın şehir, yaptığın iş/okul ve bir hobin hakkında konuş.",
    explanation: "Konuşma, tarayıcının oluşturduğu transkript üzerinden akıcılık ve görev kapsamı bakımından otomatik ön değerlendirilir.",
    minWords: 20, maxWords: 60,
    keywords: ["ich heiße", "ich bin", "ich wohne", "ich komme", "ich arbeite", "ich studiere", "mein hobby", "gern"],
  },
  {
    id: "v284-s-b1-01", level: "B1", topic: "Görüş bildirme", skill: "SPEAKING", kind: "SPEAKING",
    prompt: "Mikrofona şu konu hakkında Almanca görüşünü anlat: Şehirde toplu taşıma neden önemlidir?",
    instruction: "Görüşünü belirt, en az iki gerekçe ver ve kısa bir sonuç cümlesi kur.",
    explanation: "Konuşma, tarayıcı transkripti üzerinden görev kapsamı, bağlaç ve kelime çeşitliliğiyle otomatik ön değerlendirilir.",
    minWords: 45, maxWords: 100,
    keywords: ["meiner meinung", "weil", "deshalb", "außerdem", "verkehr", "umwelt", "wichtig", "zusammenfassend"],
  },
];

const quickIds = new Set([
  "v284-g-a1-02", "v284-v-a1-01", "v284-r-a1-01", "v284-l-a1-01",
  "v284-g-a2-02", "v284-v-a2-01", "v284-r-a2-01", "v284-l-a2-01",
  "v284-g-b1-01", "v284-v-b1-01", "v284-r-b1-01", "v284-l-b1-01",
  "v284-g-b2-01", "v284-v-b2-01", "v284-r-b2-01", "v284-l-b2-01",
]);

export const quickPlacementQuestions = detailedPlacementQuestions.filter((question) => quickIds.has(question.id));

export function questionsForPlacementMode(mode: PlacementTestMode): PlacementQuestion[] {
  return mode === "DETAILED" ? detailedPlacementQuestions : quickPlacementQuestions;
}

export const placementQuestionCountByMode: Record<PlacementTestMode, number> = {
  QUICK: quickPlacementQuestions.length,
  DETAILED: detailedPlacementQuestions.length,
};

export const placementSkillLabels: Record<PlacementSkill, string> = {
  GRAMMAR: "Gramer",
  VOCABULARY: "Kelime",
  READING: "Okuma",
  LISTENING: "Dinleme",
  WRITING: "Yazma",
  SPEAKING: "Konuşma",
};
