export type CurriculumExample = { de: string; tr: string };
export type CurriculumMiniCheck = { question: string; options: string[]; correctAnswer: string };
export type CurriculumAnswerTask = { prompt: string; answer: string; acceptedAnswers: string[] };
export type CurriculumDialogueTask = { prompt: string; options: string[]; answer: string };
export type CurriculumTrueFalseTask = { prompt: string; answer: boolean };
export type CurriculumMultiSelectTask = { prompt: string; options: string[]; answers: string[] };

export type RichVocabularyItem = {
  word: string;
  article?: "der" | "die" | "das";
  plural?: string;
  meaning: string;
  kind: string;
  exampleDe: string;
  exampleTr: string;
};

export type BilingualLine = { de: string; tr: string; note?: string };
export type DialogueTurn = BilingualLine & { speaker: string };
export type CommonMistake = { wrong: string; correct: string; tr: string; reason: string };
export type PracticeQuestionType = "MULTIPLE_CHOICE" | "FILL_IN_THE_BLANK" | "SENTENCE_ORDERING" | "TRANSLATION" | "SCENARIO";
export type PracticeQuestion = {
  id: string;
  type: PracticeQuestionType;
  prompt: string;
  options?: string[];
  tokens?: string[];
  correctAnswer: string;
  acceptedAnswers?: string[];
  explanation: string;
};

export type CurriculumUnitContent = {
  id: string;
  intro: string;
  goals: string[];
  grammarTitle: string;
  grammarExplanation: string;
  grammarColumns: { header: string; values: string[] }[];
  vocabulary: string[];
  examples: CurriculumExample[];
  warning: string;
  tip: string;
  miniCheck: CurriculumMiniCheck;
  fill: CurriculumAnswerTask;
  ordering: { tokens: string[]; answer: string };
  translation: CurriculumAnswerTask;
  dialogue: CurriculumDialogueTask;
  trueFalse: CurriculumTrueFalseTask;
  multiSelect: CurriculumMultiSelectTask;
  summary: string[];
};
