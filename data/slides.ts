import { getCurriculumContent } from "@/data/curriculum-content";
import { units } from "@/data/units";
import type { Unit } from "@/types/course";
import type { ContentBlock, LessonSlide } from "@/types/learning";

const block = (
  id: string,
  type: ContentBlock["type"],
  extra: Omit<ContentBlock, "id" | "type"> = {},
): ContentBlock => ({ id, type, ...extra });

const persons = ["ich", "du", "er/sie/es", "wir", "ihr", "Sie/sie"] as const;

const irregularPresent: Record<string, string[]> = {
  sein: ["bin", "bist", "ist", "sind", "seid", "sind"],
  haben: ["habe", "hast", "hat", "haben", "habt", "haben"],
  werden: ["werde", "wirst", "wird", "werden", "werdet", "werden"],
  können: ["kann", "kannst", "kann", "können", "könnt", "können"],
  müssen: ["muss", "musst", "muss", "müssen", "müsst", "müssen"],
  wollen: ["will", "willst", "will", "wollen", "wollt", "wollen"],
  sollen: ["soll", "sollst", "soll", "sollen", "sollt", "sollen"],
  dürfen: ["darf", "darfst", "darf", "dürfen", "dürft", "dürfen"],
  mögen: ["mag", "magst", "mag", "mögen", "mögt", "mögen"],
  wissen: ["weiß", "weißt", "weiß", "wissen", "wisst", "wissen"],
  sprechen: ["spreche", "sprichst", "spricht", "sprechen", "sprecht", "sprechen"],
  lesen: ["lese", "liest", "liest", "lesen", "lest", "lesen"],
  sehen: ["sehe", "siehst", "sieht", "sehen", "seht", "sehen"],
  fahren: ["fahre", "fährst", "fährt", "fahren", "fahrt", "fahren"],
  schlafen: ["schlafe", "schläfst", "schläft", "schlafen", "schlaft", "schlafen"],
  tragen: ["trage", "trägst", "trägt", "tragen", "tragt", "tragen"],
  nehmen: ["nehme", "nimmst", "nimmt", "nehmen", "nehmt", "nehmen"],
  geben: ["gebe", "gibst", "gibt", "geben", "gebt", "geben"],
  helfen: ["helfe", "hilfst", "hilft", "helfen", "helft", "helfen"],
  treffen: ["treffe", "triffst", "trifft", "treffen", "trefft", "treffen"],
  essen: ["esse", "isst", "isst", "essen", "esst", "essen"],
  laufen: ["laufe", "läufst", "läuft", "laufen", "lauft", "laufen"],
  empfehlen: ["empfehle", "empfiehlst", "empfiehlt", "empfehlen", "empfehlt", "empfehlen"],
  gehen: ["gehe", "gehst", "geht", "gehen", "geht", "gehen"],
  stehen: ["stehe", "stehst", "steht", "stehen", "steht", "stehen"],
  kommen: ["komme", "kommst", "kommt", "kommen", "kommt", "kommen"],
  heißen: ["heiße", "heißt", "heißt", "heißen", "heißt", "heißen"],
  tun: ["tue", "tust", "tut", "tun", "tut", "tun"],
  bringen: ["bringe", "bringst", "bringt", "bringen", "bringt", "bringen"],
  denken: ["denke", "denkst", "denkt", "denken", "denkt", "denken"],
  beginnen: ["beginne", "beginnst", "beginnt", "beginnen", "beginnt", "beginnen"],
  finden: ["finde", "findest", "findet", "finden", "findet", "finden"],
  fangen: ["fange", "fängst", "fängt", "fangen", "fangt", "fangen"],
  halten: ["halte", "hältst", "hält", "halten", "haltet", "halten"],
  laden: ["lade", "lädst", "lädt", "laden", "ladet", "laden"],
  wachsen: ["wachse", "wächst", "wächst", "wachsen", "wachst", "wachsen"],
  treten: ["trete", "trittst", "tritt", "treten", "tretet", "treten"],
  weisen: ["weise", "weist", "weist", "weisen", "weist", "weisen"],
  werfen: ["werfe", "wirfst", "wirft", "werfen", "werft", "werfen"],
  ziehen: ["ziehe", "ziehst", "zieht", "ziehen", "zieht", "ziehen"],
  bleiben: ["bleibe", "bleibst", "bleibt", "bleiben", "bleibt", "bleiben"],
  lassen: ["lasse", "lässt", "lässt", "lassen", "lasst", "lassen"],
  bewerben: ["bewerbe", "bewirbst", "bewirbt", "bewerben", "bewerbt", "bewerben"],
  übertragen: ["übertrage", "überträgst", "überträgt", "übertragen", "übertragt", "übertragen"],
  verstoßen: ["verstoße", "verstößt", "verstößt", "verstoßen", "verstoßt", "verstoßen"],
};

