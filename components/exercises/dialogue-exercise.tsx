import { MultipleChoiceExercise } from "@/components/exercises/multiple-choice-exercise";
import type { Exercise } from "@/types/exercise";

export function DialogueExercise(props: {
  exercise: Exercise;
  value: unknown;
  onChange: (value: unknown) => void;
  disabled: boolean;
}) {
  const parts = props.exercise.prompt.split("—").map((part) => part.trim()).filter(Boolean);
  return <div className="dialogue-exercise">
    {parts.map((part, index) => <div className={`dialogue-line ${index % 2 ? "muted" : ""}`} key={`${part}-${index}`}>
      {part.replace("___", "…")}
    </div>)}
    <MultipleChoiceExercise {...props}/>
  </div>;
}
