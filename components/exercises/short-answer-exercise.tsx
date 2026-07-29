export function ShortAnswerExercise({ value, onChange, disabled }: { value: unknown; onChange: (value: unknown) => void; disabled: boolean }) {
  return <label className="exercise-text-field"><span>Kısa cevabın</span><textarea rows={5} value={String(value ?? "")} disabled={disabled} placeholder="1-2 cümle yaz" onChange={(event) => onChange(event.target.value)}/></label>;
}
