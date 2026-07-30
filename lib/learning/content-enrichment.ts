import type { Unit } from "@/types/course";
import type {
  CurriculumExample,
  CurriculumUnitContent,
  RichVocabularyItem,
  BilingualLine,
  BilingualText,
  DialogueTurn,
  PracticeQuestion,
  CommonMistake,
} from "@/types/content";
import { buildNaturalDialogue, buildNaturalListening, buildNaturalReading, germanTopicTitle } from "@/lib/learning/topic-content";

const pluralOverrides: Record<string, string> = {
  Name: "Namen", Beruf: "Berufe", Student: "Studenten", Studentin: "Studentinnen",
  Telefonnummer: "Telefonnummern", "E-Mail-Adresse": "E-Mail-Adressen", Bahnhof: "Bahnhöfe",
  Apotheke: "Apotheken", Bank: "Banken", Kreuzung: "Kreuzungen", Tisch: "Tische",
  Brot: "Brote", Käse: "Käse", Suppe: "Suppen", Wasser: "Wasser", Familie: "Familien",
  Geburtstag: "Geburtstage", Einladung: "Einladungen", Termin: "Termine", Arbeit: "Arbeiten",
  Bauch: "Bäuche", Hals: "Hälse", Kopf: "Köpfe", Tablette: "Tabletten", Wohnung: "Wohnungen",
  Küche: "Küchen", Schlafzimmer: "Schlafzimmer", Wohnzimmer: "Wohnzimmer", Bett: "Betten",
  Schrank: "Schränke", Jacke: "Jacken", Hose: "Hosen", Hemd: "Hemden", Pullover: "Pullover",
  Reise: "Reisen", Urlaub: "Urlaube", Zug: "Züge", Flugzeug: "Flugzeuge", Unterkunft: "Unterkünfte",
  Vater: "Väter", Mutter: "Mütter", Bruder: "Brüder", Nachbar: "Nachbarn", Nachricht: "Nachrichten",
  Bewerbung: "Bewerbungen", Lebenslauf: "Lebensläufe", Stelle: "Stellen", Ausbildung: "Ausbildungen",
  Prüfung: "Prüfungen", Kurs: "Kurse", Projekt: "Projekte", Ziel: "Ziele", Plan: "Pläne",
  Beispiel: "Beispiele", Argument: "Argumente", These: "Thesen", Quelle: "Quellen",
  Methode: "Methoden", Aufgabe: "Aufgaben", Präsentation: "Präsentationen", Entscheidung: "Entscheidungen",
  Erfahrung: "Erfahrungen", Entwicklung: "Entwicklungen", Maßnahme: "Maßnahmen", Ergebnis: "Ergebnisse",
  Risiko: "Risiken", Konflikt: "Konflikte", Verein: "Vereine", Gebühr: "Gebühren", Formular: "Formulare",
  Unterschrift: "Unterschriften", Ausweis: "Ausweise", Fahrkarte: "Fahrkarten", Gerät: "Geräte",
  Produkt: "Produkte", Material: "Materialien", Datei: "Dateien", Strategie: "Strategien",
  Kompetenz: "Kompetenzen", Qualifikation: "Qualifikationen", Verantwortung: "Verantwortungen",
  Perspektive: "Perspektiven", Forderung: "Forderungen", Bedingung: "Bedingungen",
  Voraussetzung: "Voraussetzungen", Wirkung: "Wirkungen", Zusammenhang: "Zusammenhänge",
  Forschung: "Forschungen", Studie: "Studien", Antrag: "Anträge", Nachweis: "Nachweise",
  Abwägung: "Abwägungen", Anforderung: "Anforderungen", Anfrage: "Anfragen", Annahme: "Annahmen",
  Anstieg: "Anstiege", Anteil: "Anteile", Anwendung: "Anwendungen", Arbeitsablauf: "Arbeitsabläufe",
  Aufführung: "Aufführungen", Aufgabenstellung: "Aufgabenstellungen", Ausgabe: "Ausgaben", Ausstellung: "Ausstellungen",
  Auswahl: "Auswahlen", Auswertung: "Auswertungen", Automatisierung: "Automatisierungen", Bearbeitungszeit: "Bearbeitungszeiten",
  Befund: "Befunde", Begegnung: "Begegnungen", Behauptung: "Behauptungen", Belastung: "Belastungen",
  Beleg: "Belege", Bewegung: "Bewegungen", Budget: "Budgets", Datenmenge: "Datenmengen",
  Deutung: "Deutungen", Durchschnitt: "Durchschnitte", Ehrenamt: "Ehrenämter", Eindruck: "Eindrücke",
  Einleitung: "Einleitungen", Einnahme: "Einnahmen", Einschränkung: "Einschränkungen", Einschätzung: "Einschätzungen",
  Einwendung: "Einwendungen", Emission: "Emissionen", Emissionsgrenze: "Emissionsgrenzen", Entscheidungsgrundlage: "Entscheidungsgrundlagen",
  Entwicklungsmöglichkeit: "Entwicklungsmöglichkeiten", Evidenz: "Evidenzen", Feier: "Feiern", Flächennutzung: "Flächennutzungen",
  Flüssigkeit: "Flüssigkeiten", Folgenabschätzung: "Folgenabschätzungen", Forschungsstand: "Forschungsstände", Fortschritt: "Fortschritte",
  Fragestellung: "Fragestellungen", Frist: "Fristen", Frühstück: "Frühstücke", Förderung: "Förderungen",
  Garantie: "Garantien", Gegenposition: "Gegenpositionen", Genauigkeit: "Genauigkeiten", Genehmigung: "Genehmigungen",
  Gewichtung: "Gewichtungen", Gewohnheit: "Gewohnheiten", Gliederung: "Gliederungen", Größe: "Größen",
  Haltung: "Haltungen", Hauptteil: "Hauptteile", Herleitung: "Herleitungen", Inflation: "Inflationen",
  Infrastruktur: "Infrastrukturen", Initiative: "Initiativen", Karton: "Kartons", Kausalität: "Kausalitäten",
  Kino: "Kinos", Kohärenz: "Kohärenzen", Konjunktur: "Konjunkturen", Konzentration: "Konzentrationen",
  Korrelation: "Korrelationen", Leitfrage: "Leitfragen", Lernerfolg: "Lernerfolge", Lernmethode: "Lernmethoden",
  Lernstrategie: "Lernstrategien", Messung: "Messungen", Miete: "Mieten", Missverständnis: "Missverständnisse",
  Nachfrage: "Nachfragen", Nebenwirkung: "Nebenwirkungen", Notiz: "Notizen", Pause: "Pausen",
  Portfolio: "Portfolios", Prognose: "Prognosen", Qualität: "Qualitäten", Rabatt: "Rabatte",
  Radweg: "Radwege", Roman: "Romane", Rückgang: "Rückgänge", Rückmeldung: "Rückmeldungen",
  Schluss: "Schlüsse", Schlussfolgerung: "Schlussfolgerungen", Schnittstelle: "Schnittstellen", Schwerpunkt: "Schwerpunkte",
  Schwäche: "Schwächen", Selbstbezeichnung: "Selbstbezeichnungen", Spende: "Spenden", Stellungnahme: "Stellungnahmen",
  Stichprobe: "Stichproben", Stärke: "Stärken", Umsetzung: "Umsetzungen", Umstellung: "Umstellungen",
  Umwelt: "Umwelten", Umzug: "Umzüge", Verbindung: "Verbindungen", Verbrauch: "Verbräuche",
  Verdichtung: "Verdichtungen", Verhandlung: "Verhandlungen", Verpflichtung: "Verpflichtungen", Verspätung: "Verspätungen",
  Verweis: "Verweise", Verzerrung: "Verzerrungen", Veränderung: "Veränderungen", Vorschrift: "Vorschriften",
  Wahrnehmung: "Wahrnehmungen", Wertewandel: "Wertewandel", Wiederholung: "Wiederholungen", Wohnviertel: "Wohnviertel",
  Zielsetzung: "Zielsetzungen", Zielvorgabe: "Zielvorgaben", Zinssatz: "Zinssätze", Zugehörigkeit: "Zugehörigkeiten",
  Zugeständnis: "Zugeständnisse", Zukunft: "Zukünfte", Zuständigkeit: "Zuständigkeiten", Überarbeitung: "Überarbeitungen",
  Überblick: "Überblicke", Übereinstimmung: "Übereinstimmungen",

};