const separableVerbs: Record<string, { base: string; prefix: string }> = {
  anfangen: { base: "fangen", prefix: "an" },
  aufstehen: { base: "stehen", prefix: "auf" },
  einkaufen: { base: "kaufen", prefix: "ein" },
  mitkommen: { base: "kommen", prefix: "mit" },
  stattfinden: { base: "finden", prefix: "statt" },
  abfahren: { base: "fahren", prefix: "ab" },
  ankommen: { base: "kommen", prefix: "an" },
  aufwachsen: { base: "wachsen", prefix: "auf" },
  umsteigen: { base: "steigen", prefix: "um" },
  umziehen: { base: "ziehen", prefix: "um" },
  umtauschen: { base: "tauschen", prefix: "um" },
  hochladen: { base: "laden", prefix: "hoch" },
  herunterladen: { base: "laden", prefix: "herunter" },
  mitbringen: { base: "bringen", prefix: "mit" },
  zusagen: { base: "sagen", prefix: "zu" },
  absagen: { base: "sagen", prefix: "ab" },
  ausfüllen: { base: "füllen", prefix: "aus" },
  ausruhen: { base: "ruhen", prefix: "aus" },
  abgeben: { base: "geben", prefix: "ab" },
  vorhaben: { base: "haben", prefix: "vor" },
  zurückgeben: { base: "geben", prefix: "zurück" },
  zuhören: { base: "hören", prefix: "zu" },
  zurückgehen: { base: "gehen", prefix: "zurück" },
  zusammenfassen: { base: "fassen", prefix: "zusammen" },
  eingehen: { base: "gehen", prefix: "ein" },
  entgegenkommen: { base: "kommen", prefix: "entgegen" },
  einordnen: { base: "ordnen", prefix: "ein" },
  einschätzen: { base: "schätzen", prefix: "ein" },
  fertigstellen: { base: "stellen", prefix: "fertig" },
  wiederverwenden: { base: "verwenden", prefix: "wieder" },
  überleiten: { base: "leiten", prefix: "über" },
  hervorheben: { base: "heben", prefix: "hervor" },
  einhalten: { base: "halten", prefix: "ein" },
  ausbauen: { base: "bauen", prefix: "aus" },
  einräumen: { base: "räumen", prefix: "ein" },
  auslassen: { base: "lassen", prefix: "aus" },
  wahrnehmen: { base: "nehmen", prefix: "wahr" },
};

const genericSeparablePrefixes = ["herunter", "zurück", "zusammen", "hervor", "entgegen", "weiter", "fertig", "statt", "hoch", "teil", "ab", "an", "auf", "aus", "ein", "fest", "mit", "nach", "vor", "weg", "zu"] as const;
const genericSeparableExceptions = new Set(["festigen"]);
const verbCandidateStopwords = new Set(["gegen", "wegen", "zwischen", "folgend", "folgenden", "geboren"]);
const dativeReflexiveVerbs = new Set(["merken", "leisten", "vorstellen", "vornehmen"]);

function getSeparableVerb(infinitive: string): { base: string; prefix: string } | undefined {
  if (separableVerbs[infinitive]) return separableVerbs[infinitive];
  if (genericSeparableExceptions.has(infinitive)) return undefined;
  const prefix = genericSeparablePrefixes.find((item) => infinitive.startsWith(item) && infinitive.length > item.length + 2);
  if (!prefix) return undefined;
  const base = infinitive.slice(prefix.length);
  return /(?:en|ern|eln|ieren)$/.test(base) ? { base, prefix } : undefined;
}

const nonVerbTerms = new Set(["Guten Morgen", "Guten Tag", "umstritten", "ausgewogen", "im Folgenden", "neben"]);

