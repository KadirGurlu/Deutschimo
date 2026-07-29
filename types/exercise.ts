export type ExerciseType =
  | "MULTIPLE_CHOICE"
  | "MULTIPLE_SELECT"
  | "TRUE_FALSE"
  | "FILL_IN_THE_BLANK"
  | "MATCHING"
  | "SENTENCE_ORDERING"
  | "TRANSLATION"
  | "DIALOGUE_COMPLETION"
  | "SHORT_ANSWER"
  | "WRITING_ASSIGNMENT";

export type ExerciseOption = {
  id: string;
  label: string;
  value: string;
};

export type MatchPair = {
  left: string;
  right: string;
};

export type Exercise = {
  id: string;
  unitId: string;
  groupId: string;
  order: number;
  type: ExerciseType;
  title: string;
  prompt: string;
  options?: ExerciseOption[];
  correctAnswer?: string | string[] | boolean;
  acceptedAnswers?: string[];
  explanation: string;
  relatedSlideId?: string;
  isRequired: boolean;
  maxAttempts: number;
  points: number;
  pairs?: MatchPair[];
  tokens?: string[];
  minWords?: number;
  maxWords?: number;
};

export type UnitQuizQuestion = {
  id: string;
  type: "MULTIPLE_CHOICE" | "TRUE_FALSE" | "FILL_IN_THE_BLANK";
  prompt: string;
  options?: ExerciseOption[];
  correctAnswer: string | boolean;
  topic: string;
  relatedSlideId?: string;
};

export type UnitQuiz = {
  id: string;
  unitId: string;
  title: string;
  questions: UnitQuizQuestion[];
  minimumScore: number;
  maxAttempts: number;
  showAnswersAfterSubmit: boolean;
};