const noPluralNouns = new Set(["Berichterstattung", "Erholung", "Ernährung", "Erreichbarkeit", "Fachliteratur", "Freizeit", "Kindheit", "Klimawandel", "Mehrsprachigkeit", "Müll", "Nahverkehr", "Stress", "Verkehr", "Wirksamkeit"]);

const wordKinds = {
  noun: "İsim",
  verb: "Fiil",
  adjective: "Sıfat",
  adverb: "Zarf",
  question: "Soru kelimesi",
  expression: "İfade",
  other: "Kelime",
} as const;

function splitVocabulary(item: string) {
  const [rawTerm, ...meaningParts] = item.split(" — ");
  return { rawTerm: rawTerm.trim(), meaning: meaningParts.join(" — ").trim() };
}

function detectKind(rawTerm: string) {
  if (/^(der|die|das)\s+/i.test(rawTerm)) return wordKinds.noun;
  if (/^(wo|wie|woher|wohin|wann|warum|wer|wen|wem|was|welch)/i.test(rawTerm)) return wordKinds.question;
  if (rawTerm.startsWith("sich ") || /(?:en|ern|eln|ieren)(?:\s+(?:an|auf|mit|gegen|um|von|zu|für))?$/i.test(rawTerm)) return wordKinds.verb;
  if (/^(gut|schön|wichtig|richtig|falsch|schnell|langsam|gesund|krank|möglich|nötig|notwendig|zufrieden|unzufrieden)$/i.test(rawTerm)) return wordKinds.adjective;
  if (/^(heute|morgen|gestern|auch|dort|hier|links|rechts|geradeaus|deshalb|trotzdem|außerdem)$/i.test(rawTerm)) return wordKinds.adverb;
  if (rawTerm.includes(" ")) return wordKinds.expression;
  return wordKinds.other;
}

