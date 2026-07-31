import { getCurriculumContent } from "@/data/curriculum-content";
import { units } from "@/data/units";
import type { Unit } from "@/types/course";
import type { Exercise, ExerciseOption, ExerciseType, UnitQuiz, UnitQuizQuestion } from "@/types/exercise";
import type { CurriculumUnitContent } from "@/types/content";

const option = (id: string, label: string): ExerciseOption => ({ id, label, value: label });

function exerciseTypes(courseId: string): ExerciseType[] {
  if (courseId === "b1" || courseId === "b2") {
    return [
      "MULTIPLE_CHOICE",
      "MULTIPLE_SELECT",
      "TRUE_FALSE",
      "FILL_IN_THE_BLANK",
      "MATCHING",
      "SENTENCE_ORDERING",
      "TRANSLATION",
      "SHORT_ANSWER",
      "WRITING_ASSIGNMENT",
      "MULTIPLE_CHOICE",
    ];
  }
  return [
    "MULTIPLE_CHOICE",
    "MULTIPLE_SELECT",
    "TRUE_FALSE",
    "FILL_IN_THE_BLANK",
    "MATCHING",
    "SENTENCE_ORDERING",
    "TRANSLATION",
    "DIALOGUE_COMPLETION",
    "MULTIPLE_CHOICE",
    "FILL_IN_THE_BLANK",
  ];
}

type VocabularyEntry = { de: string; tr: string };

function parseVocabulary(item: string): VocabularyEntry {
  const [de, ...translationParts] = item.split(" — ");
  return { de: de.trim(), tr: translationParts.join(" — ").trim() };
}

function unitSeed(unit: Unit, extra = 0): number {
  return unit.order * 7 + unit.courseId.charCodeAt(0) + extra;
}

function rotate<T>(values: T[], amount: number): T[] {
  if (!values.length) return values;
  const index = ((amount % values.length) + values.length) % values.length;
  return [...values.slice(index), ...values.slice(0, index)];
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}

function makeChoices(correct: string, distractors: string[], seed: number, fallbackPrefix: string): string[] {
  const values = unique([correct, ...distractors]);
  while (values.length < 3) values.push(`${fallbackPrefix} ${values.length + 1}`);
  return rotate(values.slice(0, 4), seed);
}

function vocabularyPairs(unitId: string) {
  return getCurriculumContent(unitId).vocabulary.slice(0, 5).map((item) => {
    const entry = parseVocabulary(item);
    return { left: entry.de, right: entry.tr };
  });
}

function createFillFromExample(content: CurriculumUnitContent, exampleIndex: number, targetOffset = 1) {
  const example = content.examples[exampleIndex % content.examples.length] ?? content.examples[0];
  const tokens = example.de.split(/\s+/);
  const usableIndexes = tokens
    .map((token, index) => ({ token, index }))
    .filter(({ token }) => token.replace(/[.,!?;:]/g, "").length > 2)
    .map(({ index }) => index);
  const targetIndex = usableIndexes[Math.min(targetOffset, Math.max(0, usableIndexes.length - 1))] ?? Math.min(1, tokens.length - 1);
  const rawAnswer = tokens[targetIndex] ?? "";
  const answer = rawAnswer.replace(/[.,!?;:]/g, "");
  const prompt = tokens.map((token, index) => index === targetIndex ? "___" : token).join(" ");
  return {
    prompt: `Cümleyi tamamla: ${prompt}`,
    answer,
    acceptedAnswers: [answer],
    fullSentence: example.de,
    translation: example.tr,
  };
}

function firstSentence(text: string): string {
  const match = text.match(/^.*?[.!?](?:\s|$)/);
  return (match?.[0] ?? text).trim();
}