function regularForms(infinitive: string): string[] {
  let stem = infinitive.endsWith("en") ? infinitive.slice(0, -2) : infinitive.endsWith("n") ? infinitive.slice(0, -1) : infinitive;
  if (infinitive.endsWith("eln")) stem = `${infinitive.slice(0, -3)}el`;
  const last = stem.at(-1) ?? "";
  const previous = stem.at(-2) ?? "";
  const beforePrevious = stem.at(-3) ?? "";
  const consonantBeforeMN = /[mn]/.test(last) && !/[lr]/.test(previous) && previous !== last && !(previous === "h" && /[aeiouäöü]/.test(beforePrevious));
  const needsE = /[td]$/.test(stem) || consonantBeforeMN;
  const duEnding = /[sxzß]$/.test(stem) ? "t" : needsE ? "est" : "st";
  const erEnding = needsE ? "et" : "t";
  const ihrEnding = needsE ? "et" : "t";
  const ich = infinitive.endsWith("eln") ? `${infinitive.slice(0, -3)}le` : `${stem}e`;
  return [ich, `${stem}${duEnding}`, `${stem}${erEnding}`, infinitive, `${stem}${ihrEnding}`, infinitive];
}

function conjugateSimple(infinitive: string): string[] {
  if (irregularPresent[infinitive]) return irregularPresent[infinitive];
  const separable = getSeparableVerb(infinitive);
  if (separable) return conjugateSimple(separable.base).map((form) => `${form} ${separable.prefix}`);
  return regularForms(infinitive);
}

function getVerbInfo(term: string): { display: string; infinitive: string; reflexive: boolean; complement?: string } | undefined {
  const cleaned = term.trim();
  if (!cleaned || nonVerbTerms.has(cleaned) || /^(der|die|das|ein|eine)\s/.test(cleaned)) return undefined;
  const reflexive = cleaned.startsWith("sich ");
  const withoutReflexive = reflexive ? cleaned.slice(5) : cleaned;
  const tokens = withoutReflexive.split(/\s+/);
  const candidate = tokens.findLast((token) => {
    const normalized = token.toLocaleLowerCase("de-DE").replace(/[.,;:!?]/g, "");
    return /(?:en|ern|eln|ieren)$/.test(normalized) && !verbCandidateStopwords.has(normalized);
  });
  if (!candidate || /^[A-ZÄÖÜ]/.test(candidate)) return undefined;
  const infinitive = candidate.replace(/[.,;:!?]/g, "");
  const complement = tokens.length > 1 ? withoutReflexive.replace(candidate, "").trim() : undefined;
  return { display: cleaned, infinitive, reflexive, complement };
}

function conjugationColumns(term: string): { header: string; values: string[] }[] | undefined {
  const info = getVerbInfo(term);
  if (!info) return undefined;
  const accusativeReflexive = ["mich", "dich", "sich", "uns", "euch", "sich"];
  const dativeReflexive = ["mir", "dir", "sich", "uns", "euch", "sich"];
  const reflexivePronouns = dativeReflexiveVerbs.has(info.infinitive) ? dativeReflexive : accusativeReflexive;
  const separable = getSeparableVerb(info.infinitive);
  const baseForms = separable ? conjugateSimple(separable.base) : conjugateSimple(info.infinitive);
  const prepositionCases: Record<string, string> = { an: "an + Akk.", auf: "auf + Akk.", gegen: "gegen + Akk.", um: "um + Akk.", mit: "mit + Dat.", von: "von + Dat.", zu: "zu + Dat." };
  const complementText = info.complement ? (prepositionCases[info.complement] ?? info.complement) : "";
  const forms = baseForms.map((form, index) => {
    const reflexive = info.reflexive ? ` ${reflexivePronouns[index]}` : "";
    const complement = complementText ? ` ${complementText}` : "";
    const prefix = separable ? ` ${separable.prefix}` : "";
    return `${form}${reflexive}${complement}${prefix}`.trim();
  });
  return [
    { header: "Kişi", values: [...persons] },
    { header: info.display, values: forms },
  ];
}