function pluralByRule(article: string, noun: string): string | undefined {
  if (noPluralNouns.has(noun)) return undefined;
  if (Object.prototype.hasOwnProperty.call(pluralOverrides, noun)) return pluralOverrides[noun];
  if (/(chen|lein)$/.test(noun)) return noun;
  if (/(ung|heit|keit|schaft|ion|tät|ik|ur|ei|anz|enz)$/.test(noun)) return `${noun}en`;
  if (noun.endsWith("e")) return `${noun}n`;
  if (/(er|el)$/.test(noun)) return noun;
  if (noun.endsWith("in")) return `${noun}nen`;
  if (noun.endsWith("nis")) return `${noun}se`;
  if (noun.endsWith("um")) return `${noun.slice(0, -2)}en`;
  if (article === "die") return `${noun}en`;
  if (article === "der" || article === "das") return `${noun}e`;
  return undefined;
}

function normalizedSearchTerm(rawTerm: string): string {
  return rawTerm.replace(/^(der|die|das)\s+/i, "").replace(/^sich\s+/i, "").split(/\s+/)[0].toLocaleLowerCase("de-DE");
}

function findExample(content: CurriculumUnitContent, rawTerm: string): CurriculumExample | undefined {
  const needle = normalizedSearchTerm(rawTerm);
  return content.examples.find((example) => example.de.toLocaleLowerCase("de-DE").includes(needle));
}