function createExercise(unit: Unit, order: number, type: ExerciseType): Exercise {
  const content = getCurriculumContent(unit.id);
  const id = `${unit.id}-v8-e${order}`;
  const common = {
    id,
    unitId: unit.id,
    groupId: `${unit.id}-practice-v8`,
    order,
    type,
    relatedSlideId: `${unit.id}-s${Math.min(order, 8)}`,
    isRequired: true,
    maxAttempts: 2,
    points: 10,
  } as const;

  switch (type) {
    case "MULTIPLE_CHOICE": {
      if (order === 1) {
        const example = content.examples[0];
        const choices = makeChoices(
          example.de,
          [
            ...content.examples.slice(1).map((item) => item.de),
            content.dialogue.answer,
            content.ordering.answer,
          ],
          unitSeed(unit, order),
          "Alternatif Almanca cümle",
        );
        return {
          ...common,
          title: "İletişim: doğru ifadeyi seç",
          prompt: `“${example.tr}” anlamını veren Almanca cümle hangisidir?`,
          options: choices.map((item, index) => option(`o${index + 1}`, item)),
          correctAnswer: example.de,
          relatedSlideId: `${unit.id}-s7`,
          explanation: `Doğru yanıt “${example.de}” cümlesidir; bu cümle doğrudan “${example.tr}” anlamını verir. Diğer seçenekler ünitedeki farklı iletişim amaçlarını ifade eder.`,
        };
      }

      const vocabulary = content.vocabulary.map(parseVocabulary);
      const target = vocabulary[(unit.order + order) % vocabulary.length] ?? vocabulary[0];
      const choices = makeChoices(
        target.tr,
        vocabulary.filter((item) => item.de !== target.de).map((item) => item.tr),
        unitSeed(unit, order),
        "Alternatif anlam",
      );
      return {
        ...common,
        title: "Wortschatz: kelimenin anlamını bul",
        prompt: `“${target.de}” kelime veya ifadesinin Türkçe karşılığı hangisidir?`,
        options: choices.map((item, index) => option(`o${index + 1}`, item)),
        correctAnswer: target.tr,
        relatedSlideId: `${unit.id}-s2`,
        explanation: `“${target.de}” bu ünitede “${target.tr}” anlamında kullanılır. Kelimeyi artikel, edat veya tamamlayıcısıyla birlikte öğrenmek sonraki cümlelerde doğru kullanmanı kolaylaştırır.`,
      };
    }

    case "MULTIPLE_SELECT": {
      const correctItems = content.multiSelect.answers;
      const incorrectItems = content.multiSelect.options.filter((item) => !correctItems.includes(item));
      return {
        ...common,
        title: "Wörter: uygun ifadeleri belirle",
        prompt: content.multiSelect.prompt,
        options: content.multiSelect.options.map((item, index) => option(`o${index + 1}`, item)),
        correctAnswer: correctItems,
        relatedSlideId: `${unit.id}-s2`,
        explanation: `Doğru seçenekler ${correctItems.map((item) => `“${item}”`).join(" ve ")} ifadeleridir. Bu iki ifade soruda istenen işleve uygundur; ${incorrectItems.map((item) => `“${item}”`).join(" ile ")} ise aynı anlam alanına veya iletişim amacına ait değildir.`,
      };
    }

    case "TRUE_FALSE": {
      const truthLabel = content.trueFalse.answer ? "doğrudur" : "yanlıştır";
      return {
        ...common,
        title: "Strukturen: kuralı değerlendir",
        prompt: content.trueFalse.prompt,
        correctAnswer: content.trueFalse.answer,
        relatedSlideId: `${unit.id}-s3`,
        explanation: `Bu ifade ${truthLabel}. ${firstSentence(content.grammarExplanation)} Sorudaki yapı bu kuralla karşılaştırıldığında doğru değerlendirme “${content.trueFalse.answer ? "Doğru" : "Yanlış"}” olur.`,
      };
    }

    case "FILL_IN_THE_BLANK": {
      if (order <= 4) {
        return {
          ...common,
          title: "Strukturen: boşluğu tamamla",
          prompt: content.fill.prompt,
          correctAnswer: content.fill.answer,
          acceptedAnswers: content.fill.acceptedAnswers,
          relatedSlideId: `${unit.id}-s4`,
          explanation: `Boşluğa “${content.fill.answer}” yazılmalıdır. Cümledeki özne, zaman ve tamamlayıcılar ${content.grammarTitle} kuralına göre bu biçimi gerektirir.`,
        };
      }
      const task = createFillFromExample(content, 2, 1);
      return {
        ...common,
        title: "Cümle içinde doğru biçimi kullan",
        prompt: task.prompt,
        correctAnswer: task.answer,
        acceptedAnswers: task.acceptedAnswers,
        relatedSlideId: `${unit.id}-s4`,
        explanation: `Doğru kelime “${task.answer}”dır. Tam cümle “${task.fullSentence}” şeklindedir ve Türkçesi “${task.translation}” olur; boşluğun çevresindeki sözcükler doğru biçimi belirler.`,
      };
    }

    case "MATCHING": {
      const pairs = vocabularyPairs(unit.id);
      return {
        ...common,
        title: "Wörter: kelimeleri anlamlarıyla eşleştir",
        prompt: "Her Almanca kelime veya ifadeyi doğru Türkçe anlamıyla eşleştir.",
        pairs,
        correctAnswer: pairs.map((pair) => `${pair.left}:${pair.right}`),
        maxAttempts: 3,
        relatedSlideId: `${unit.id}-s2`,
        explanation: `Doğru eşleşmeler: ${pairs.map((pair) => `${pair.left} → ${pair.right}`).join("; ")}. Kelimeleri tek tek değil, artikel ve kullanım bağlamıyla birlikte tekrar et.`,
      };
    }

    case "SENTENCE_ORDERING":
      return {
        ...common,
        title: "Strukturen: cümleyi doğru sıraya koy",
        prompt: "Parçalara dokunarak dil bilgisi bakımından doğru Almanca cümleyi oluştur.",
        tokens: content.ordering.tokens,
        correctAnswer: content.ordering.answer,
        relatedSlideId: `${unit.id}-s4`,
        explanation: `Doğru sıra “${content.ordering.answer}” şeklindedir. Almanca ana cümlede çekimli fiilin konumunu ve birbirine ait isim gruplarını birlikte düşünmek gerekir.`,
      };

    case "TRANSLATION":
      return {
        ...common,
        title: "Kommunikation: Türkçeden Almancaya çevir",
        prompt: content.translation.prompt,
        correctAnswer: content.translation.answer,
        acceptedAnswers: content.translation.acceptedAnswers,
        maxAttempts: 3,
        relatedSlideId: `${unit.id}-s7`,
        explanation: `Model yanıt “${content.translation.answer}”dır. Çeviride Türkçe kelime sırasını doğrudan taşımak yerine Almancadaki çekimli fiil konumunu ve gerekli edat/artikel yapısını korumalısın.`,
      };

    case "DIALOGUE_COMPLETION": {
      const rejected = content.dialogue.options.filter((item) => item !== content.dialogue.answer);
      return {
        ...common,
        title: "Kommunikation: diyaloğu tamamla",
        prompt: content.dialogue.prompt,
        options: content.dialogue.options.map((item, index) => option(`o${index + 1}`, item)),
        correctAnswer: content.dialogue.answer,
        relatedSlideId: `${unit.id}-s8`,
        explanation: `“${content.dialogue.answer}” önceki konuşma sırasına anlam ve hitap biçimi bakımından uygun karşılıktır. ${rejected.map((item) => `“${item}”`).join(" ve ")} bu bağlamda soruya doğrudan cevap vermez.`,
      };
    }

    case "SHORT_ANSWER":
      return {
        ...common,
        title: "Kommunikation: kısa yanıt oluştur",
        prompt: `${content.translation.prompt} Ardından yanıtını iki veya üç Almanca cümleyle genişlet ve “${content.grammarTitle}” yapısını en az bir kez kullan.`,
        correctAnswer: "öğretmen değerlendirmesi",
        acceptedAnswers: [],
        relatedSlideId: `${unit.id}-s12`,
        explanation: `Bu görev tek bir kalıp cevaptan daha fazlasını ölçer. Yanıtında içerik uygunluğu, ${content.grammarTitle} yapısının doğru kullanımı ve cümlelerin birbirine bağlanması değerlendirilecektir.`,
      };

    case "WRITING_ASSIGNMENT":
      return {
        ...common,
        title: "Schreiben: yapılandırılmış yazma görevi",
        prompt: `${content.dialogue.prompt} Bu durumdan hareketle tutarlı bir metin yaz; en az iki bağlaç ve ünitedeki kelimelerden en az üçünü kullan.`,
        correctAnswer: "öğretmen değerlendirmesi",
        minWords: unit.courseId === "b2" ? 150 : 110,
        maxWords: unit.courseId === "b2" ? 220 : 170,
        relatedSlideId: `${unit.id}-s11`,
        explanation: `Metin; göreve uygunluk, paragraf düzeni, bağlaç kullanımı, ${content.grammarTitle} yapısının doğruluğu ve kelime çeşitliliği bakımından değerlendirilecektir.`,
      };
  }
}

