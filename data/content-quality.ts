import rawContentQuality from "@/data/content-quality.json";
import v33A1Quality from "@/data/v33-a1-quality.json";
import type { ContentQualityRecord } from "@/types/content-quality";

const baseQuality = rawContentQuality as ContentQualityRecord[];
const v33Map = new Map((v33A1Quality as ContentQualityRecord[]).map((record) => [record.unitId, record]));

export const contentQuality: ContentQualityRecord[] = baseQuality.map(
  (record) => v33Map.get(record.unitId) ?? record,
);

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