function grammarDeepening(title: string, level: string): string[] {
  const normalized = title.toLocaleLowerCase("de-DE");
  if (normalized.includes("passiv")) return [
    "Passiv yapıda konuşanın odağı eylemi yapan kişi değil, eylemin kendisi ve sonucudur. Vorgangspassiv çoğunlukla werden + Partizip II ile kurulur; zaman bilgisi çekimli werden fiilinde taşınır.",
    "Cümleyi dönüştürürken önce aktif cümledeki Akkusativ nesneyi bul, onu pasif cümlenin öznesi yap ve ana fiili Partizip II biçimine getir.",
  ];
  if (normalized.includes("konjunktiv")) return [
    "Konjunktiv yapıları gerçek olmayan durumları, nazik istekleri, önerileri veya dolaylı aktarımları ifade eder. Anlamı doğru kurmak için kipin işlevini bağlamdan belirlemek gerekir.",
    "Önce cümlenin gerçek bilgi mi, varsayım mı yoksa aktarılan söz mü bildirdiğini belirle; ardından uygun yardımcı fiil ve fiil biçimini seç.",
  ];
  if (normalized.includes("perfekt") || normalized.includes("präteritum") || normalized.includes("plusquamperfekt") || normalized.includes("vergangen")) return [
    "Geçmiş zaman seçimi anlatım türüne bağlıdır. Günlük konuşmada Perfekt, yazılı anlatıda Präteritum; geçmişte başka bir olaydan daha önce gerçekleşen eylem için Plusquamperfekt kullanılır.",
    "Zaman çizgisini kur: önce hangi olayın önce, hangisinin sonra gerçekleştiğini belirle. Ardından yardımcı fiil ve Partizip II biçimini kontrol et.",
  ];
  if (normalized.includes("relativ") || normalized.includes("nebensatz") || normalized.includes("konnektor") || normalized.includes("satz")) return [
    "Yan cümlede çekimli fiil çoğunlukla sona gider. Bağlaç veya relatif zamir cümlenin başında yer alır; özne ve diğer öğelerden sonra fiil son konumda tamamlanır.",
    "Ana cümle ile yan cümleyi virgülle ayır. Yan cümleyi ana cümlenin önüne aldığında ana cümlede çekimli fiilin ikinci konumda kalmasına dikkat et.",
  ];
  if (normalized.includes("adjektiv")) return [
    "Sıfatın aldığı ek; artikelle, isim hâliyle ve tekil-çoğul bilgisiyle birlikte belirlenir. Bu nedenle yalnızca sıfatı değil, tüm isim grubunu birlikte incelemek gerekir.",
    "Önce artikeli ve Kasus'u belirle, sonra sıfat ekini seç. Cümleyi sesli okuyarak isim grubunun bütünlüğünü kontrol et.",
  ];
  if (normalized.includes("präposition") || normalized.includes("dativ") || normalized.includes("akkusativ")) return [
    "Edatlar kendilerinden sonra gelen isim grubunun hâlini belirleyebilir. Edatı tek başına değil, gerektirdiği Kasus ve örnek bir isim grubuyla birlikte öğren.",
    "Wechselpräpositionlarda hareket-yön sorusu wohin?, konum sorusu wo? ile kontrol edilir. Bu ayrım Akkusativ ve Dativ seçiminde yardımcı olur.",
  ];
  return level === "A1" || level === "A2" ? [
    "Almanca ana cümlede çekimli fiil çoğunlukla ikinci konumdadır. Özne değiştiğinde fiilin kişi eki de değişir; bu yüzden özne ve fiili birlikte öğrenmek önemlidir.",
    "Önce kısa bir model cümle kur, daha sonra özneyi, zamanı veya tamamlayıcıyı değiştirerek aynı yapıyla yeni cümleler üret.",
  ] : [
    "Bu yapıyı yalnızca kural olarak ezberlemek yerine metindeki işleviyle birlikte incele. Cümlenin neyi vurguladığını ve öğelerin sırasının anlamı nasıl etkilediğini gözlemle.",
    "Kuralı uygularken çekimli fiilin konumunu, isim hâllerini ve bağlaçların cümle yapısına etkisini birlikte kontrol et.",
  ];
}