export const exercises: Exercise[] = units.flatMap((unit) =>
  exerciseTypes(unit.courseId).map((type, index) => createExercise(unit, index + 1, type)),
);

function grammarQuestion(unit: Unit, content: CurriculumUnitContent): UnitQuizQuestion {
  const personColumn = content.grammarColumns[0];
  const formColumn = content.grammarColumns[1] ?? content.grammarColumns[0];
  const row = unit.order % Math.min(personColumn.values.length, formColumn.values.length);
  const person = personColumn.values[row];
  const correctForm = formColumn.values[row];
  const alternateForm = formColumn.values[(row + 1) % formColumn.values.length];
  const shouldBeTrue = unit.order % 2 === 1;
  const shownForm = shouldBeTrue ? correctForm : alternateForm;
  return {
    id: `${unit.id}-v8-q2`,
    type: "TRUE_FALSE",
    prompt: `“${person}” satırında “${formColumn.header}” için doğru biçim “${shownForm}”dir.`,
    correctAnswer: shouldBeTrue,
    topic: "Strukturen",
    relatedSlideId: `${unit.id}-s3`,
    explanation: `Tabloda “${person}” için doğru biçim “${correctForm}” olarak verilir. Bu nedenle gösterilen “${shownForm}” biçimi ${shouldBeTrue ? "doğru" : "yanlış"} değerlendirilmelidir.`,
  };
}

