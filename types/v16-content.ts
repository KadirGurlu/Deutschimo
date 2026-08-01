import type { BilingualText, DialogueTurn, PracticeQuestion } from "@/types/content";

export type V16CultureNote = {
  title: string;
  text: string;
};

export type V16UnitContent = {
  id: string;
  cefrCanDo: string[];
  cultureNote: V16CultureNote;
  dialogue: DialogueTurn[];
  reading: BilingualText;
  listening: BilingualText;
  readingQuestions: PracticeQuestion[];
  listeningQuestions: PracticeQuestion[];
  writingPrompt: string;
  speakingPrompt: string;
  realLifeMission: string;
  sourceMethod: string;
};