function createUnitSlides(unit: Unit): LessonSlide[] {
  const unitId = unit.id;
  const content = getCurriculumContent(unitId);
  const vocabularyTerms = content.vocabulary.map((item) => item.split(" — ")[0].trim());
  const conjugations = vocabularyTerms
    .map((term) => ({ term, columns: conjugationColumns(term) }))
    .filter((item): item is { term: string; columns: { header: string; values: string[] }[] } => Boolean(item.columns));

  const exampleBlocks: ContentBlock[] = content.examples.flatMap((example, index) => [
    block(`${unitId}-example-${index + 1}`, "example", {
      title: `Örnek ${index + 1}`,
      text: example.de,
    }),
    block(`${unitId}-translation-${index + 1}`, "translation", {
      title: "Türkçe anlamı",
      text: example.tr,
    }),
  ]);

  const deepening = grammarDeepening(content.grammarTitle, unit.courseId.toUpperCase());
  const conjugationBlocks: ContentBlock[] = conjugations.length ? conjugations.flatMap((item, index) => [
    block(`${unitId}-verb-heading-${index + 1}`, "grammar_table", {
      title: `${item.term} · Präsens çekimi`,
      columns: item.columns,
    }),
  ]) : [
    block(`${unitId}-verb-info`, "info_box", {
      title: "Fiil kullanımı",
      text: "Bu ünitede yeni bir temel fiil bulunmuyorsa, örnek cümlelerdeki çekimli fiilleri özneyle birlikte işaretle ve fiilin sözlük biçimini not et.",
    }),
  ];

  const definitions: Array<
    Pick<LessonSlide, "title" | "completionRule" | "estimatedMinutes"> & {
      blocks: ContentBlock[];
    }
  > = [
    {
      title: "Üniteye giriş ve hedefler",
      completionRule: "NEXT_CLICK",
      estimatedMinutes: 4,
      blocks: [
        block(`${unitId}-intro-heading`, "heading", { title: "Bu ünitede ne öğreneceksin?" }),
        block(`${unitId}-intro-text`, "text", { text: content.intro }),
        block(`${unitId}-intro-importance`, "info_box", {
          title: "Bu konu neden önemli?",
          text: `${unit.title} konusu, ${unit.courseId.toUpperCase()} düzeyinde günlük veya akademik iletişimde sık karşılaşılan durumları daha doğru anlamanı ve kendi cümlelerini daha güvenli kurmanı sağlar.`,
        }),
        block(`${unitId}-intro-goals`, "summary", {
          title: "Öğrenme hedefleri",
          items: content.goals,
        }),
      ],
    },
    {
      title: content.grammarTitle,
      completionRule: "MIN_TIME",
      estimatedMinutes: 10,
      blocks: [
        block(`${unitId}-grammar-heading`, "heading", { title: content.grammarTitle }),
        block(`${unitId}-grammar-text`, "text", { text: content.grammarExplanation }),
        block(`${unitId}-grammar-deep-1`, "text", { text: deepening[0] }),
        block(`${unitId}-grammar-deep-2`, "text", { text: deepening[1] }),
        block(`${unitId}-grammar-table`, "grammar_table", {
          title: "Yapı ve kullanım tablosu",
          columns: content.grammarColumns,
        }),
        block(`${unitId}-grammar-practice`, "tip_box", {
          title: "Kuralı nasıl çalışmalısın?",
          text: "Tablodaki her satırı önce sesli oku. Daha sonra aynı yapıyı kendi hayatından bir bilgiyle yeniden kur ve çekimli fiilin konumunu kontrol et.",
        }),
      ],
    },
    {
      title: "Temel kelimeler ve ifadeler",
      completionRule: "NEXT_CLICK",
      estimatedMinutes: 7,
      blocks: [
        block(`${unitId}-vocab-heading`, "heading", { title: "Kelime listesini anlam ve tür bilgisiyle öğren" }),
        block(`${unitId}-vocab-list`, "vocabulary_list", {
          title: "Bu ünitenin temel söz varlığı",
          items: content.vocabulary,
        }),
        block(`${unitId}-vocab-note`, "info_box", {
          title: "Kelime öğrenme yöntemi",
          text: "İsimleri artikeliyle, fiilleri mastar biçimiyle ve ifadeleri bir bütün olarak öğren. Her kelime için kısa bir örnek cümle üret; yalnızca Türkçe karşılığını ezberlemekle yetinme.",
        }),
        block(`${unitId}-study-tip`, "tip_box", {
          title: "Çalışma önerisi",
          text: content.tip,
        }),
      ],
    },
    {
      title: "Fiil çekimleri ve cümle kurma",
      completionRule: "MIN_TIME",
      estimatedMinutes: 10,
      blocks: [
        block(`${unitId}-verb-heading`, "heading", { title: "Ünitedeki fiilleri çekimli biçimleriyle öğren" }),
        block(`${unitId}-verb-text`, "text", {
          text: "Fiilin sözlükteki biçimi mastardır. Cümlede ise özneye göre çekimlenir. Aşağıdaki tablolarda ünitenin kelime listesinde geçen fiillerin Präsens çekimlerini görebilirsin.",
        }),
        ...conjugationBlocks,
        block(`${unitId}-verb-warning`, "warning_box", {
          title: "Özne-fiil uyumunu kontrol et",
          text: "Bir cümle kurduğunda önce özneyi belirle, ardından fiilin o özneye uygun biçimini seç. Ayrılabilen fiillerde ön ek ana cümlenin sonuna gider.",
        }),
      ],
    },
    {
      title: "Cümle kalıpları ve üretim",
      completionRule: "NEXT_CLICK",
      estimatedMinutes: 8,
      blocks: [
        block(`${unitId}-patterns-heading`, "heading", { title: "Hazır kalıplardan kendi cümlelerine geç" }),
        block(`${unitId}-patterns-table`, "grammar_table", {
          title: "Kullanabileceğin üç model",
          columns: [
            { header: "İşlev", values: ["Bilgi verme", "Soru sorma", "Kendi cümleni üretme"] },
            { header: "Model", values: [content.examples[0]?.de ?? "—", content.miniCheck.correctAnswer, content.translation.answer] },
          ],
        }),
        block(`${unitId}-patterns-text`, "text", {
          text: "Model cümlede yalnızca bir öğeyi değiştirerek yeni cümleler üret. Ardından ikinci bir öğeyi değiştir ve fiil çekiminin doğru kalıp kalmadığını kontrol et.",
        }),
        block(`${unitId}-patterns-tip`, "tip_box", {
          title: "Üretim egzersizi",
          text: "Bir model seç; aynı yapıyla üç yeni cümle yaz. Cümlelerden birini soru biçimine dönüştür ve kısa bir yanıt oluştur.",
        }),
      ],
    },
    {
      title: "Bağlam içinde örnekler",
      completionRule: "NEXT_CLICK",
      estimatedMinutes: 9,
      blocks: [
        block(`${unitId}-examples-heading`, "heading", {
          title: "Yapıyı gerçek cümlelerde incele",
        }),
        block(`${unitId}-examples-guide`, "text", {
          text: "Her örnekte önce çekimli fiili bul, sonra özneyi ve tamamlayıcıları işaretle. Türkçe çeviriyi kontrol etmeden önce cümlenin ana anlamını tahmin etmeye çalış.",
        }),
        ...exampleBlocks,
      ],
    },
    {
      title: "Sık hatalar ve mini kontrol",
      completionRule: "MINI_CHECK",
      estimatedMinutes: 6,
      blocks: [
        block(`${unitId}-warning`, "warning_box", {
          title: "Dikkat edilmesi gereken nokta",
          text: content.warning,
        }),
        block(`${unitId}-error-strategy`, "info_box", {
          title: "Kendi hatanı nasıl bulursun?",
          text: "Cümleni üç aşamada kontrol et: 1) Özne ve fiil uyumlu mu? 2) Çekimli fiil doğru konumda mı? 3) Artikel, edat veya bağlaç yapıya uygun mu?",
        }),
        block(`${unitId}-mini-check`, "mini_check", {
          miniCheck: content.miniCheck,
        }),
      ],
    },
    {
      title: "Ünite özeti ve alıştırmaya hazırlık",
      completionRule: "MANUAL",
      estimatedMinutes: 4,
      blocks: [
        block(`${unitId}-summary`, "summary", {
          title: "Bu ünitede öğrendiklerin",
          items: [...content.summary, "ünitedeki temel fiilleri özneye göre çekimleme", "model cümlelerden yeni cümleler üretme"],
        }),
        block(`${unitId}-divider`, "divider"),
        block(`${unitId}-next-stage`, "info_box", {
          title: "Sonraki aşama",
          text: "Bütün zorunlu slaytları tamamladığında bu ünitenin on alıştırması ve ardından yedi soruluk ünite sonu değerlendirmesi açılır.",
        }),
      ],
    },
  ];

  return definitions.map((definition, index) => {
    const id = `${unitId}-s${index + 1}`;
    return {
      id,
      unitId,
      order: index + 1,
      title: definition.title,
      contentBlocks: definition.blocks,
      estimatedMinutes: definition.estimatedMinutes,
      isRequired: true,
      completionRule: definition.completionRule,
      minimumViewSeconds: definition.completionRule === "MIN_TIME" ? 8 : undefined,
      previousSlideId: index > 0 ? `${unitId}-s${index}` : undefined,
      nextSlideId: index < definitions.length - 1 ? `${unitId}-s${index + 2}` : undefined,
      status: "PUBLISHED",
    } satisfies LessonSlide;
  });
}

export const slides: LessonSlide[] = units.flatMap((unit) => createUnitSlides(unit));
export const slidesPerUnit = 8;
