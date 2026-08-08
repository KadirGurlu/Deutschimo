import rawCurriculumContent from "@/data/curriculum-content.json";
import v33A1Content from "@/data/v33-a1-gold-standard.json";
import v34A2Content from "@/data/v34-a2-gold-standard.json";
import v35B1Content from "@/data/v35-b1-gold-standard.json";
import v36B2Content from "@/data/v36-b2-gold-standard.json";
import type { CurriculumUnitContent } from "@/types/content";

const baseContent = rawCurriculumContent as CurriculumUnitContent[];
const overlays = [
  ...(v33A1Content as CurriculumUnitContent[]),
  ...(v34A2Content as CurriculumUnitContent[]),
  ...(v35B1Content as CurriculumUnitContent[]),
  ...(v36B2Content as CurriculumUnitContent[]),
];
const overlayMap = new Map(overlays.map((unit) => [unit.id, unit]));
export const curriculumContent: CurriculumUnitContent[] = baseContent.map((unit) => overlayMap.get(unit.id) ?? unit);
export const curriculumContentByUnitId: Record<string, CurriculumUnitContent> = Object.fromEntries(curriculumContent.map((unit) => [unit.id, unit]));
export function getCurriculumContent(unitId: string): CurriculumUnitContent {
  const content = curriculumContentByUnitId[unitId];
  if (!content) throw new Error(`Curriculum content not found for unit: ${unitId}`);
  return content;
}
