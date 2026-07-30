export function FillBlankExercise({ value, onChange, disabled, placeholder = "Cevabını yaz" }: { value: unknown; onChange: (value: unknown) => void; disabled: boolean; placeholder?: string }) {
  return <label className="exercise-text-field"><span>Cevabın</span><input value={String(value ?? "")} disabled={disabled} placeholder={placeholder} onChange={(event) => onChange(event.target.value)}/></label>;
}
