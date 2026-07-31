import { DialogueExercise } from "@/components/exercises/dialogue-exercise";
import { FillBlankExercise } from "@/components/exercises/fill-blank-exercise";
import { MatchingExercise } from "@/components/exercises/matching-exercise";
import { MultipleChoiceExercise } from "@/components/exercises/multiple-choice-exercise";
import { MultipleSelectExercise } from "@/components/exercises/multiple-select-exercise";
import { SentenceOrderingExercise } from "@/components/exercises/sentence-ordering-exercise";
import { ShortAnswerExercise } from "@/components/exercises/short-answer-exercise";
import { TranslationExercise } from "@/components/exercises/translation-exercise";
import { TrueFalseExercise } from "@/components/exercises/true-false-exercise";
import { WritingAssignment } from "@/components/exercises/writing-assignment";
import type { Exercise } from "@/types/exercise";

export function ExerciseRenderer({ exercise, value, onChange, disabled }: { exercise: Exercise; value: unknown; onChange: (value: unknown) => void; disabled: boolean }) {
  const props = { exercise, value, onChange, disabled };
  const renderers = {
    MULTIPLE_CHOICE: <MultipleChoiceExercise {...props}/>,
    MULTIPLE_SELECT: <MultipleSelectExercise {...props}/>,
    TRUE_FALSE: <TrueFalseExercise value={value} onChange={onChange} disabled={disabled}/>,
    FILL_IN_THE_BLANK: <FillBlankExercise value={value} onChange={onChange} disabled={disabled}/>,
    MATCHING: <MatchingExercise {...props}/>,
    SENTENCE_ORDERING: <SentenceOrderingExercise {...props}/>,
    TRANSLATION: <TranslationExercise value={value} onChange={onChange} disabled={disabled}/>,
    DIALOGUE_COMPLETION: <DialogueExercise {...props}/>,
    SHORT_ANSWER: <ShortAnswerExercise value={value} onChange={onChange} disabled={disabled}/>,
    WRITING_ASSIGNMENT: <WritingAssignment {...props}/>,
  } satisfies Record<Exercise["type"], React.ReactNode>;
  return renderers[exercise.type];
}
