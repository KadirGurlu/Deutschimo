import type { Exercise } from "@/types/exercise";

export function MultipleSelectExercise({ exercise, value, onChange, disabled }: { exercise: Exercise; value: unknown; onChange: (value: unknown) => void; disabled: boolean }) {
  const selected = Array.isArray(value) ? value.map(String) : [];
  const toggle = (item: string) => onChange(selected.includes(item) ? selected.filter((valueItem) => valueItem !== item) : [...selected, item]);
  return <fieldset className="choice-grid"><legend className="selection-hint">Birden fazla seçenek işaretlenebilir.</legend>{exercise.options?.map((option) => <label key={option.id} className={selected.includes(option.value) ? "selected" : ""}><input type="checkbox" value={option.value} checked={selected.includes(option.value)} disabled={disabled} onChange={() => toggle(option.value)}/><span>{option.label}</span></label>)}</fieldset>;
}
