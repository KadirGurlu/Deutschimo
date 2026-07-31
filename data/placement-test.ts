import type { PlacementQuestion } from "@/types/intelligence";

const option = (id: string, label: string) => ({ id, label, value: label });

export const placementQuestions: PlacementQuestion[] = [
  {
    id: "pt-a1-01", level: "A1", topic: "Selamlaşma", skill: "COMMUNICATION",
    prompt: "Sabah bir arkadaşını selamlamak için hangi ifade uygundur?",
    options: [option("a", "Guten Morgen!"), option("b", "Gute Nacht!"), option("c", "Bis gestern!"), option("d", "Entschuldigung!")],
    correctAnswer: "Guten Morgen!", explanation: "Guten Morgen sabah kullanılan temel selamlaşma ifadesidir.",
  },
  {
    id: "pt-a1-02", level: "A1", topic: "sein fiili", skill: "GRAMMAR",
    prompt: "Cümleyi tamamla: Ich ___ Maria.",
    options: [option("a", "bin"), option("b", "bist"), option("c", "ist"), option("d", "sind")],
    correctAnswer: "bin", explanation: "sein fiili ich öznesiyle bin biçimini alır.",
  },
  {
    id: "pt-a1-03", level: "A1", topic: "Kişisel bilgiler", skill: "COMMUNICATION",
    prompt: "“Nerelisin?” sorusunun Almancası hangisidir?",
    options: [option("a", "Wo wohnst du?"), option("b", "Woher kommst du?"), option("c", "Wie alt bist du?"), option("d", "Was machst du?")],
    correctAnswer: "Woher kommst du?", explanation: "Woher köken veya gelinen yeri sormak için kullanılır.",
  },
  {
    id: "pt-a1-04", level: "A1", topic: "Fiil çekimi", skill: "GRAMMAR",
    prompt: "Doğru cümleyi seç.",
    options: [option("a", "Du wohnen in Berlin."), option("b", "Du wohnst in Berlin."), option("c", "Du wohnt in Berlin."), option("d", "Du wohne in Berlin.")],
    correctAnswer: "Du wohnst in Berlin.", explanation: "wohnen fiili du öznesiyle wohnst olur.",
  },
  {
    id: "pt-a1-05", level: "A1", topic: "Artikel", skill: "VOCABULARY",
    prompt: "“Name” kelimesinin doğru artikeli hangisidir?",
    options: [option("a", "der Name"), option("b", "die Name"), option("c", "das Name"), option("d", "den Name")],
    correctAnswer: "der Name", explanation: "Name sözcüğü maskulindir ve der artikeliyle kullanılır.",
  },
  {
    id: "pt-a1-06", level: "A1", topic: "Basit okuma", skill: "READING",
    prompt: "Anna schreibt: „Ich wohne in Hamburg und arbeite in einem Café.“ Anna nerede çalışıyor?",
    options: [option("a", "In einer Schule"), option("b", "In einem Café"), option("c", "In einem Hotel"), option("d", "In einer Bank")],
    correctAnswer: "In einem Café", explanation: "Metinde Anna'nın bir kafede çalıştığı açıkça belirtilir.",
  },

  {
    id: "pt-a2-01", level: "A2", topic: "Perfekt", skill: "GRAMMAR",
    prompt: "Doğru Perfekt cümlesini seç.",
    options: [option("a", "Ich habe gestern gearbeitet."), option("b", "Ich bin gestern gearbeitet."), option("c", "Ich habe gestern arbeiten."), option("d", "Ich gestern gearbeitet habe.")],
    correctAnswer: "Ich habe gestern gearbeitet.", explanation: "arbeiten fiilinin Perfekt biçimi haben + gearbeitet yapısıyla kurulur.",
  },
  {
    id: "pt-a2-02", level: "A2", topic: "Dativ", skill: "GRAMMAR",
    prompt: "Cümleyi tamamla: Ich fahre ___ Bus zur Arbeit.",
    options: [option("a", "mit der"), option("b", "mit dem"), option("c", "für den"), option("d", "bei das")],
    correctAnswer: "mit dem", explanation: "mit edatı her zaman Dativ ister; der Bus → dem Bus olur.",
  },
  {
    id: "pt-a2-03", level: "A2", topic: "Tavsiye", skill: "COMMUNICATION",
    prompt: "Bir arkadaşına dinlenmesini tavsiye etmek için en uygun cümle hangisidir?",
    options: [option("a", "Du solltest dich ausruhen."), option("b", "Du musstest dich ausruhen."), option("c", "Du würdest ausruhen."), option("d", "Du ruhst gestern aus.")],
    correctAnswer: "Du solltest dich ausruhen.", explanation: "solltest nazik bir tavsiye vermek için kullanılır.",
  },
  {
    id: "pt-a2-04", level: "A2", topic: "Yan cümle", skill: "GRAMMAR",
    prompt: "Doğru weil cümlesini seç.",
    options: [option("a", "Ich bleibe zu Hause, weil ich bin krank."), option("b", "Ich bleibe zu Hause, weil krank ich bin."), option("c", "Ich bleibe zu Hause, weil ich krank bin."), option("d", "Ich bleibe, weil bin ich krank, zu Hause.")],
    correctAnswer: "Ich bleibe zu Hause, weil ich krank bin.", explanation: "weil ile kurulan yan cümlede çekimli fiil sona gider.",
  },
  {
    id: "pt-a2-05", level: "A2", topic: "Günlük kelime", skill: "VOCABULARY",
    prompt: "“eine Wohnung besichtigen” ne demektir?",
    options: [option("a", "Bir evi kiraya vermek"), option("b", "Bir evi gezip görmek"), option("c", "Bir evi temizlemek"), option("d", "Bir ev satın almak")],
    correctAnswer: "Bir evi gezip görmek", explanation: "besichtigen bir yeri incelemek veya gezip görmek anlamına gelir.",
  },
  {
    id: "pt-a2-06", level: "A2", topic: "Kısa duyuru", skill: "READING",
    prompt: "Duyuru: „Der Zug nach Köln fährt heute nicht von Gleis 4, sondern von Gleis 7.“ Yolcu ne yapmalı?",
    options: [option("a", "4. perona gitmeli"), option("b", "7. perona gitmeli"), option("c", "Köln trenine binmemeli"), option("d", "Biletini değiştirmeli")],
    correctAnswer: "7. perona gitmeli", explanation: "Duyuruda trenin bugün 7. perondan kalkacağı belirtilir.",
  },

  {
    id: "pt-b1-01", level: "B1", topic: "Konjunktiv II", skill: "GRAMMAR",
    prompt: "Kibar bir rica içeren cümleyi seç.",
    options: [option("a", "Könnten Sie mir bitte helfen?"), option("b", "Sie helfen mir gestern."), option("c", "Sie müssen mir geholfen."), option("d", "Helfen Sie mir konnte?")],
    correctAnswer: "Könnten Sie mir bitte helfen?", explanation: "Könnten Sie ...? resmî ve nazik rica kalıbıdır.",
  },
  {
    id: "pt-b1-02", level: "B1", topic: "Relativsatz", skill: "GRAMMAR",
    prompt: "Doğru relatif cümleyi seç.",
    options: [option("a", "Das ist der Kollege, der in München arbeitet."), option("b", "Das ist der Kollege, er arbeitet in München."), option("c", "Das ist der Kollege, den arbeitet in München."), option("d", "Das ist der Kollege, arbeitet der in München.")],
    correctAnswer: "Das ist der Kollege, der in München arbeitet.", explanation: "Maskulin Nominativ relatif zamiri der olur ve yan cümlede fiil sona gider.",
  },
  {
    id: "pt-b1-03", level: "B1", topic: "Görüş bildirme", skill: "COMMUNICATION",
    prompt: "Bir görüşü gerekçelendiren en uygun cümle hangisidir?",
    options: [option("a", "Meiner Meinung nach ist Sport wichtig, weil er Stress reduziert."), option("b", "Sport ist Meinung wichtig und Stress."), option("c", "Ich Meinung Sport, obwohl wichtig."), option("d", "Sport würde gestern wichtig sein.")],
    correctAnswer: "Meiner Meinung nach ist Sport wichtig, weil er Stress reduziert.", explanation: "Meiner Meinung nach ve weil yapısı görüşü ve gerekçeyi açıkça ifade eder.",
  },
  {
    id: "pt-b1-04", level: "B1", topic: "Passiv", skill: "GRAMMAR",
    prompt: "Aktif cümle: „Die Firma produziert neue Geräte.“ Doğru Passiv cümlesi hangisidir?",
    options: [option("a", "Neue Geräte werden von der Firma produziert."), option("b", "Neue Geräte haben produziert."), option("c", "Die Firma wird neue Geräte."), option("d", "Neue Geräte sind produzieren.")],
    correctAnswer: "Neue Geräte werden von der Firma produziert.", explanation: "Präsens Passiv werden + Partizip II ile kurulur.",
  },
  {
    id: "pt-b1-05", level: "B1", topic: "İş hayatı", skill: "VOCABULARY",
    prompt: "“sich um eine Stelle bewerben” ne anlama gelir?",
    options: [option("a", "Bir pozisyona başvurmak"), option("b", "İşten ayrılmak"), option("c", "Maaş ödemek"), option("d", "Toplantıyı iptal etmek")],
    correctAnswer: "Bir pozisyona başvurmak", explanation: "sich bewerben um iş veya eğitim başvurularında kullanılan temel kalıptır.",
  },
  {
    id: "pt-b1-06", level: "B1", topic: "Metin çıkarımı", skill: "READING",
    prompt: "Metin: „Obwohl der Kurs anstrengend war, hat Nina ihn nicht abgebrochen. Sie wollte ihr Zertifikat unbedingt schaffen.“ Nina neden devam etti?",
    options: [option("a", "Kurs kolay olduğu için"), option("b", "Sertifikayı almak istediği için"), option("c", "Öğretmeni zorladığı için"), option("d", "Başka kurs olmadığı için")],
    correctAnswer: "Sertifikayı almak istediği için", explanation: "İkinci cümlede Nina'nın sertifikayı mutlaka başarmak istediği belirtilir.",
  },

  {
    id: "pt-b2-01", level: "B2", topic: "Nominalisierung", skill: "GRAMMAR",
    prompt: "“Die Mitarbeitenden diskutieren die Ergebnisse.” cümlesinin uygun nominal biçimi hangisidir?",
    options: [option("a", "Die Diskussion der Ergebnisse durch die Mitarbeitenden"), option("b", "Das Diskutieren sind Ergebnisse"), option("c", "Die Ergebnisse diskutiert Mitarbeitende"), option("d", "Mitarbeitende der Diskussion Ergebnisse")],
    correctAnswer: "Die Diskussion der Ergebnisse durch die Mitarbeitenden", explanation: "Fiil, die Diskussion ismiyle nominalleştirilmiş ve ilişkiler Genitiv/durch yapısıyla korunmuştur.",
  },
  {
    id: "pt-b2-02", level: "B2", topic: "Bağlaçlar", skill: "GRAMMAR",
    prompt: "Karşıtlık ve denge ifade eden doğru cümleyi seç.",
    options: [option("a", "Einerseits spart Homeoffice Zeit, andererseits fehlt der direkte Austausch."), option("b", "Einerseits Homeoffice spart, weil andererseits Austausch."), option("c", "Homeoffice einerseits, fehlt andererseits deshalb."), option("d", "Andererseits spart einerseits Homeoffice Zeit.")],
    correctAnswer: "Einerseits spart Homeoffice Zeit, andererseits fehlt der direkte Austausch.", explanation: "einerseits ... andererseits iki yönü dengeli biçimde karşılaştırır.",
  },
  {
    id: "pt-b2-03", level: "B2", topic: "Akademik temkin", skill: "COMMUNICATION",
    prompt: "Bir araştırma sonucunu temkinli biçimde yorumlayan cümle hangisidir?",
    options: [option("a", "Die Ergebnisse deuten darauf hin, dass weitere Untersuchungen nötig sind."), option("b", "Die Ergebnisse beweisen immer alles."), option("c", "Weitere Untersuchungen sind Ergebnis."), option("d", "Man muss glauben, weil Ergebnis.")],
    correctAnswer: "Die Ergebnisse deuten darauf hin, dass weitere Untersuchungen nötig sind.", explanation: "deuten darauf hin kesinlik iddiasını sınırlayan akademik bir kalıptır.",
  },
  {
    id: "pt-b2-04", level: "B2", topic: "Dolaylı anlatım", skill: "GRAMMAR",
    prompt: "Bir kişinin sözünü tarafsız biçimde aktaran cümleyi seç.",
    options: [option("a", "Die Expertin erklärte, die Maßnahme sei notwendig."), option("b", "Die Expertin erklärte, die Maßnahme ist notwendig gewesen sein."), option("c", "Die Expertin erkläre, notwendig Maßnahme."), option("d", "Die Maßnahme erklärte die Expertin sei.")],
    correctAnswer: "Die Expertin erklärte, die Maßnahme sei notwendig.", explanation: "Konjunktiv I dolaylı anlatımda aktarılan görüşe mesafe koyar.",
  },
  {
    id: "pt-b2-05", level: "B2", topic: "Veri yorumlama", skill: "VOCABULARY",
    prompt: "“Die Zahl ist im Vergleich zum Vorjahr deutlich gestiegen.” cümlesinde hangi değişim anlatılır?",
    options: [option("a", "Belirgin bir artış"), option("b", "Küçük bir düşüş"), option("c", "Değişmeyen değer"), option("d", "Tahmin edilemeyen sonuç")],
    correctAnswer: "Belirgin bir artış", explanation: "deutlich gestiegen ifadesi belirgin biçimde yükselmek anlamına gelir.",
  },
  {
    id: "pt-b2-06", level: "B2", topic: "Eleştirel okuma", skill: "READING",
    prompt: "Metin: „Die Studie zeigt einen Zusammenhang zwischen Schlaf und Konzentration. Daraus folgt jedoch nicht automatisch, dass Schlafmangel die einzige Ursache für schwache Leistungen ist.“ Metnin temel uyarısı nedir?",
    options: [option("a", "İlişki ile tek nedenin aynı şey olmadığı"), option("b", "Uyku ile başarının hiçbir ilişkisi olmadığı"), option("c", "Çalışmanın kesin bir neden kanıtladığı"), option("d", "Uyku süresinin ölçülemediği")],
    correctAnswer: "İlişki ile tek nedenin aynı şey olmadığı", explanation: "Metin korelasyonun tek başına kesin ve tekil nedensellik göstermediğini vurgular.",
  },
];

export const placementQuestionCount = placementQuestions.length;