function fallbackVocabularyExample(rawTerm: string, meaning: string, kind: string): CurriculumExample {
  const articleMatch = rawTerm.match(/^(der|die|das)\s+(.+)$/i);
  if (articleMatch) {
    return {
      de: `Das ist ${articleMatch[1].toLowerCase()} ${articleMatch[2]}.`,
      tr: `Bu, ${meaning}.`,
    };
  }
  if (kind === wordKinds.verb) {
    return {
      de: `Wir verwenden das Verb „${rawTerm}“ in einem eigenen Satz.`,
      tr: `“${meaning}” anlamındaki fiili kendi cümlemizde kullanıyoruz.`,
    };
  }
  return {
    de: `Der Ausdruck „${rawTerm}“ ist in diesem Thema wichtig.`,
    tr: `“${rawTerm}” ifadesi bu konuda önemlidir.`,
  };
}

export function buildRichVocabulary(content: CurriculumUnitContent): RichVocabularyItem[] {
  return content.vocabulary.map((item) => {
    const { rawTerm, meaning } = splitVocabulary(item);
    const articleMatch = rawTerm.match(/^(der|die|das)\s+(.+)$/i);
    const kind = detectKind(rawTerm);
    const example = findExample(content, rawTerm) ?? fallbackVocabularyExample(rawTerm, meaning, kind);
    return {
      word: articleMatch ? articleMatch[2] : rawTerm,
      article: articleMatch?.[1].toLowerCase() as "der" | "die" | "das" | undefined,
      plural: articleMatch ? pluralByRule(articleMatch[1].toLowerCase(), articleMatch[2]) : undefined,
      meaning,
      kind,
      exampleDe: example.de,
      exampleTr: example.tr,
    };
  });
}

export function levelLabel(courseId: string) {
  return courseId.toUpperCase();
}

export function buildPrerequisites(unit: Unit): string[] {
  if (unit.courseId === "a1" && unit.order === 1) return ["Herhangi bir Almanca ön bilgisi gerekmez.", "Latin alfabesini okuyabilmek yeterlidir."];
  if (unit.courseId === "a1") return ["Önceki A1 ünitesindeki temel kişi zamirleri ve fiil çekimleri", "Basit ana cümlede çekimli fiilin ikinci konumda olduğu bilgisi"];
  if (unit.courseId === "a2") return ["A1 düzeyindeki Präsens, artikel ve temel soru yapıları", "Basit cümlelerde özne-fiil uyumu"];
  if (unit.courseId === "b1") return ["A2 düzeyindeki temel zamanlar ve yan cümleler", "Günlük konularda kısa metinleri anlayabilme"];
  return ["B1 düzeyindeki zaman, bağlaç ve metin kurma bilgisi", "Ana fikir ile ayrıntıyı ayırt edebilme"];
}

export function buildUseCases(unit: Unit): string[] {
  const title = unit.title.toLocaleLowerCase("tr-TR");
  const cases = [
    `“${unit.title}” konusunda temel bilgileri doğru ve anlaşılır biçimde aktarmak`,
    `“${unit.title}” bağlamında uygun sorular sormak ve verilen yanıtları anlamak`,
    `“${unit.title}” hakkında kısa bir diyalog, mesaj veya metin üretmek`,
  ];
  if (title.includes("iş") || title.includes("başvuru") || title.includes("profesyonel")) cases.push(`“${unit.title}” ile ilgili iş veya başvuru ortamında resmî dil kullanmak`);
  if (title.includes("akademik") || title.includes("bilim") || title.includes("araştırma")) cases.push(`“${unit.title}” hakkında görüş, kanıt ve sonuç ilişkisini akademik biçimde kurmak`);
  if (title.includes("seyahat") || title.includes("ulaşım")) cases.push(`“${unit.title}” bağlamında yolculuk sırasında bilgi almak, plan yapmak ve sorun çözmek`);
  return cases;
}

function pair(de: string, tr: string, note?: string): BilingualLine { return { de, tr, note }; }

