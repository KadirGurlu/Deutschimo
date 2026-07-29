import type { Exercise } from "@/types/exercise";

export function MultipleChoiceExercise({ exercise, value, onChange, disabled }: { exercise: Exercise; value: unknown; onChange: (value: unknown) => void; disabled: boolean }) {
  return <fieldset className="choice-grid"><legend className="sr-only">{exercise.prompt}</legend>{exercise.options?.map((option) => <label key={option.id} className={value === option.value ? "selected" : ""}><input type="radio" name={exercise.id} value={option.value} checked={value === option.value} disabled={disabled} onChange={() => onChange(option.value)}/><span>{option.label}</span></label>)}</fieldset>;
}
