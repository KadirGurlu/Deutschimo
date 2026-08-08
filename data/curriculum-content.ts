import rawCurriculumContent from "@/data/curriculum-content.json";
import v33A1Content from "@/data/v33-a1-gold-standard.json";
import type { CurriculumUnitContent } from "@/types/content";

const baseContent = rawCurriculumContent as CurriculumUnitContent[];
const v33Map = new Map((v33A1Content as CurriculumUnitContent[]).map((unit) => [unit.id, unit]));

export const curriculumContent: CurriculumUnitContent[] = baseContent.map(
  (unit) => v33Map.get(unit.id) ?? unit,
);

export const curriculumContentByUnitId: Record<string, CurriculumUnitContent> = Object.fromEntries(
  curriculumContent.map((unit) => [unit.id, unit]),
);

export function getCurriculumContent(unitId: string): CurriculumUnitContent {
  const content = curriculumContentByUnitId[unitId];
  if (!content) throw new Error(`Curriculum content not found for unit: ${unitId}`);
  return content;
}