function quizGermanChoice(unit: Unit, content: CurriculumUnitContent, questionOrder: number, exampleIndex: number): UnitQuizQuestion {
  const example = content.examples[exampleIndex % content.examples.length];
  const choices = makeChoices(
    example.de,
    content.examples.filter((_, index) => index !== exampleIndex % content.examples.length).map((item) => item.de),
    unitSeed(unit, questionOrder + 20),
    "Alternatif cümle",
  );
  return {
    id: `${unit.id}-v8-q${questionOrder}`,
    type: "MULTIPLE_CHOICE",
    prompt: `“${example.tr}” anlamını veren Almanca cümleyi seç.`,
    options: choices.map((item, index) => option(`q${questionOrder}-${index + 1}`, item)),
    correctAnswer: example.de,
    topic: "Kommunikation",
    relatedSlideId: `${unit.id}-s7`,
    explanation: `“${example.de}” cümlesi “${example.tr}” anlamını verir. Doğru seçimde çekimli fiil, kişi bilgisi ve varsa edat/artikel birlikte uyuşur.`,
  };
}

function quizVocabularyQuestion(unit: Unit, content: CurriculumUnitContent): UnitQuizQuestion {
  const vocabulary = content.vocabulary.map(parseVocabulary);
  const targetIndex = (unit.order * 3 + 1) % vocabulary.length;
  const target = vocabulary[targetIndex];
  const choices = makeChoices(
    target.tr,
    vocabulary.filter((_, index) => index !== targetIndex).map((item) => item.tr),
    unitSeed(unit, 44),
    "Alternatif anlam",
  );
  return {
    id: `${unit.id}-v8-q4`,
    type: "MULTIPLE_CHOICE",
    prompt: `“${target.de}” ifadesinin bu ünitedeki anlamı hangisidir?`,
    options: choices.map((item, index) => option(`q4-${index + 1}`, item)),
    correctAnswer: target.tr,
    topic: "Wörter",
    relatedSlideId: `${unit.id}-s2`,
    explanation: `“${target.de}” ifadesinin karşılığı “${target.tr}”dır. Anlamı, ünitenin konu alanı ve örnek cümlelerdeki kullanımıyla birlikte düşünmek gerekir.`,
  };
}

function quizVocabularyFill(unit: Unit, content: CurriculumUnitContent): UnitQuizQuestion {
  const vocabulary = content.vocabulary.map(parseVocabulary);
  const target = vocabulary[(unit.order * 5 + 2) % vocabulary.length] ?? vocabulary[0];
  const articleMatch = target.de.match(/^(der|die|das)\s+(.+)$/i);
  if (articleMatch) {
    const [, article, noun] = articleMatch;
    return {
      id: `${unit.id}-v8-q7`,
      type: "FILL_IN_THE_BLANK",
      prompt: `Artikel bilgisini tamamla: ___ ${noun}`,
      correctAnswer: article,
      topic: "Wörter",
      relatedSlideId: `${unit.id}-s2`,
      explanation: `“${noun}” kelimesi bu ünitede “${article} ${noun}” biçiminde öğrenilir. İsmi artikeliyle birlikte kaydetmek Akkusativ ve Dativ kullanımında hata riskini azaltır.`,
    };
  }
  return {
    id: `${unit.id}-v8-q7`,
    type: "FILL_IN_THE_BLANK",
    prompt: `“${target.tr}” anlamındaki Almanca kelime veya ifadeyi yaz: ___`,
    correctAnswer: target.de,
    topic: "Wörter",
    relatedSlideId: `${unit.id}-s2`,
    explanation: `Aranan ifade “${target.de}”dir. Bu ifade ünitenin kelime listesinde “${target.tr}” anlamıyla yer alır.`,
  };
}

