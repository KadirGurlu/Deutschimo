import type { Unit } from "@/types/course";
import type { BilingualText, CurriculumExample, DialogueTurn } from "@/types/content";

const germanTitles: Record<string, string> = {
  "a1-u01": "Kennenlernen und Begrüßung",
  "a1-u02": "Persönliche Angaben und Berufe",
  "a1-u03": "Orientierung in der Stadt",
  "a1-u04": "Essen, Trinken und Bestellen",
  "a1-u05": "Alltag und Familie",
  "a1-u06": "Freizeit und Einladungen",
  "a1-u07": "Arbeitstag und Termine",
  "a1-u08": "Gesundheit und tägliche Bedürfnisse",
  "a1-u09": "Wohnen und Wohnräume",
  "a1-u10": "Ausbildung und Beruf",
  "a1-u11": "Kleidung und Einkaufen",
  "a1-u12": "Reisen und Urlaub",
  "a2-u01": "Vergangenheit und Biografien",
  "a2-u02": "Wohnen, Umzug und Nachbarschaft",
  "a2-u03": "Reisepläne und Verkehrsmittel",
  "a2-u04": "Kommunikation und digitale Medien",
  "a2-u05": "Lernen und Bildung",
  "a2-u06": "Arbeit, Bewerbung und Vorstellungsgespräch",
  "a2-u07": "Gesundheit und Ratschläge",
  "a2-u08": "Einkaufen und Konsum",
  "a2-u09": "Feste und Einladungen",
  "a2-u10": "Natur und Entscheidungen im Alltag",
  "a2-u11": "Behördengänge und Dienstleistungen",
  "a2-u12": "Pläne und Zukunft",
  "a2-u13": "Kultur und Veranstaltungen",
  "a2-u14": "Stadtleben und Mobilität",
  "a2-u15": "Hobbys und persönliche Projekte",
  "a2-u16": "Wiederholung und Prüfungstraining A2",
  "b1-u01": "Erfahrungen und Lebensgeschichten",
  "b1-u02": "Lernen, Bildung und Erfolg",
  "b1-u03": "Arbeitswelt und Arbeitsprozesse",
  "b1-u04": "Medien, Informationen und Glaubwürdigkeit",
  "b1-u05": "Umwelt, Klima und Verantwortung",
  "b1-u06": "Gesundheit, Gewohnheiten und Ausgleich",
  "b1-u07": "Beziehungen und Konfliktlösung",
  "b1-u08": "Reisen, Kultur und Vergleiche",
  "b1-u09": "Stadt, Wohnen und Lebensqualität",
  "b1-u10": "Konsum, Geld und Wirtschaft",
  "b1-u11": "Gesellschaft, Beteiligung und Ehrenamt",
  "b1-u12": "B1-Projekt und Prüfungsvorbereitung",
  "b1-u13": "Wissenschaft und Technik im Alltag",
  "b1-u14": "Nachrichten und gesellschaftliche Debatten",
  "b1-u15": "Arbeitssuche und Karriereplanung",
  "b1-u16": "Formelle Korrespondenz und Anträge",
  "b1-u17": "Präsentieren und die eigene Meinung äußern",
  "b1-u18": "Wiederholung und Prüfungstraining B1",
  "b2-u01": "Wissenschaft, Forschung und akademisches Arbeiten",
  "b2-u02": "Professionelle Kommunikation und Entscheidungsprozesse",
  "b2-u03": "Digitalisierung und technologischer Wandel",
  "b2-u04": "Gesellschaftlicher Wandel und Redewiedergabe",
  "b2-u05": "Klimapolitik und komplexe Zusammenhänge",
  "b2-u06": "Gesundheitsforschung und evidenzbasierte Informationen",
  "b2-u07": "Kultur, Identität und sprachliche Nuancen",
  "b2-u08": "Wirtschaft, Konsum und Unsicherheit",
  "b2-u09": "Recht, Politik und öffentliche Sprache",
  "b2-u10": "Stadtentwicklung, Mobilität und Planung",
  "b2-u11": "Argumentation und akademischer Stil",
  "b2-u12": "Textkohärenz und Portfolioarbeit",
  "b2-u13": "Wissenschaftliche Texte lesen",
  "b2-u14": "Grafiken und Daten interpretieren",
  "b2-u15": "Akademische Präsentationen vorbereiten",
  "b2-u16": "Verhandeln im Berufsleben",
  "b2-u17": "Kritische Medienkompetenz",
  "b2-u18": "Diskutieren und Gegenpositionen entwickeln",
  "b2-u19": "Prüfungsstrategien B2",
  "b2-u20": "Wiederholung und Prüfungstraining B2",
};