export function buildStructureExamples(content: CurriculumUnitContent, unit: Unit) {
  const topic = germanTopicTitle(unit);
  const positive = content.examples.slice(0, 3).map((item, index) => {
    const names = ["Anna", "Lukas", "Sophie"];
    return pair(item.de.replaceAll("Kadir", names[index] ?? "Anna").replaceAll("Frau Kaya", "Frau Schneider"), item.tr.replaceAll("Kadir", names[index] ?? "Anna").replaceAll("Frau Kaya", "Frau Schneider"), "Olumlu örnek");
  });
  const firstTerm = splitVocabulary(content.vocabulary[0] ?? "das Thema — konu").rawTerm;
  const negative = unit.courseId === "a1" || unit.courseId === "a2"
    ? [
        pair(`Ich übe ${topic} heute nicht allein.`, `Bugün ${unit.title.toLocaleLowerCase("tr-TR")} konusunu tek başıma çalışmıyorum.`, "nicht ile olumsuzluk"),
        pair(`Wir benutzen den Ausdruck „${firstTerm}“ nicht in jeder Situation.`, `“${firstTerm}” ifadesini her durumda kullanmıyoruz.`, "nicht ile kullanım sınırı"),
      ]
    : [
        pair(`Nicht jede Aussage zu ${topic} ist eindeutig.`, `${unit.title} konusundaki her ifade açık değildir.`, "nicht ile değerlendirme"),
        pair(`Die zentrale Annahme zu ${topic} wird in diesem Beispiel nicht bestätigt.`, `${unit.title} konusundaki temel varsayım bu örnekte doğrulanmıyor.`, "pasif yapıda olumsuzluk"),
      ];
  const questions = unit.courseId === "a1" || unit.courseId === "a2"
    ? [
        pair(`Übst du heute ${topic}?`, `Bugün ${unit.title.toLocaleLowerCase("tr-TR")} konusunu çalışıyor musun?`, "Evet-hayır sorusu"),
        pair(`Welche Wendung brauchst du bei ${topic}?`, `${unit.title} konusunda hangi kalıba ihtiyacın var?`, "W-sorusu"),
      ]
    : [
        pair(`Ist die Argumentation zu ${topic} überzeugend?`, `${unit.title} konusundaki gerekçelendirme ikna edici mi?`, "Evet-hayır sorusu"),
        pair(`Welche Folgen hat der zentrale Aspekt von ${topic}?`, `${unit.title} konusunun temel yönünün ne gibi sonuçları vardır?`, "W-sorusu"),
      ];
  return { positive, negative, questions };
}

export function buildRegisterExamples(content: CurriculumUnitContent, unit: Unit): BilingualLine[] {
  const keyTerm = splitVocabulary(content.vocabulary[1] ?? content.vocabulary[0] ?? "das Thema — konu").rawTerm;
  const topic = germanTopicTitle(unit);
  if (unit.courseId === "a1" || unit.courseId === "a2") {
    return [
      pair(`Du lernst heute etwas über ${topic}.`, `Bugün ${unit.title.toLocaleLowerCase("tr-TR")} hakkında bir şeyler öğreniyorsun.`, "Samimi hitap: du"),
      pair(`Lernen Sie heute den Ausdruck „${keyTerm}“?`, `Bugün “${keyTerm}” ifadesini öğreniyor musunuz?`, "Resmî hitap: Sie"),
      pair(`Ihr übt die neuen Sätze zu ${topic} gemeinsam.`, `${unit.title} konusundaki yeni cümleleri birlikte çalışıyorsunuz.`, "Çoğul samimi hitap: ihr"),
    ];
  }
  return [
    pair(`Kannst du deine Position zu ${topic} genauer erklären?`, `${unit.title} konusundaki görüşünü daha ayrıntılı açıklayabilir misin?`, "Samimi ve doğrudan"),
    pair(`Könnten Sie den Begriff „${keyTerm}“ bitte näher erläutern?`, `“${keyTerm}” kavramını biraz daha ayrıntılı açıklayabilir misiniz?`, "Resmî ve nazik"),
    pair(`Die Teilnehmenden vertreten zu ${topic} unterschiedliche Positionen.`, `Katılımcılar ${unit.title.toLocaleLowerCase("tr-TR")} konusunda farklı görüşleri savunuyor.`, "Çoğul kullanım"),
  ];
}