function quizGrammarFill(unit: Unit, content: CurriculumUnitContent, questionOrder: number, rowOffset: number): UnitQuizQuestion {
  const personColumn = content.grammarColumns[0];
  const formColumn = content.grammarColumns[1] ?? content.grammarColumns[0];
  const row = (unit.order + rowOffset) % Math.min(personColumn.values.length, formColumn.values.length);
  const person = personColumn.values[row];
  const answer = formColumn.values[row];
  return {
    id: `${unit.id}-v8-q${questionOrder}`,
    type: "FILL_IN_THE_BLANK",
    prompt: `Dil bilgisi tablosuna göre tamamla: “${person}” → “${formColumn.header}” = ___`,
    correctAnswer: answer,
    topic: "Strukturen",
    relatedSlideId: `${unit.id}-s4`,
    explanation: `“${person}” öğesinin “${formColumn.header}” sütunundaki karşılığı “${answer}”dır. Kişi, hâl veya işlev değiştiğinde tablodaki biçim de buna göre değişir.`,
  };
}

function quizGrammarChoice(unit: Unit, content: CurriculumUnitContent): UnitQuizQuestion {
  const personColumn = content.grammarColumns[0];
  const formColumn = content.grammarColumns[1] ?? content.grammarColumns[0];
  const row = (unit.order + 1) % Math.min(personColumn.values.length, formColumn.values.length);
  const person = personColumn.values[row];
  const answer = formColumn.values[row];
  const choices = makeChoices(
    answer,
    formColumn.values.filter((_, index) => index !== row),
    unitSeed(unit, 55),
    "Alternatif biçim",
  );
  return {
    id: `${unit.id}-v8-q5`,
    type: "MULTIPLE_CHOICE",
    prompt: `“${person}” öğesi için “${formColumn.header}” sütunundaki doğru biçim hangisidir?`,
    options: choices.map((item, index) => option(`q5-${index + 1}`, item)),
    correctAnswer: answer,
    topic: "Strukturen",
    relatedSlideId: `${unit.id}-s2`,
    explanation: `Doğru biçim “${answer}”dır. Bu seçim doğrudan ünitedeki dil bilgisi tablosunun “${person}” satırıyla eşleşir.`,
  };
}

export const quizzes: UnitQuiz[] = units.map((unit) => {
  const content = getCurriculumContent(unit.id);
  const meaningExample = content.examples[1 % content.examples.length];
  const meaningChoices = makeChoices(
    meaningExample.tr,
    content.examples.filter((_, index) => index !== 1 % content.examples.length).map((item) => item.tr),
    unitSeed(unit, 61),
    "Alternatif anlam",
  );

  const questions: UnitQuizQuestion[] = [
    quizGermanChoice(unit, content, 1, 3),
    grammarQuestion(unit, content),
    quizGrammarFill(unit, content, 3, 0),
    quizVocabularyQuestion(unit, content),
    quizGrammarChoice(unit, content),
    {
      id: `${unit.id}-v8-q6`,
      type: "MULTIPLE_CHOICE",
      prompt: `“${meaningExample.de}” cümlesinin doğru Türkçe anlamı hangisidir?`,
      options: meaningChoices.map((item, index) => option(`q6-${index + 1}`, item)),
      correctAnswer: meaningExample.tr,
      topic: "Anlama",
      relatedSlideId: `${unit.id}-s7`,
      explanation: `“${meaningExample.de}” cümlesinin anlamı “${meaningExample.tr}”dır. Çeviride yalnızca tek kelimeye değil, cümlenin tamamındaki özne-fiil ve tamamlayıcı ilişkisine bakılmalıdır.`,
    },
    quizVocabularyFill(unit, content),
  ];

  return {
    id: `${unit.id}-v8-quiz`,
    unitId: unit.id,
    title: `${unit.title} · Ünite Sonu Değerlendirmesi`,
    minimumScore: unit.completionRules.minimumQuizScore,
    maxAttempts: 3,
    showAnswersAfterSubmit: true,
    questions,
  };
});

export const exercisesPerUnit = 10;
export const totalExerciseCounts = { A1: 120, A2: 160, B1: 180, B2: 200 } as const;