const deNames = ["Anna", "Lukas", "Sophie", "Jonas", "Laura", "Felix", "Marie", "Leon", "Clara", "David"];

function turn(speaker: string, de: string, tr: string): DialogueTurn { return { speaker, de, tr }; }

const scenes: Record<string, { dialogue: DialogueTurn[]; reading: BilingualText; listening: BilingualText }> = {
  "a1-u01": {
    dialogue: [
      turn("Lena", "Guten Morgen! Ich heiße Lena. Wie heißt du?", "Günaydın! Benim adım Lena. Senin adın ne?"),
      turn("Jonas", "Hallo Lena, ich heiße Jonas.", "Merhaba Lena, benim adım Jonas."),
      turn("Lena", "Freut mich, Jonas. Woher kommst du?", "Memnun oldum Jonas. Nerelisin?"),
      turn("Jonas", "Ich komme aus Köln. Und du?", "Köln'den geliyorum. Ya sen?"),
      turn("Lena", "Ich komme aus Hamburg und wohne jetzt in Berlin.", "Hamburg'dan geliyorum ve şimdi Berlin'de oturuyorum."),
      turn("Jonas", "Schön, dich kennenzulernen!", "Tanıştığımıza memnun oldum!"),
      turn("Lena", "Gleichfalls. Bis bald!", "Ben de memnun oldum. Yakında görüşürüz!"),
    ],
    reading: {
      de: "Am Montag beginnt ein neuer Deutschkurs in Berlin. Lena sitzt neben Jonas. In der Pause sprechen sie zum ersten Mal miteinander. Lena stellt sich vor und fragt Jonas nach seinem Namen und seiner Herkunft. Jonas kommt aus Köln, Lena aus Hamburg. Beide wohnen jetzt in Berlin und möchten gemeinsam Deutsch lernen. Am Ende der Pause sagen sie: ‚Schön, dich kennenzulernen!‘",
      tr: "Pazartesi günü Berlin'de yeni bir Almanca kursu başlar. Lena, Jonas'ın yanında oturur. Teneffüste ilk kez birbirleriyle konuşurlar. Lena kendini tanıtır ve Jonas'a adını ve nereli olduğunu sorar. Jonas Köln'den, Lena ise Hamburg'dan gelir. İkisi de şimdi Berlin'de oturur ve birlikte Almanca öğrenmek ister. Teneffüsün sonunda “Tanıştığımıza memnun oldum!” derler.",
    },
    listening: {
      de: "Hallo, ich bin Sophie. Ich komme aus München und wohne seit zwei Monaten in Leipzig. Heute lerne ich meine neue Nachbarin Marie kennen. Sie kommt aus Dresden. Wir begrüßen uns, sagen unsere Namen und sprechen kurz über unsere Städte. Danach trinken wir zusammen einen Kaffee.",
      tr: "Merhaba, ben Sophie. Münih'ten geliyorum ve iki aydır Leipzig'de oturuyorum. Bugün yeni komşum Marie ile tanışıyorum. O Dresden'den geliyor. Birbirimizi selamlıyor, adlarımızı söylüyor ve şehirlerimiz hakkında kısaca konuşuyoruz. Daha sonra birlikte kahve içiyoruz.",
    },
  },
  "a1-u02": {
    dialogue: [
      turn("Sophie", "Was machst du beruflich, Lukas?", "Ne iş yapıyorsun Lukas?"),
      turn("Lukas", "Ich bin Koch. Ich arbeite in einem Hotel.", "Aşçıyım. Bir otelde çalışıyorum."),
      turn("Sophie", "Wo arbeitest du genau?", "Tam olarak nerede çalışıyorsun?"),
      turn("Lukas", "In einem kleinen Hotel am Bahnhof. Und du?", "Tren istasyonunun yanındaki küçük bir otelde. Ya sen?"),
      turn("Sophie", "Ich studiere Informatik in München.", "Münih'te bilgisayar bilimi okuyorum."),
    ],
    reading: { de: "Laura ist 24 Jahre alt und wohnt in Bremen. Sie studiert Medizin und arbeitet am Wochenende in einem Café. Ihr Bruder Felix ist Elektriker. Er lebt in Hannover und arbeitet bei einer großen Firma. Beide sprechen Deutsch und Englisch.", tr: "Laura 24 yaşındadır ve Bremen'de oturur. Tıp okur ve hafta sonları bir kafede çalışır. Erkek kardeşi Felix elektrikçidir. Hannover'de yaşar ve büyük bir firmada çalışır. İkisi de Almanca ve İngilizce konuşur." },
    listening: { de: "Mein Name ist David Schneider. Ich bin 31 Jahre alt, wohne in Frankfurt und arbeite als Krankenpfleger. Meine Telefonnummer ist 0176 845 23 19. In meiner Freizeit spiele ich gern Fußball.", tr: "Benim adım David Schneider. 31 yaşındayım, Frankfurt'ta oturuyorum ve hemşire olarak çalışıyorum. Telefon numaram 0176 845 23 19. Boş zamanlarımda futbol oynamayı seviyorum." },
  },
  "a1-u03": {
    dialogue: [turn("Marie", "Entschuldigung, wo ist der Bahnhof?", "Affedersiniz, tren istasyonu nerede?"), turn("Leon", "Gehen Sie hier geradeaus und dann links.", "Buradan dümdüz gidin ve sonra sola dönün."), turn("Marie", "Ist es weit?", "Uzak mı?"), turn("Leon", "Nein, nur fünf Minuten zu Fuß.", "Hayır, yürüyerek sadece beş dakika."), turn("Marie", "Vielen Dank!", "Çok teşekkür ederim!")],
    reading: { de: "Sophie ist neu in Dresden. Sie sucht die Stadtbibliothek. An der Kreuzung fragt sie einen Mann nach dem Weg. Sie geht zuerst geradeaus, dann rechts und überquert den Platz. Die Bibliothek liegt neben der Post.", tr: "Sophie Dresden'de yenidir. Şehir kütüphanesini arar. Kavşakta bir adama yolu sorar. Önce dümdüz gider, sonra sağa döner ve meydanı geçer. Kütüphane postanenin yanındadır." },
    listening: { de: "Sie möchten zum Museum? Fahren Sie mit der U-Bahn bis zum Marktplatz. Nehmen Sie dort den Ausgang ‚Altstadt‘. Das Museum sehen Sie auf der linken Seite, direkt gegenüber dem Rathaus.", tr: "Müzeye mi gitmek istiyorsunuz? Metro ile Marktplatz durağına gidin. Orada “Altstadt” çıkışını kullanın. Müzeyi sol tarafta, belediye binasının tam karşısında göreceksiniz." },
  },
  "a1-u04": {
    dialogue: [turn("Kellnerin", "Guten Abend. Was möchten Sie?", "İyi akşamlar. Ne istersiniz?"), turn("Felix", "Ich nehme eine Gemüsesuppe und ein Wasser.", "Bir sebze çorbası ve su alayım."), turn("Kellnerin", "Möchten Sie noch Brot dazu?", "Yanında ekmek de ister misiniz?"), turn("Felix", "Ja, gern. Und später bitte einen Kaffee.", "Evet, memnuniyetle. Daha sonra da bir kahve lütfen."), turn("Kellnerin", "Sehr gern.", "Tabii ki.")],
    reading: { de: "Anna frühstückt jeden Morgen zu Hause. Sie isst Brot mit Käse und trinkt Tee. Mittags isst sie in der Kantine. Heute bestellt sie Reis mit Gemüse. Am Abend kocht sie mit ihrer Freundin eine Suppe.", tr: "Anna her sabah evde kahvaltı yapar. Peynirli ekmek yer ve çay içer. Öğle yemeğini kantinde yer. Bugün sebzeli pilav sipariş eder. Akşam arkadaşıyla birlikte çorba pişirir." },
    listening: { de: "Für Tisch zwölf: einmal Salat, zweimal Nudeln und eine Pizza ohne Käse. Dazu zwei Mineralwasser und einen Apfelsaft. Der Kaffee kommt später.", tr: "On iki numaralı masa için: bir salata, iki makarna ve peynirsiz bir pizza. Yanında iki maden suyu ve bir elma suyu. Kahve daha sonra gelecek." },
  },
  "a1-u05": {
    dialogue: [turn("Jonas", "Wann stehst du morgens auf?", "Sabahları ne zaman kalkarsın?"), turn("Clara", "Um halb sieben. Dann frühstücke ich mit meiner Familie.", "Altı buçukta. Sonra ailemle kahvaltı yaparım."), turn("Jonas", "Hast du Geschwister?", "Kardeşin var mı?"), turn("Clara", "Ja, einen Bruder. Er geht noch zur Schule.", "Evet, bir erkek kardeşim var. O hâlâ okula gidiyor."), turn("Jonas", "Was macht ihr am Abend?", "Akşamları ne yaparsınız?"), turn("Clara", "Wir essen zusammen und sehen manchmal fern.", "Birlikte yemek yeriz ve bazen televizyon izleriz.")],
    reading: { de: "Familie Wagner wohnt in Bonn. Die Eltern arbeiten von Montag bis Freitag. Ihre Tochter Emma geht zur Schule, ihr Sohn Paul besucht den Kindergarten. Am Abend essen alle zusammen. Danach macht Emma Hausaufgaben und Paul hört eine Geschichte.", tr: "Wagner ailesi Bonn'da oturur. Anne ve baba pazartesiden cumaya kadar çalışır. Kızları Emma okula gider, oğulları Paul anaokuluna devam eder. Akşam herkes birlikte yemek yer. Daha sonra Emma ödevini yapar ve Paul bir hikâye dinler." },
    listening: { de: "Mein Tag beginnt um sieben Uhr. Ich dusche, ziehe mich an und frühstücke. Um acht Uhr fahre ich zur Arbeit. Um fünf Uhr bin ich wieder zu Hause. Abends koche ich und telefoniere mit meiner Schwester.", tr: "Günüm saat yedide başlar. Duş alırım, giyinirim ve kahvaltı yaparım. Saat sekizde işe giderim. Saat beşte yeniden evde olurum. Akşamları yemek yaparım ve kız kardeşimle telefonla konuşurum." },
  },
  "a1-u06": {
    dialogue: [turn("Laura", "Hast du am Samstag Zeit?", "Cumartesi günü vaktin var mı?"), turn("Felix", "Ja, warum?", "Evet, neden?"), turn("Laura", "Ich mache eine kleine Party. Kommst du?", "Küçük bir parti veriyorum. Geliyor musun?"), turn("Felix", "Gern! Wann beginnt sie?", "Memnuniyetle! Ne zaman başlıyor?"), turn("Laura", "Um acht Uhr. Bring bitte Musik mit.", "Saat sekizde. Lütfen müzik getir."), turn("Felix", "Mache ich. Bis Samstag!", "Getiririm. Cumartesi görüşürüz!")],
    reading: { de: "Am Wochenende trifft Marie ihre Freunde. Am Samstag gehen sie ins Kino. Danach trinken sie etwas in einem Café. Am Sonntag fährt Marie mit dem Fahrrad in den Park. Wenn es regnet, liest sie zu Hause einen Roman.", tr: "Marie hafta sonu arkadaşlarıyla buluşur. Cumartesi sinemaya giderler. Daha sonra bir kafede bir şeyler içerler. Pazar günü Marie bisikletle parka gider. Yağmur yağarsa evde roman okur." },
    listening: { de: "Hallo Sophie, hier ist Leon. Wir spielen morgen um drei Uhr Volleyball im Stadtpark. Hast du Lust? Bring bitte Sportschuhe und etwas zu trinken mit. Ruf mich heute Abend kurz an.", tr: "Merhaba Sophie, ben Leon. Yarın saat üçte şehir parkında voleybol oynuyoruz. İster misin? Lütfen spor ayakkabısı ve içecek bir şey getir. Bu akşam beni kısaca ara." },
  },
  "a1-u07": {
    dialogue: [turn("Sekretariat", "Praxis Dr. Weber, guten Tag.", "Dr. Weber muayenehanesi, iyi günler."), turn("Sophie", "Guten Tag. Ich möchte einen Termin vereinbaren.", "İyi günler. Randevu almak istiyorum."), turn("Sekretariat", "Passt Ihnen Dienstag um zehn Uhr?", "Salı günü saat on size uyar mı?"), turn("Sophie", "Leider nicht. Geht es am Nachmittag?", "Maalesef uymaz. Öğleden sonra mümkün mü?"), turn("Sekretariat", "Ja, um vierzehn Uhr dreißig.", "Evet, saat on dört otuzda."), turn("Sophie", "Das passt, danke.", "Bu uyar, teşekkürler.")],
    reading: { de: "Lukas arbeitet in einem Büro. Er beginnt um acht Uhr und liest zuerst seine E-Mails. Um zehn Uhr hat er eine Besprechung. Nach der Mittagspause telefoniert er mit Kunden. Um halb fünf beendet er seine Arbeit.", tr: "Lukas bir ofiste çalışır. Saat sekizde başlar ve önce e-postalarını okur. Saat onda toplantısı vardır. Öğle arasından sonra müşterilerle telefonla konuşur. Dört buçukta işini bitirir." },
    listening: { de: "Der Termin mit Frau Becker ist am Mittwoch um elf Uhr. Die Besprechung findet im Raum 204 statt. Bitte bringen Sie die Unterlagen mit und kommen Sie zehn Minuten früher.", tr: "Frau Becker ile randevu çarşamba günü saat on birdedir. Toplantı 204 numaralı odada yapılacaktır. Lütfen belgeleri getirin ve on dakika erken gelin." },
  },
  "a1-u08": {
    dialogue: [turn("Apothekerin", "Guten Tag. Was fehlt Ihnen?", "İyi günler. Neyiniz var?"), turn("Leon", "Ich habe Halsschmerzen und Husten.", "Boğazım ağrıyor ve öksürüyorum."), turn("Apothekerin", "Haben Sie auch Fieber?", "Ateşiniz de var mı?"), turn("Leon", "Nein, kein Fieber.", "Hayır, ateşim yok."), turn("Apothekerin", "Nehmen Sie diesen Tee und ruhen Sie sich aus.", "Bu çayı alın ve dinlenin."), turn("Leon", "Danke für den Rat.", "Tavsiye için teşekkür ederim.")],
    reading: { de: "Emma fühlt sich heute nicht gut. Ihr Kopf tut weh und sie ist müde. Sie bleibt zu Hause, trinkt viel Wasser und schläft zwei Stunden. Am Nachmittag geht es ihr besser.", tr: "Emma bugün kendini iyi hissetmez. Başı ağrır ve yorgundur. Evde kalır, çok su içer ve iki saat uyur. Öğleden sonra daha iyi olur." },
    listening: { de: "Bitte nehmen Sie die Tabletten zweimal täglich nach dem Essen. Trinken Sie genug Wasser. Wenn das Fieber morgen noch da ist, rufen Sie bitte Ihre Ärztin an.", tr: "Lütfen tabletleri günde iki kez yemekten sonra alın. Yeterince su için. Ateş yarın hâlâ devam ederse lütfen doktorunuzu arayın." },
  },
  "a1-u09": {
    dialogue: [turn("Makler", "Hier ist das Wohnzimmer. Es ist sehr hell.", "Burası oturma odası. Çok aydınlık."), turn("Marie", "Wie groß ist die Wohnung?", "Daire ne kadar büyük?"), turn("Makler", "Sie hat 65 Quadratmeter und zwei Schlafzimmer.", "65 metrekare ve iki yatak odası var."), turn("Marie", "Gibt es auch einen Balkon?", "Balkon da var mı?"), turn("Makler", "Ja, der Balkon ist neben der Küche.", "Evet, balkon mutfağın yanında."), turn("Marie", "Die Wohnung gefällt mir.", "Daireyi beğendim.")],
    reading: { de: "Jonas wohnt in einer kleinen Wohnung in Leipzig. Das Wohnzimmer ist groß, aber die Küche ist klein. Im Schlafzimmer stehen ein Bett und ein Schrank. Auf dem Balkon hat Jonas viele Pflanzen.", tr: "Jonas Leipzig'de küçük bir dairede oturur. Oturma odası büyük, fakat mutfak küçüktür. Yatak odasında bir yatak ve bir dolap vardır. Jonas'ın balkonda çok sayıda bitkisi vardır." },
    listening: { de: "Die Wohnung liegt im dritten Stock. Links ist das Bad, rechts die Küche. Das Wohnzimmer befindet sich am Ende des Flurs. Im Keller gibt es einen Platz für Fahrräder.", tr: "Daire üçüncü kattadır. Solda banyo, sağda mutfak bulunur. Oturma odası koridorun sonundadır. Bodrumda bisikletler için bir yer vardır." },
  },
  "a1-u10": {
    dialogue: [turn("Anna", "Was möchtest du später machen?", "İleride ne yapmak istiyorsun?"), turn("Felix", "Ich möchte Mechatroniker werden.", "Mekatronik teknisyeni olmak istiyorum."), turn("Anna", "Machst du eine Ausbildung?", "Meslek eğitimi mi yapıyorsun?"), turn("Felix", "Ja, ab September bei einer Firma in Stuttgart.", "Evet, eylülden itibaren Stuttgart'taki bir firmada."), turn("Anna", "Viel Erfolg!", "Bol başarı!")],
    reading: { de: "Sophie besucht eine Berufsschule. Drei Tage pro Woche arbeitet sie in einer Apotheke, zwei Tage lernt sie in der Schule. Die Ausbildung dauert drei Jahre. Später möchte sie als pharmazeutisch-technische Assistentin arbeiten.", tr: "Sophie bir meslek okuluna devam eder. Haftada üç gün eczanede çalışır, iki gün okulda öğrenim görür. Meslek eğitimi üç yıl sürer. Daha sonra eczane teknikeri olarak çalışmak ister." },
    listening: { de: "Für die Stelle brauchen Sie einen Schulabschluss und gute Deutschkenntnisse. Die Arbeitszeit ist von Montag bis Freitag. Bitte schicken Sie Ihren Lebenslauf bis zum 15. Mai.", tr: "Bu pozisyon için okul diplomasına ve iyi Almanca bilgisine ihtiyacınız var. Çalışma süresi pazartesiden cumaya kadardır. Lütfen özgeçmişinizi 15 Mayıs'a kadar gönderin." },
  },
  "a1-u11": {
    dialogue: [turn("Verkäuferin", "Kann ich Ihnen helfen?", "Size yardımcı olabilir miyim?"), turn("Clara", "Ja, ich suche eine schwarze Jacke.", "Evet, siyah bir ceket arıyorum."), turn("Verkäuferin", "Welche Größe haben Sie?", "Bedeniniz kaç?"), turn("Clara", "Größe 38.", "38 beden."), turn("Verkäuferin", "Probieren Sie diese Jacke an.", "Bu ceketi deneyin."), turn("Clara", "Sie passt gut. Was kostet sie?", "İyi oturdu. Fiyatı ne kadar?")],
    reading: { de: "Leon braucht neue Schuhe für die Arbeit. Im Geschäft probiert er zwei Paare an. Die braunen Schuhe sind bequem, aber zu teuer. Die schwarzen Schuhe kosten weniger und passen gut. Leon kauft das schwarze Paar.", tr: "Leon iş için yeni ayakkabılara ihtiyaç duyar. Mağazada iki çift dener. Kahverengi ayakkabılar rahattır, fakat çok pahalıdır. Siyah ayakkabılar daha ucuzdur ve iyi oturur. Leon siyah çifti satın alır." },
    listening: { de: "Heute gibt es zwanzig Prozent Rabatt auf Jacken und Pullover. Die Umkleidekabinen befinden sich im ersten Stock. Sie können mit Karte oder bar bezahlen.", tr: "Bugün ceketlerde ve kazaklarda yüzde yirmi indirim var. Deneme kabinleri birinci kattadır. Kartla veya nakit ödeme yapabilirsiniz." },
  },
  "a1-u12": {
    dialogue: [turn("Rezeption", "Guten Tag. Haben Sie reserviert?", "İyi günler. Rezervasyonunuz var mı?"), turn("Lukas", "Ja, auf den Namen Wagner.", "Evet, Wagner adına."), turn("Rezeption", "Ein Doppelzimmer für drei Nächte, richtig?", "Üç gecelik çift kişilik oda, doğru mu?"), turn("Lukas", "Ja. Ist das Frühstück inklusive?", "Evet. Kahvaltı dâhil mi?"), turn("Rezeption", "Ja, von sieben bis zehn Uhr.", "Evet, saat yediden ona kadar."), turn("Lukas", "Vielen Dank.", "Çok teşekkür ederim.")],
    reading: { de: "Marie fährt im Juli nach Österreich. Sie reist mit dem Zug von Nürnberg nach Salzburg. Dort bleibt sie fünf Tage in einem kleinen Hotel. Sie möchte die Altstadt besichtigen und in den Bergen wandern.", tr: "Marie temmuz ayında Avusturya'ya gider. Nürnberg'den Salzburg'a trenle seyahat eder. Orada küçük bir otelde beş gün kalır. Eski şehri gezmek ve dağlarda yürüyüş yapmak ister." },
    listening: { de: "Der ICE nach Berlin fährt heute von Gleis sieben ab. Wegen einer technischen Störung hat der Zug zehn Minuten Verspätung. Bitte beachten Sie die Anzeigen am Bahnsteig.", tr: "Berlin'e giden ICE treni bugün yedinci perondan kalkacaktır. Teknik bir arıza nedeniyle tren on dakika gecikmelidir. Lütfen perondaki ekranları takip edin." },
  },
};