export function buildDialogue(content: CurriculumUnitContent, unit: Unit): DialogueTurn[] {
  return buildNaturalDialogue(content, unit);
}

export function buildReadingText(content: CurriculumUnitContent, unit: Unit): BilingualText {
  return buildNaturalReading(content, unit);
}

export function buildListeningText(content: CurriculumUnitContent, unit: Unit): BilingualText {
  return buildNaturalListening(content, unit);
}

function makeWrongSentence(correct: string, mode: number): string {
  const clean = correct.trim();
  const punctuation = clean.match(/[.!?]$/)?.[0] ?? ".";
  const tokens = clean.replace(/[.!?]$/, "").split(/\s+/);
  let candidate = "";
  if (mode === 0 && tokens.length >= 3) candidate = `${tokens[0]} ${tokens.slice(2).join(" ")} ${tokens[1]}${punctuation}`;
  if (mode === 1) candidate = clean.replace(/\b(der|die|das|den|dem|einen|eine|einem|einer)\b\s*/i, "");
  if (mode === 2 && punctuation === "?") candidate = `${tokens.slice(1).join(" ")} ${tokens[0]}?`;
  if (!candidate || candidate === clean) candidate = tokens.length >= 2 ? `${tokens[1]} ${tokens[0]} ${tokens.slice(2).join(" ")}${punctuation}` : `Nicht ${clean}`;
  return candidate.replace(/\s+/g, " ").trim();
}

export function buildCommonMistakes(content: CurriculumUnitContent): CommonMistake[] {
  return content.examples.slice(0, 3).map((example, index) => ({
    wrong: makeWrongSentence(example.de, index),
    correct: example.de,
    tr: example.tr,
    reason: index === 0
      ? "Almanca ana cümlede çekimli fiil çoğunlukla ikinci konumda bulunur; özne ile fiili birbirinden ayırma."
      : index === 1
        ? "İsimle birlikte gerekli artikel veya edat kullanılmalıdır. Artikel çıkarıldığında cümle eksik ya da yanlış olur."
        : content.warning,
  }));
}

function optionList(correct: string, distractors: string[]) {
  return Array.from(new Set([correct, ...distractors])).slice(0, 4);
}

function fillFromSentence(example: CurriculumExample, id: string): PracticeQuestion {
  const tokens = example.de.split(/\s+/);
  const targetIndex = Math.min(1, tokens.length - 1);
  const answer = tokens[targetIndex].replace(/[.,!?;:]/g, "");
  const prompt = tokens.map((token, index) => index === targetIndex ? "___" : token).join(" ");
  return { id, type: "FILL_IN_THE_BLANK", prompt: `Boşluğu tamamla: ${prompt}`, correctAnswer: answer, explanation: `Tam cümle “${example.de}” şeklindedir. Türkçesi: “${example.tr}”` };
}

function distinctOptions(correct: string, candidates: string[]): string[] {
  return Array.from(new Set([correct, ...candidates.filter(Boolean)])).slice(0, 4);
}

function cleanSentence(value: string): string { return value.replace(/[.!?]$/, ""); }

