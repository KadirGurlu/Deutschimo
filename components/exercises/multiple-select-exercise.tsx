import { Check } from "lucide-react";
import type { Exercise } from "@/types/exercise";

export function MultipleSelectExercise({ exercise, value, onChange, disabled }: { exercise: Exercise; value: unknown; onChange: (value: unknown) => void; disabled: boolean }) {
  const selected = Array.isArray(value) ? value.map(String) : [];
  const toggle = (item: string) => onChange(selected.includes(item) ? selected.filter((valueItem) => valueItem !== item) : [...selected, item]);

  return <fieldset className="choice-grid">
    <legend className="selection-hint">Birden fazla doğru seçenek olabilir. Uygun gördüğün bütün seçenekleri işaretle.</legend>
    {exercise.options?.map((option, index) => {
      const isSelected = selected.includes(option.value);
      return <button
        key={option.id}
        type="button"
        className={`choice-option-button ${isSelected ? "selected" : ""}`}
        aria-pressed={isSelected}
        disabled={disabled}
        onClick={() => toggle(option.value)}
      >
        <span className="choice-option-marker square" aria-hidden="true">{isSelected ? <Check size={16}/> : String.fromCharCode(65 + index)}</span>
        <span className="choice-option-text">{option.label}</span>
      </button>;
    })}
  </fieldset>;
}