export function germanTopicTitle(unit: Unit): string { return germanTitles[unit.id] ?? unit.title; }

function naturalizePair(example: CurriculumExample, index: number, unit: Unit): CurriculumExample {
  const name = deNames[index % deNames.length];
  const secondName = deNames[(index + 3) % deNames.length];
  return {
    de: example.de
      .replaceAll("Kadir", name)
      .replaceAll("Emre", secondName)
      .replaceAll("Frau Kaya", "Frau Schneider")
      .replaceAll(unit.title, germanTopicTitle(unit)),
    tr: example.tr
      .replaceAll("Kadir", name)
      .replaceAll("Emre", secondName)
      .replaceAll("Frau Kaya", "Frau Schneider"),
  };
}

export function buildNaturalDialogue(content: { examples: CurriculumExample[] }, unit: Unit): DialogueTurn[] {
  const scene = scenes[unit.id];
  if (scene) return scene.dialogue;
  const examples = content.examples.slice(0, 4).map((item, index) => naturalizePair(item, index, unit));
  const topic = germanTopicTitle(unit);
  if (unit.courseId === "a2") {
    return [
      turn("Sophie", `Hallo Lukas, hast du kurz Zeit? Ich möchte mit dir über ${topic} sprechen.`, `Merhaba Lukas, kısa bir vaktin var mı? Seninle ${unit.title.toLocaleLowerCase("tr-TR")} hakkında konuşmak istiyorum.`),
      turn("Lukas", examples[0]?.de ?? "Ja, gern. Was möchtest du wissen?", examples[0]?.tr ?? "Evet, memnuniyetle. Ne öğrenmek istiyorsun?"),
      turn("Sophie", examples[1]?.de ?? "Wie war es bei dir?", examples[1]?.tr ?? "Sende nasıldı?"),
      turn("Lukas", examples[2]?.de ?? "Ich erzähle dir gern davon.", examples[2]?.tr ?? "Sana bundan memnuniyetle bahsederim."),
      turn("Sophie", "Danke, das hilft mir sehr.", "Teşekkürler, bu bana çok yardımcı oldu."),
    ];
  }
  return [
    turn("Clara", `Ich habe gestern einen Beitrag über ${topic} gelesen. Wie beurteilst du das Thema?`, `Dün ${unit.title.toLocaleLowerCase("tr-TR")} hakkında bir yazı okudum. Bu konuyu nasıl değerlendiriyorsun?`),
    turn("David", examples[0]?.de ?? "Ich halte den Ansatz grundsätzlich für sinnvoll.", examples[0]?.tr ?? "Bu yaklaşımı genel olarak anlamlı buluyorum."),
    turn("Clara", examples[1]?.de ?? "Welche Argumente sprechen dafür?", examples[1]?.tr ?? "Bunu destekleyen hangi gerekçeler var?"),
    turn("David", examples[2]?.de ?? "Entscheidend sind die konkreten Folgen.", examples[2]?.tr ?? "Belirleyici olan somut sonuçlardır."),
    turn("Clara", "Dann sollten wir auch mögliche Gegenargumente prüfen.", "O hâlde olası karşı görüşleri de incelemeliyiz."),
  ];
}

