export type CurriculumExample = {
  de: string;
  tr: string;
};

export type CurriculumMiniCheck = {
  question: string;
  options: string[];
  correctAnswer: string;
};

export type CurriculumAnswerTask = {
  prompt: string;
  answer: string;
  acceptedAnswers: string[];
};

export type CurriculumDialogueTask = {
  prompt: string;
  options: string[];
  answer: string;
};

export type CurriculumTrueFalseTask = {
  prompt: string;
  answer: boolean;
};

export type CurriculumMultiSelectTask = {
  prompt: string;
  options: string[];
  answers: string[];
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
