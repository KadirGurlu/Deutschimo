import { units } from "@/data/units";
import type { ContentBlock, LessonSlide } from "@/types/learning";

const block = (id: string, type: ContentBlock["type"], extra: Omit<ContentBlock, "id" | "type"> = {}): ContentBlock => ({ id, type, ...extra });

function createUnitSlides(unitId: string): LessonSlide[] {
  const definitions: Array<Pick<LessonSlide, "title" | "completionRule" | "estimatedMinutes"> & { blocks: ContentBlock[] }> = [
    {
      title: "Üniteye giriş",
      completionRule: "NEXT_CLICK",
      estimatedMinutes: 2,
      blocks: [
        block(`${unitId}-b1`, "heading", { title: "Bu slaytta ne göreceksin?" }),
        block(`${unitId}-b2`, "text", { text: "Bu alana ünitenin kısa giriş metni gelecek. İçerik editörü, öğrencinin bağlamı anlamasını sağlayan özgün açıklamayı buraya ekleyebilir." }),
        block(`${unitId}-b3`, "info_box", { title: "Öğrenme hedefi", text: "Ünite sonunda kazanılması beklenen beceriler bu alanda gösterilir." }),
      ],
    },
    {
      title: "Temel yapı",
      completionRule: "MIN_TIME",
      estimatedMinutes: 4,
      blocks: [
        block(`${unitId}-b4`, "heading", { title: "Konu anlatımı" }),
        block(`${unitId}-b5`, "text", { text: "Bu alana yapılandırılmış ders anlatımı gelecek. Uzun paragraflar yerine kısa ve odaklanmış açıklamalar kullanılmalıdır." }),
        block(`${unitId}-b6`, "grammar_table", { title: "Yapı tablosu", columns: [{ header: "Alan 1", values: ["Örnek değer", "Örnek değer"] }, { header: "Alan 2", values: ["Açıklama", "Açıklama"] }] }),
      ],
    },
    {
      title: "Kelime ve kavram alanı",
      completionRule: "NEXT_CLICK",
      estimatedMinutes: 3,
      blocks: [
        block(`${unitId}-b7`, "vocabulary_list", { title: "Kelime listesi alanı", items: ["Kelime alanı 1", "Kelime alanı 2", "Kelime alanı 3", "Kelime alanı 4"] }),
        block(`${unitId}-b8`, "tip_box", { title: "Çalışma ipucu", text: "İçerik editörü, ünitenin öğrenme stratejisini bu alana ekleyebilir." }),
      ],
    },
    {
      title: "Örnek ve açıklama",
      completionRule: "NEXT_CLICK",
      estimatedMinutes: 4,
      blocks: [
        block(`${unitId}-b9`, "example", { title: "Örnek cümle alanı", text: "Bu alana seviyeye uygun özgün örnek gelecek." }),
        block(`${unitId}-b10`, "translation", { title: "Çeviri alanı", text: "Bu alana örneğin Türkçe açıklaması gelecek." }),
        block(`${unitId}-b11`, "warning_box", { title: "Dikkat", text: "Sık yapılan hata veya önemli kullanım notu bu alanda gösterilir." }),
      ],
    },
    {
      title: "Mini kontrol",
      completionRule: "MINI_CHECK",
      estimatedMinutes: 3,
      blocks: [
        block(`${unitId}-b12`, "mini_check", { miniCheck: { question: "Bu slayt için örnek mini kontrol sorusu", options: ["Seçenek A", "Seçenek B", "Seçenek C"], correctAnswer: "Seçenek B" } }),
      ],
    },
    {
      title: "Ünite özeti",
      completionRule: "MANUAL",
      estimatedMinutes: 2,
      blocks: [
        block(`${unitId}-b13`, "summary", { title: "Özet", items: ["Ana kazanım alanı", "Tekrar edilmesi gereken yapı", "Alıştırmalara geçmeden önce kontrol noktası"] }),
        block(`${unitId}-b14`, "divider"),
        block(`${unitId}-b15`, "info_box", { title: "Sonraki aşama", text: "Bütün zorunlu slaytlar tamamlandığında alıştırmalar açılır." }),
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
      minimumViewSeconds: definition.completionRule === "MIN_TIME" ? 5 : undefined,
      previousSlideId: index > 0 ? `${unitId}-s${index}` : undefined,
      nextSlideId: index < definitions.length - 1 ? `${unitId}-s${index + 2}` : undefined,
      status: "PUBLISHED",
    } satisfies LessonSlide;
  });
}

export const slides: LessonSlide[] = units.flatMap((unit) => createUnitSlides(unit.id));
export const slidesPerUnit = 6;