export function buildNaturalReading(content: { examples: CurriculumExample[] }, unit: Unit): BilingualText {
  const scene = scenes[unit.id];
  if (scene) return scene.reading;
  const examples = content.examples.slice(0, 4).map((item, index) => naturalizePair(item, index + 2, unit));
  const topic = germanTopicTitle(unit);
  const de = unit.courseId === "a2"
    ? `Sophie beschäftigt sich seit einigen Wochen mit ${topic}. ${examples[0]?.de ?? "Sie sammelt zuerst wichtige Informationen."} Danach spricht sie mit Lukas und vergleicht ihre Erfahrungen. ${examples[1]?.de ?? "Gemeinsam planen sie die nächsten Schritte."} Am Ende schreibt Sophie die wichtigsten Punkte in ihr Notizbuch.`
    : `In einem Seminar wird heute das Thema ${topic} behandelt. Clara stellt zunächst die zentrale Frage vor. ${examples[0]?.de ?? "Die Teilnehmenden sammeln unterschiedliche Argumente."} David ergänzt ein konkretes Beispiel und weist auf mögliche Folgen hin. ${examples[1]?.de ?? "Anschließend werden die Positionen miteinander verglichen."} Zum Schluss fasst die Gruppe die wichtigsten Ergebnisse zusammen.`;
  const tr = unit.courseId === "a2"
    ? `Sophie birkaç haftadır ${unit.title.toLocaleLowerCase("tr-TR")} konusuyla ilgileniyor. ${examples[0]?.tr ?? "Önce önemli bilgileri topluyor."} Daha sonra Lukas'la konuşuyor ve deneyimlerini karşılaştırıyor. ${examples[1]?.tr ?? "Birlikte sonraki adımları planlıyorlar."} Sonunda Sophie en önemli noktaları not defterine yazıyor.`
    : `Bugünkü bir seminerde ${unit.title.toLocaleLowerCase("tr-TR")} konusu ele alınıyor. Clara önce temel soruyu tanıtıyor. ${examples[0]?.tr ?? "Katılımcılar farklı gerekçeler topluyor."} David somut bir örnek ekliyor ve olası sonuçlara dikkat çekiyor. ${examples[1]?.tr ?? "Ardından görüşler birbiriyle karşılaştırılıyor."} Son olarak grup en önemli sonuçları özetliyor.`;
  return { de, tr };
}