export function buildTopicCheckpoint(content: CurriculumUnitContent, unit: Unit): PracticeQuestion[] {
  const examples = content.examples.map((item, index) => ({
    de: item.de.replaceAll("Kadir", ["Lukas", "Anna", "Sophie", "Jonas"][index % 4]).replaceAll("Frau Kaya", "Frau Schneider"),
    tr: item.tr.replaceAll("Kadir", ["Lukas", "Anna", "Sophie", "Jonas"][index % 4]).replaceAll("Frau Kaya", "Frau Schneider"),
  }));
  const vocabulary = buildRichVocabulary(content);
  const first = examples[3] ?? examples[0];
  const second = examples[2] ?? examples[1] ?? first;
  const third = examples[1] ?? examples[0] ?? first;
  const fourth = examples[0] ?? first;
  const vocabTarget = vocabulary.find((item) => item.kind === "Fiil") ?? vocabulary[0];
  const vocabDistractors = vocabulary.filter((item) => item.word !== vocabTarget?.word).slice(0, 3).map((item) => item.meaning);
  const scenarioCorrect = unit.id === "a1-u01" ? "Hallo, ich heiße Sophie. Freut mich!" : first.de;
  const scenarioTranslation = unit.id === "a1-u01" ? "Merhaba, benim adım Sophie. Memnun oldum!" : first.tr;
  return [
    {
      id: `${unit.id}-checkpoint-mc1`, type: "MULTIPLE_CHOICE",
      prompt: `“${first.tr}” anlamını veren Almanca cümleyi seç.`,
      options: distinctOptions(first.de, [second.de, third.de]), correctAnswer: first.de,
      explanation: `Doğru cümle “${first.de}”dir. Türkçe karşılığı “${first.tr}” olur.`,
    },
    {
      id: `${unit.id}-checkpoint-mc2`, type: "MULTIPLE_CHOICE",
      prompt: `“${vocabTarget?.word}” kelimesinin Türkçe anlamı hangisidir?`,
      options: distinctOptions(vocabTarget?.meaning ?? "", vocabDistractors), correctAnswer: vocabTarget?.meaning ?? "",
      explanation: `“${vocabTarget?.word}” kelimesi bu ünitede “${vocabTarget?.meaning}” anlamıyla kullanılır. Örnek: “${vocabTarget?.exampleDe}” — “${vocabTarget?.exampleTr}”`,
    },
    {
      id: `${unit.id}-checkpoint-mc3`, type: "MULTIPLE_CHOICE",
      prompt: `Aşağıdaki cümlelerden hangisi “${content.grammarTitle}” yapısını doğru kullanır?`,
      options: distinctOptions(third.de, [makeWrongSentence(third.de, 0), makeWrongSentence(third.de, 1)]), correctAnswer: third.de,
      explanation: `Doğru biçim “${third.de}”dir. Türkçesi “${third.tr}” olur. Çekimli fiilin konumu ve gerekli artikel/edat birlikte doğru kullanılmıştır.`,
    },
    fillFromSentence(second, `${unit.id}-checkpoint-fill1`),
    fillFromSentence(fourth, `${unit.id}-checkpoint-fill2`),
    {
      id: `${unit.id}-checkpoint-order`, type: "SENTENCE_ORDERING",
      prompt: "Kelimeleri doğru sıraya koy.", tokens: cleanSentence(second.de).split(/\s+/).reverse(),
      correctAnswer: cleanSentence(second.de), explanation: `Doğru sıra “${second.de}” şeklindedir. Türkçesi: “${second.tr}”`,
    },
    {
      id: `${unit.id}-checkpoint-tr-de`, type: "TRANSLATION",
      prompt: `Türkçeden Almancaya çevir: “${third.tr}”`, correctAnswer: cleanSentence(third.de),
      acceptedAnswers: [cleanSentence(third.de)], explanation: `Model yanıt: “${third.de}”`,
    },
    {
      id: `${unit.id}-checkpoint-de-tr`, type: "TRANSLATION",
      prompt: `Almancadan Türkçeye çevir: “${fourth.de}”`, correctAnswer: cleanSentence(fourth.tr),
      acceptedAnswers: [cleanSentence(fourth.tr)], explanation: `Doğal Türkçe karşılığı: “${fourth.tr}”`,
    },
    {
      id: `${unit.id}-checkpoint-scenario`, type: "SCENARIO",
      prompt: unit.id === "a1-u01" ? "Bir dil kursunda yeni biriyle tanışıyorsun. En doğal başlangıç hangisidir?" : `Günlük bir durumda ${unit.title.toLocaleLowerCase("tr-TR")} konusuna uygun bir cümle seç.`,
      options: distinctOptions(scenarioCorrect, [second.de, "Das ist heute nicht möglich.", "Ich weiß es noch nicht."]),
      correctAnswer: scenarioCorrect,
      explanation: `Bu bağlamda “${scenarioCorrect}” ifadesi doğal ve iletişim amacına uygundur. Türkçesi: “${scenarioTranslation}”`,
    },
  ];
}

