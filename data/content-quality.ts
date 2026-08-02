import rawContentQuality from "@/data/content-quality.json";
import type { ContentQualityRecord } from "@/types/content-quality";

export const contentQuality = rawContentQuality as ContentQualityRecord[];

const qualityByUnitId = new Map(contentQuality.map((record) => [record.unitId, record]));

export function getContentQuality(unitId: string): ContentQualityRecord {
  const record = qualityByUnitId.get(unitId);
  if (!record) {
    return {
      unitId,
      status: "TASLAK",
      reviewedAt: "",
      manualLanguageReview: false,
      checks: {
        grammarAndSpelling: null,
        levelAppropriateness: null,
        translationNaturalness: null,
        duplicateAndTemplateScan: false,
        answerConsistency: false,
        vocabularyContextScan: false,
      },
      note: "Bu ünite için henüz kalite kaydı oluşturulmadı.",
    };
  }
  return record;
}

export const contentQualitySummary = contentQuality.reduce(
  (summary, record) => {
    summary[record.status] += 1;
    return summary;
  },
  { TASLAK: 0, EDITOR_KONTROLUNDE: 0, DIL_KONTROLU_TAMAMLANDI: 0, YAYINA_HAZIR: 0 } as Record<ContentQualityRecord["status"], number>,
);
