export type ContentQualityStatus = "TASLAK" | "EDITOR_KONTROLUNDE" | "DIL_KONTROLU_TAMAMLANDI" | "YAYINA_HAZIR";

export type ContentQualityCheckKey =
  | "grammarAndSpelling"
  | "levelAppropriateness"
  | "translationNaturalness"
  | "duplicateAndTemplateScan"
  | "answerConsistency"
  | "vocabularyContextScan";

export type ContentQualityRecord = {
  unitId: string;
  status: ContentQualityStatus;
  reviewedAt: string;
  manualLanguageReview: boolean;
  checks: Record<ContentQualityCheckKey, boolean | null>;
  note: string;
};
