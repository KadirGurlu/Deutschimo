export function TrueFalseExercise({ value, onChange, disabled }: { value: unknown; onChange: (value: unknown) => void; disabled: boolean }) {
  return <fieldset className="true-false-grid"><legend className="sr-only">Doğru veya yanlış seç</legend><button type="button" disabled={disabled} className={value === true ? "selected" : ""} onClick={() => onChange(true)}>Doğru</button><button type="button" disabled={disabled} className={value === false ? "selected" : ""} onClick={() => onChange(false)}>Yanlış</button></fieldset>;
}
