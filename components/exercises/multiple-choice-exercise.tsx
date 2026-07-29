import { Check } from "lucide-react";
import type { Exercise } from "@/types/exercise";

export function MultipleChoiceExercise({ exercise, value, onChange, disabled }: { exercise: Exercise; value: unknown; onChange: (value: unknown) => void; disabled: boolean }) {
  const selectedValue = typeof value === "string" ? value : "";

  return <fieldset className="choice-grid" aria-describedby={`${exercise.id}-hint`}>
    <legend className="sr-only">{exercise.prompt}</legend>
    <p id={`${exercise.id}-hint`} className="selection-hint">Bir seçenek işaretle ve ardından “Kontrol Et” butonuna bas.</p>
    {exercise.options?.map((option, index) => {
      const selected = selectedValue === option.value;
      return <button
        key={option.id}
        type="button"
        className={`choice-option-button ${selected ? "selected" : ""}`}
        aria-pressed={selected}
        disabled={disabled}
        onClick={() => onChange(option.value)}
      >
        <span className="choice-option-marker" aria-hidden="true">{selected ? <Check size={16}/> : String.fromCharCode(65 + index)}</span>
        <span className="choice-option-text">{option.label}</span>
      </button>;
    })}
  </fieldset>;
}
