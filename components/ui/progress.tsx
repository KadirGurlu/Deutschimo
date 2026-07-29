export function Progress({ value, label }: { value: number; label?: string }) {
  return (
    <div className="progress-wrap" aria-label={label ?? `İlerleme yüzde ${value}`}>
      <div className="progress-track"><span style={{ width: `${Math.min(100, Math.max(0, value))}%` }} /></div>
      {label ? <span className="progress-label">{label}</span> : null}
    </div>
  );
}
