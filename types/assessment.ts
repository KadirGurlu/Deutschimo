import type { CourseLevel } from "@/types/course";

export type AssessmentSkill =
  | "GRAMMAR"
  | "VOCABULARY"
  | "COMMUNICATION"
  | "READING"
  | "LISTENING"
  | "WRITING"
  | "SPEAKING"
  | "PRONUNCIATION";

export type CognitiveLevel = "REMEMBER" | "UNDERSTAND" | "APPLY" | "ANALYZE" | "CREATE";

export type LearningObjective = {
  code: string;
  unitId: string;
  level: CourseLevel;
  skill: AssessmentSkill;
  topic: string;
  title: string;
  description: string;
  weight: number;
  critical: boolean;
};

export type AssessmentMetadata = {
  objectiveCodes: string[];
  topicTags: string[];
  skill: AssessmentSkill;
  difficulty: 1 | 2 | 3 | 4 | 5;
  cognitiveLevel: CognitiveLevel;
  estimatedSeconds: number;
};

export type AssessmentEvidenceInput = {
  sourceType: "EXERCISE" | "UNIT_QUIZ" | "SKILL_LAB" | "PLACEMENT" | "SMART_REVIEW";
  sourceId: string;
  courseId: string;
  unitId?: string;
  level: CourseLevel;
  objectiveCodes: string[];
  topicTags: string[];
  skill: AssessmentSkill;
  difficulty: number;
  cognitiveLevel: CognitiveLevel;
  correct: boolean;
  answer?: unknown;
  correctAnswer?: unknown;
  explanation?: string;
  relatedSlideId?: string;
  responseMs?: number;
  attemptNumber?: number;
  pointsPossible?: number;
  pointsEarned?: number;
};

export type CompetencyOverview = {
  totalEvidence: number;
  unresolvedErrors: number;
  overallMastery: number;
  skillSummaries: Array<{
    skill: AssessmentSkill;
    mastery: number;
    evidenceCount: number;
    correctRate: number;
  }>;
  competencies: Array<{
    objectiveCode: string;
    title: string;
    topic: string;
    skill: AssessmentSkill;
    level: CourseLevel;
    mastery: number;
    confidence: number;
    evidenceCount: number;
    correctCount: number;
    incorrectCount: number;
    points: number;
    lastEvidenceAt: string | null;
  }>;
  errors: Array<{
    id: string;
    sourceType: string;
    sourceId: string;
    objectiveCode: string;
    objectiveTitle: string;
    topic: string;
    skill: AssessmentSkill;
    level: CourseLevel;
    occurrenceCount: number;
    explanation: string | null;
    relatedSlideId: string | null;
    unitId: string | null;
    lastOccurredAt: string;
  }>;
};
