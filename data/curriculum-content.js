import rawCurriculumContent from "@/data/curriculum-content.json";
export const curriculumContent = rawCurriculumContent;
export const curriculumContentByUnitId = Object.fromEntries(curriculumContent.map((unit) => [unit.id, unit]));
export function getCurriculumContent(unitId) {
    const content = curriculumContentByUnitId[unitId];
    if (!content) {
        throw new Error(`Curriculum content not found for unit: ${unitId}`);
    }
    return content;
}
