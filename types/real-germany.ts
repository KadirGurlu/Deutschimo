export type RealGermanyLevel = "A1" | "A2" | "B1" | "B2";

export type RealGermanyStepKind = "READ" | "LISTEN" | "FORM" | "WRITE" | "SPEAK";

export interface RealGermanyStep {
  id: string;
  kind: RealGermanyStepKind;
  title: string;
  instruction: string;
  prompt: string;
  helper?: string;
  placeholder?: string;
  requiredResponse?: boolean;
}

export interface RealGermanyScenario {
  id: string;
  level: RealGermanyLevel;
  category: string;
  title: string;
  summary: string;
  goal: string;
  city: string;
  estimatedMinutes: number;
  difficulty: "Başlangıç" | "Günlük" | "Orta" | "Yoğun";
  tags: string[];
  vocabulary: string[];
  supportPhrases: string[];
  successChecklist: string[];
  steps: RealGermanyStep[];
}
