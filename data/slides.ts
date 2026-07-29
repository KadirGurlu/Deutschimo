import { getCurriculumContent } from "@/data/curriculum-content";
import { units } from "@/data/units";
import type { ContentBlock, LessonSlide } from "@/types/learning";

const block = (
  id: string,
  type: ContentBlock["type"],
  extra: Omit<ContentBlock, "id" | "type"> = {},
): ContentBlock => ({ id, type, ...extra });

function createUnitSlides(unitId: string): LessonSlide[] {
  const content = getCurriculumContent(unitId);

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

  const definitions: Array<
    Pick<LessonSlide, "title" | "completionRule" | "estimatedMinutes"> & {
      blocks: ContentBlock[];
    }
  > = [
    {
      title: "Üniteye giriş ve hedefler",
      completionRule: "NEXT_CLICK",
      estimatedMinutes: 3,
      blocks: [
        block(`${unitId}-intro-heading`, "heading", { title: "Bu ünitede ne öğreneceksin?" }),
        block(`${unitId}-intro-text`, "text", { text: content.intro }),
        block(`${unitId}-intro-goals`, "summary", {
          title: "Öğrenme hedefleri",
          items: content.goals,
        }),
      ],
    },
    {
      title: content.grammarTitle,
      completionRule: "MIN_TIME",
      estimatedMinutes: 7,
      blocks: [
        block(`${unitId}-grammar-heading`, "heading", { title: content.grammarTitle }),
        block(`${unitId}-grammar-text`, "text", { text: content.grammarExplanation }),
        block(`${unitId}-grammar-table`, "grammar_table", {
          title: "Yapı ve kullanım tablosu",
          columns: content.grammarColumns,
        }),
      ],
    },
    {
      title: "Temel kelimeler ve ifadeler",
      completionRule: "NEXT_CLICK",
      estimatedMinutes: 5,
      blocks: [
        block(`${unitId}-vocab-list`, "vocabulary_list", {
          title: "Bu ünitenin temel söz varlığı",
          items: content.vocabulary,
        }),
        block(`${unitId}-study-tip`, "tip_box", {
          title: "Çalışma önerisi",
          text: content.tip,
        }),
      ],
    },
    {
      title: "Bağlam içinde örnekler",
      completionRule: "NEXT_CLICK",
      estimatedMinutes: 7,
      blocks: [
        block(`${unitId}-examples-heading`, "heading", {
          title: "Yapıyı gerçek cümlelerde incele",
        }),
        ...exampleBlocks,
      ],
    },
    {
      title: "Kullanım notu ve mini kontrol",
      completionRule: "MINI_CHECK",
      estimatedMinutes: 4,
      blocks: [
        block(`${unitId}-warning`, "warning_box", {
          title: "Dikkat edilmesi gereken nokta",
          text: content.warning,
        }),
        block(`${unitId}-mini-check`, "mini_check", {
          miniCheck: content.miniCheck,
        }),
      ],
    },
    {
      title: "Ünite özeti",
      completionRule: "MANUAL",
      estimatedMinutes: 3,
      blocks: [
        block(`${unitId}-summary`, "summary", {
          title: "Bu ünitede öğrendiklerin",
          items: content.summary,
        }),
        block(`${unitId}-divider`, "divider"),
        block(`${unitId}-next-stage`, "info_box", {
          title: "Sonraki aşama",
          text: "Bütün zorunlu slaytları tamamladığında bu ünitenin sekiz alıştırması ve ardından ünite sonu değerlendirmesi açılır.",
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

export const slides: LessonSlide[] = units.flatMap((unit) => createUnitSlides(unit.id));
export const slidesPerUnit = 6;
