export const MASTERY_SKILLS = ["VOCABULARY","GRAMMAR","READING","LISTENING","WRITING","SPEAKING"] as const;
export type MasterySkill = (typeof MASTERY_SKILLS)[number];
export type MasteryEvidenceSource = "EXERCISE"|"UNIT_QUIZ"|"SKILL_LAB"|"SMART_REVIEW"|"VOCABULARY_REVIEW"|"PLACEMENT"|"WRITING_COACH"|"REAL_GERMANY"|"ASSESSMENT"|"PROGRESS"|"MANUAL";
export interface MasteryEvidenceInput {
  courseId:string; unitId?:string|null; questionId:string; skill?:MasterySkill; tags?:string[];
  score?:number; correct?:boolean|null; responseMs?:number|null; hintUsed?:boolean;
  confidence?:string|null; difficulty?:number|null; source:MasteryEvidenceSource; externalId?:string|null;
}
export interface MasterySkillSummary { skill:MasterySkill; score:number|null; evidenceCount:number; confidence:number; }
export interface MasteryTopicSummary { tag:string; score:number; evidenceCount:number; confidence:number; }
export interface CourseMasterySummary {
  courseId:string; mastery:number|null; completion:number|null; coverage:number; provisional:boolean;
  strongestSkill:MasterySkillSummary|null; weakestSkill:MasterySkillSummary|null;
  skills:MasterySkillSummary[]; weakTopics:MasteryTopicSummary[];
}
export interface MasteryOverviewResponse { courses:CourseMasterySummary[]; generatedAt:string; }
