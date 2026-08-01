import { getCurriculumContent } from "@/data/curriculum-content";
import { getV16UnitContent } from "@/data/v16-content-bank";
import { units } from "@/data/units";
import type { Unit } from "@/types/course";
import type { ContentBlock, LessonSlide } from "@/types/learning";
import { buildCommonMistakes, buildDialogue, buildListeningText, buildPrerequisites, buildReadingText, buildRegisterExamples, buildRichVocabulary, buildStructureExamples, buildTopicCheckpoint, buildUseCases } from "@/lib/learning/content-enrichment";

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

function sanitizeGrammarColumns(columns: { header: string; values: string[] }[]) {
  const safe = columns.filter((column) => {
    if (/(örnek|soru|yanıt|cümle)/i.test(column.header)) return false;
    return !column.values.some((value) => /[.!?]$/.test(value.trim()) && value.trim().split(/\s+/).length > 2);
  });
  return safe.length >= 2 ? safe : columns.slice(0, 2);
}

function createUnitSlides(unit: Unit): LessonSlide[] {
  const unitId = unit.id;
  const content = getCurriculumContent(unitId);
  const v16Content = getV16UnitContent(unitId);
  const v16ReadingQuestions = unit.courseId === "a1" ? [] : (v16Content?.readingQuestions ?? []);
  const v16ListeningQuestions = unit.courseId === "a1" ? [] : (v16Content?.listeningQuestions ?? []);
  const level = unit.courseId.toUpperCase();
  const vocabulary = buildRichVocabulary(content, unit);
  const useCases = buildUseCases(unit);
  const prerequisites = buildPrerequisites(unit);
  const structureExamples = buildStructureExamples(content, unit);
  const registerExamples = buildRegisterExamples(content, unit);
  const dialogue = buildDialogue(content, unit);
  const readingPassage = buildReadingText(content, unit);
  const listeningPassage = buildListeningText(content, unit);
  const mistakes = buildCommonMistakes(content);
  const checkpoint = buildTopicCheckpoint(content, unit);
  const vocabularyTerms = content.vocabulary.map((item) => item.split(" — ")[0].trim());
  const conjugations = vocabularyTerms
    .map((term) => ({ term, columns: conjugationColumns(term) }))
    .filter((item): item is { term: string; columns: { header: string; values: string[] }[] } => Boolean(item.columns));

  const conjugationBlocks: ContentBlock[] = conjugations.length
    ? conjugations.slice(0, 6).map((item, index) => block(`${unitId}-verb-${index + 1}`, "grammar_table", {
        title: `${item.term} · Präsens çekimi`,
        columns: item.columns,
      }))
    : [block(`${unitId}-verb-info`, "info_box", {
        title: "Fiil biçimlerini metin içinde bul",
        text: "Bu ünitede yeni bir temel fiil azsa örnek cümlelerdeki çekimli fiilleri işaretle, öznesini belirle ve sözlük biçimini not et.",
      })];

  const definitions: Array<Pick<LessonSlide, "title" | "completionRule" | "estimatedMinutes"> & { blocks: ContentBlock[] }> = [
    {
      title: "Konuya giriş, kullanım alanları ve hedefler",
      completionRule: "NEXT_CLICK",
      estimatedMinutes: 7,
      blocks: [
        block(`${unitId}-intro-heading`, "heading", { title: `${unit.title}: Bu konu nedir?` }),
        block(`${unitId}-intro-text`, "text", { text: content.intro }),
        block(`${unitId}-intro-why`, "info_box", {
          title: "Bu konuyu neden öğrenmelisin?",
          text: `${unit.title} konusu ${level} düzeyinde hem günlük iletişimde hem de yazılı görevlerde doğru ve anlaşılır cümleler kurmana yardımcı olur. Ünitenin sonunda hazır kalıpları yalnızca tanımakla kalmayacak, kendi bilgilerinle yeni cümleler de üretebileceksin.`,
        }),
        block(`${unitId}-intro-use`, "summary", { title: "Günlük hayatta kullanım alanları", items: useCases }),
        block(`${unitId}-intro-goals`, "summary", { title: "Ünite sonunda kazanacağın beceriler", items: content.goals }),
        block(`${unitId}-intro-prerequisites`, "tip_box", { title: "Başlamadan önce", text: prerequisites.join(" • ") }),
        ...(v16Content ? [block(`${unitId}-culture-note`, "info_box", {
          title: v16Content.cultureNote.title,
          text: v16Content.cultureNote.text,
        })] : []),
      ],
    },
    {
      title: "Temel kelimeler, artikeller ve çoğullar",
      completionRule: "MIN_TIME",
      estimatedMinutes: 12,
      blocks: [
        block(`${unitId}-vocab-heading`, "heading", { title: "Kelimeleri yalnızca anlamıyla değil, kullanım biçimiyle öğren" }),
        block(`${unitId}-vocab-guide`, "text", {
          text: "İsimleri artikeli ve mümkünse çoğul biçimiyle; fiilleri mastar hâliyle; kalıp ifadeleri ise bölmeden bir bütün olarak öğren. Her kelimenin yanında verilen Almanca örneği ve doğal Türkçe karşılığını birlikte oku.",
        }),
        block(`${unitId}-vocab-list`, "vocabulary_list", { title: "Ünitenin temel söz varlığı", vocabularyItems: vocabulary }),
        block(`${unitId}-vocab-pronunciation`, "task_card", {
          title: "Telaffuz çalışması",
          taskKind: "PRONUNCIATION",
          text: "Her kelimenin yanındaki dinle butonunu kullan. Önce örneği dinle, sonra kelimeyi iki kez ve örnek cümleyi bir kez yüksek sesle tekrar et.",
          checklist: ["Uzun ve kısa ünlülere dikkat et", "Kelime vurgusunu taklit et", "İsimlerde artikeli kelimeyle birlikte söyle"],
        }),
      ],
    },
    {
      title: "Dil bilgisi: tanım, işlev ve temel mantık",
      completionRule: "MIN_TIME",
      estimatedMinutes: 13,
      blocks: [
        block(`${unitId}-grammar-heading`, "heading", { title: content.grammarTitle }),
        block(`${unitId}-grammar-definition`, "text", { text: content.grammarExplanation }),
        block(`${unitId}-grammar-use`, "info_box", {
          title: "Ne zaman ve neden kullanılır?",
          text: `${content.grammarTitle} yapısı, ünitenin iletişim amacını gerçekleştirmek için cümlede kişi, zaman, ilişki veya vurgu bilgisi taşır. Yapıyı seçmeden önce ne söylemek istediğini; bilgi mi verdiğini, soru mu sorduğunu, olumsuzluk mu kurduğunu belirle.`,
        }),
        block(`${unitId}-grammar-function`, "text", { text: `“${content.grammarTitle}” konusu için: ${grammarDeepening(content.grammarTitle, level)[0]}` }),
        block(`${unitId}-grammar-method`, "text", { text: `Bu ünitede “${content.grammarTitle}” yapısını uygularken: ${grammarDeepening(content.grammarTitle, level)[1]}` }),
        block(`${unitId}-grammar-table`, "grammar_table", { title: "Temel biçimler ve çekimler", columns: sanitizeGrammarColumns(content.grammarColumns) }),
        block(`${unitId}-grammar-logic`, "tip_box", {
          title: "Kuralın mantığını çöz",
          text: "Önce cümlenin öznesini bul. Sonra çekimli fiili ve yapının gerektirdiği artikel, edat ya da bağlacı belirle. En son Almanca kelime sırasını kontrol et.",
        }),
      ],
    },
    {
      title: "Cümle sırası: olumlu, olumsuz ve soru",
      completionRule: "MIN_TIME",
      estimatedMinutes: 13,
      blocks: [
        block(`${unitId}-order-heading`, "heading", { title: "Aynı bilgiyi farklı cümle türleriyle ifade et" }),
        block(`${unitId}-order-table`, "grammar_table", {
          title: "Temel cümle şemaları",
          columns: [
            { header: "Cümle türü", values: ["Olumlu ana cümle", "Olumsuz ana cümle", "Evet-hayır sorusu", "W-sorusu"] },
            { header: "Şema", values: ["[Özne] + [çekimli fiil] + [diğer öğeler]", "[Özne] + [çekimli fiil] + ... + nicht/kein", "[Çekimli fiil] + [özne] + ...?", "[Soru kelimesi] + [çekimli fiil] + [özne] + ...?"] },
          ],
        }),
        block(`${unitId}-positive`, "bilingual_examples", { title: "Olumlu cümleler", lines: structureExamples.positive }),
        block(`${unitId}-negative`, "bilingual_examples", { title: "Olumsuz cümleler", lines: structureExamples.negative }),
        block(`${unitId}-questions`, "bilingual_examples", { title: "Evet-hayır ve soru kelimeli cümleler", lines: structureExamples.questions }),
        block(`${unitId}-order-warning`, "warning_box", {
          title: "Kelime kelime Türkçe sırasını taşıma",
          text: "Almancada çekimli fiilin yeri cümle türüne göre değişir. Türkçe cümleyi doğrudan kelime kelime çevirmek yerine önce Almanca cümle şemasını kur.",
        }),
      ],
    },
    {
      title: "Fiil çekimleri ve özne-fiil uyumu",
      completionRule: "MIN_TIME",
      estimatedMinutes: 13,
      blocks: [
        block(`${unitId}-verb-heading`, "heading", { title: "Fiilin biçimi özneye göre değişir" }),
        block(`${unitId}-verb-text`, "text", {
          text: "Fiilin sözlükteki biçimi mastardır. Cümlede özne değiştiğinde fiilin kişi eki veya kökü de değişebilir. Tabloyu satır satır okuyarak özne ile çekimli fiili birlikte öğren.",
        }),
        ...conjugationBlocks,
        block(`${unitId}-verb-examples`, "bilingual_examples", { title: "Çekimli fiili cümle içinde gör", lines: content.examples.slice(0, 4) }),
        block(`${unitId}-verb-warning`, "warning_box", {
          title: "Sık hata: mastarı olduğu gibi kullanmak",
          text: "Ana cümlede fiili çoğu zaman mastar biçiminde bırakamazsın. Özneyi bul, uygun kişi çekimini seç ve ayrılabilen fiillerde ön eki cümlenin sonuna taşı.",
        }),
      ],
    },
    {
      title: "Tekil-çoğul, resmî-samimi hitap ve istisnalar",
      completionRule: "NEXT_CLICK",
      estimatedMinutes: 9,
      blocks: [
        block(`${unitId}-register-heading`, "heading", { title: "Kime konuştuğunu cümlede göster" }),
        block(`${unitId}-register-text`, "text", {
          text: "Almancada du samimi tekil, ihr samimi çoğul, Sie ise resmî hitaptır. Sie zamiri her zaman büyük harfle yazılır ve çoğul fiil çekimiyle kullanılır. İsimlerde tekil ve çoğul biçimler artikel ile birlikte öğrenilmelidir.",
        }),
        block(`${unitId}-register-lines`, "bilingual_examples", { title: "Hitap ve sayı farkları", lines: registerExamples }),
        block(`${unitId}-exceptions`, "info_box", { title: "İstisna ve özel kullanım", text: content.warning }),
        block(`${unitId}-patterns`, "summary", {
          title: "Sık kullanılan kalıplar",
          items: content.examples.slice(0, 4).map((item) => `${item.de} — ${item.tr}`),
        }),
      ],
    },
    {
      title: "Bağlam içinde özgün örnekler",
      completionRule: "NEXT_CLICK",
      estimatedMinutes: 10,
      blocks: [
        block(`${unitId}-examples-heading`, "heading", { title: "Kuralı gerçek iletişim içinde incele" }),
        block(`${unitId}-examples-guide`, "text", {
          text: "Her örnekte çekimli fiili, özneyi ve anlamı tamamlayan öğeleri bul. Almanca cümlenin hemen altındaki Türkçe karşılığıyla anlamını kontrol et.",
        }),
        block(`${unitId}-examples`, "bilingual_examples", { title: "Almanca örnekler ve doğal Türkçe karşılıkları", lines: content.examples.map((item) => ({ ...item })) }),
        block(`${unitId}-examples-production`, "task_card", {
          title: "Kontrollü üretim",
          taskKind: "NOTE",
          text: "Örneklerden birini seç. Önce yalnızca bir kelimeyi, sonra özneyi değiştirerek iki yeni cümle kur. Türkçe anlamlarını da altına yaz.",
          checklist: ["Fiil çekimi özneye uyuyor mu?", "Artikel veya edat doğru mu?", "Türkçe çeviri Almanca cümleyle aynı anlamı veriyor mu?"],
        }),
      ],
    },
    {
      title: "Günlük yaşam diyaloğu",
      completionRule: "NEXT_CLICK",
      estimatedMinutes: 8,
      blocks: [
        block(`${unitId}-dialogue-heading`, "heading", { title: "Konuyu kısa bir konuşmada kullan" }),
        block(`${unitId}-dialogue`, "dialogue", { title: "Örnek diyalog", dialogue }),
        block(`${unitId}-dialogue-tip`, "tip_box", {
          title: "Diyaloğu nasıl çalışmalısın?",
          text: "Önce A ve B rollerini ayrı ayrı oku. Ardından isim, yer, zaman veya görüş bilgisini değiştirerek diyaloğu kendi hayatına uyarla.",
        }),
      ],
    },
    {
      title: "Okuma metni ve anlama stratejisi",
      completionRule: "MIN_TIME",
      estimatedMinutes: 10,
      blocks: [
        block(`${unitId}-reading-heading`, "heading", { title: "Kısa metni adım adım oku" }),
        block(`${unitId}-reading-strategy`, "info_box", {
          title: "Okuma stratejisi",
          text: "İlk okumada ana fikri bul. İkinci okumada kişi, yer, zaman ve neden bilgilerini işaretle. Son olarak bilmediğin kelimeleri bağlamdan tahmin et.",
        }),
        block(`${unitId}-reading`, "reading_text", { title: "Okuma metni ve Türkçe karşılığı", passage: readingPassage }),
        block(`${unitId}-reading-check`, "task_card", {
          title: "Metni anladığını kontrol et",
          taskKind: "NOTE",
          text: "Metnin ana fikrini Türkçe bir cümleyle yaz. Ardından Almanca iki anahtar kelime ve bir çekimli fiil seç.",
          checklist: ["Metin kimin veya neyin hakkında?", "En önemli bilgi nedir?", "Hangi cümle ünitenin dil bilgisi yapısını gösteriyor?"],
        }),
        ...(v16ReadingQuestions.length ? [block(`${unitId}-reading-v16-questions`, "practice_set", {
          title: "Okuduğunu anlama soruları",
          practiceQuestions: v16ReadingQuestions,
        })] : []),
      ],
    },
    {
      title: "Dinleme metni ve not alma",
      completionRule: "MIN_TIME",
      estimatedMinutes: 9,
      blocks: [
        block(`${unitId}-listening-heading`, "heading", { title: "Dinlerken her kelimeyi anlamaya çalışma" }),
        block(`${unitId}-listening-strategy`, "text", {
          text: "Birinci dinlemede konuşmanın konusunu, ikinci dinlemede ayrıntıları yakala. Anahtar kelimeleri kısa notlarla yaz; bütün cümleyi yazmaya çalışmak önemli bilgiyi kaçırmana neden olabilir.",
        }),
        block(`${unitId}-listening`, "listening_text", { title: "Dinleme metni ve Türkçe karşılığı", passage: listeningPassage }),
        block(`${unitId}-listening-task`, "task_card", {
          title: "Not alma görevi",
          taskKind: "NOTE",
          text: "Metni sesli okuyan bir arkadaşını veya tarayıcı telaffuz özelliğini dinle. Duyduğun üç anahtar kelimeyi ve bir önemli bilgiyi not et.",
          checklist: ["Konu", "Kişi/kurum", "Yer veya zaman", "Ana sonuç"],
        }),
        ...(v16ListeningQuestions.length ? [block(`${unitId}-listening-v16-questions`, "practice_set", {
          title: "Dinlediğini anlama soruları",
          practiceQuestions: v16ListeningQuestions,
        })] : []),
      ],
    },
    {
      title: "Yazma çalışması",
      completionRule: "NEXT_CLICK",
      estimatedMinutes: 10,
      blocks: [
        block(`${unitId}-writing-heading`, "heading", { title: "Öğrendiklerini kısa bir metinde kullan" }),
        block(`${unitId}-writing-task`, "task_card", {
          title: `${unit.title} hakkında yaz`,
          taskKind: "WRITING",
          text: v16Content?.writingPrompt ?? `${level === "A1" ? "4-6" : level === "A2" ? "6-8" : level === "B1" ? "90-120 kelimelik" : "140-180 kelimelik"} bir metin yaz. Ünitenin temel kelimelerinden en az üçünü ve “${content.grammarTitle}” yapısını en az bir kez kullan.`,
          checklist: ["Metnin amacı açık mı?", "Cümleler mantıklı sırada mı?", "Fiil ve artikel kullanımları doğru mu?", "Almanca cümlelerin anlamı yazmak istediğin Türkçe düşünceyle uyuşuyor mu?"],
          usefulPhrases: content.examples.slice(0, 3),
        }),
      ],
    },
    {
      title: "Konuşma ve telaffuz çalışması",
      completionRule: "NEXT_CLICK",
      estimatedMinutes: 9,
      blocks: [
        block(`${unitId}-speaking-heading`, "heading", { title: "Kısa, doğru ve anlaşılır konuş" }),
        block(`${unitId}-speaking-task`, "task_card", {
          title: "Konuşma görevi",
          taskKind: "SPEAKING",
          text: v16Content?.speakingPrompt ?? `${unit.title} konusunda 45-90 saniyelik bir konuşma hazırla. Önce üç anahtar kelime yaz, sonra tam cümle kurmadan konuşmayı dene.`,
          checklist: ["En az bir soru cümlesi kullan", "Bir olumlu ve bir olumsuz cümle kur", "Resmî veya samimi hitabı bağlama uygun seç", "Fiil çekimlerini açık söyle"],
          usefulPhrases: content.examples.slice(1, 4),
        }),
      ],
    },
    {
      title: "Yaygın hatalar: yanlış, doğru ve neden",
      completionRule: "MINI_CHECK",
      estimatedMinutes: 9,
      blocks: [
        block(`${unitId}-mistakes-heading`, "heading", { title: "Hatanın yalnızca doğrusunu değil, nedenini de öğren" }),
        block(`${unitId}-mistakes`, "mistake_list", { title: "Sık yapılan hatalar", mistakes }),
        block(`${unitId}-warning`, "warning_box", { title: "Bu ünitede özellikle dikkat et", text: content.warning }),
        block(`${unitId}-mini-check`, "mini_check", {
          miniCheck: {
            ...content.miniCheck,
            explanation: `Doğru cevap “${content.miniCheck.correctAnswer}” biçimindedir. ${content.warning}`,
            wrongFeedback: Object.fromEntries(content.miniCheck.options
              .filter((option) => option !== content.miniCheck.correctAnswer)
              .map((option) => [option, `“${option}” bu soruda istenen anlamı veya dil bilgisi işlevini karşılamaz. Doğru seçenek “${content.miniCheck.correctAnswer}” biçimindedir. ${content.warning}`])),
          },
        }),
      ],
    },
    {
      title: "Konu özeti ve kendi kendine değerlendirme",
      completionRule: "MANUAL",
      estimatedMinutes: 7,
      blocks: [
        block(`${unitId}-summary`, "summary", {
          title: "Bu ünitede öğrendiklerin",
          items: [
            ...content.summary,
            "temel kelimeleri artikel, çoğul ve örnek cümleyle kullanma",
            "olumlu, olumsuz, evet-hayır ve W-sorusu kurma",
            "günlük diyalog, okuma, dinleme, yazma ve konuşma görevleri üretme",
            ...(v16Content ? [`Gerçek yaşam görevi: ${v16Content.realLifeMission}`] : []),
          ],
        }),
        block(`${unitId}-summary-check`, "info_box", {
          title: "Hazır mısın?",
          text: "Aşağıdaki ifadeleri yapabiliyorsan konu sonu kontrolüne geç: temel kelimeleri açıklayabiliyorum; fiili özneye göre çekebiliyorum; olumlu, olumsuz ve soru cümlesi kurabiliyorum; kısa bir diyalog ve metin üretebiliyorum.",
        }),
      ],
    },
    {
      title: "Konu sonu kontrolü",
      completionRule: "MANUAL",
      estimatedMinutes: 14,
      blocks: [
        block(`${unitId}-checkpoint-heading`, "heading", { title: "Ana alıştırmalardan önce bilgini kontrol et" }),
        block(`${unitId}-checkpoint-note`, "info_box", {
          title: "Bu sorular ana alıştırmalarda tekrarlanmaz",
          text: "Üç çoktan seçmeli, iki boşluk doldurma, bir cümle sıralama, iki çeviri ve bir günlük yaşam senaryosuyla konuyu farklı açılardan gözden geçir.",
        }),
        block(`${unitId}-checkpoint`, "practice_set", { title: "Konu sonu kontrol soruları", practiceQuestions: checkpoint }),
        block(`${unitId}-next-stage`, "tip_box", {
          title: "Sonraki aşama",
          text: "Bu slaytı tamamladığında ünitenin ana alıştırmaları açılır. Ana alıştırmalar ve ünite testi farklı soru bağlamları kullanır.",
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
export const slidesPerUnit = 15;
