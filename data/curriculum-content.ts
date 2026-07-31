import rawCurriculumContent from "@/data/curriculum-content.json";
import type { CurriculumUnitContent } from "@/types/content";

export const curriculumContent = rawCurriculumContent as CurriculumUnitContent[];

export const curriculumContentByUnitId: Record<string, CurriculumUnitContent> = Object.fromEntries(
  curriculumContent.map((unit) => [unit.id, unit]),
);

export function getCurriculumContent(unitId: string): CurriculumUnitContent {
  const content = curriculumContentByUnitId[unitId];
  if (!content) {
    throw new Error(`Curriculum content not found for unit: ${unitId}`);
  }
  return content;
}