export function buildNaturalListening(content: { examples: CurriculumExample[] }, unit: Unit): BilingualText {
  const scene = scenes[unit.id];
  if (scene) return scene.listening;
  const examples = content.examples.slice(0, 3).map((item, index) => naturalizePair(item, index + 5, unit));
  const topic = germanTopicTitle(unit);
  if (unit.courseId === "a2") {
    return {
      de: `Guten Morgen, hier ist eine kurze Nachricht von Laura. Sie informiert ihre Freundin über ${topic}. ${examples[0]?.de ?? "Zuerst nennt sie den wichtigsten Termin."} Danach erklärt sie, was noch vorbereitet werden muss. ${examples[1]?.de ?? "Zum Schluss bittet sie um eine kurze Rückmeldung."}`,
      tr: `Günaydın, bu Laura'dan kısa bir mesaj. Arkadaşına ${unit.title.toLocaleLowerCase("tr-TR")} hakkında bilgi veriyor. ${examples[0]?.tr ?? "Önce en önemli tarihi söylüyor."} Daha sonra başka nelerin hazırlanması gerektiğini açıklıyor. ${examples[1]?.tr ?? "Son olarak kısa bir geri dönüş istiyor."}`,
    };
  }
  return {
    de: `Im heutigen Radiobeitrag geht es um ${topic}. Die Moderatorin Clara stellt zunächst die Ausgangssituation vor. ${examples[0]?.de ?? "Anschließend erläutert ein Experte die wichtigsten Zusammenhänge."} Danach wird ein konkretes Beispiel genannt. ${examples[1]?.de ?? "Am Ende fasst die Moderatorin die zentralen Aussagen zusammen."}`,
    tr: `Bugünkü radyo programında ${unit.title.toLocaleLowerCase("tr-TR")} konusu ele alınıyor. Sunucu Clara önce başlangıç durumunu tanıtıyor. ${examples[0]?.tr ?? "Ardından bir uzman en önemli bağlantıları açıklıyor."} Daha sonra somut bir örnek veriliyor. ${examples[1]?.tr ?? "Programın sonunda sunucu temel ifadeleri özetliyor."}`,
  };
}
