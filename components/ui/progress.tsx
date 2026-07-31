export function Progress({ value, label }: { value: number; label?: string }) {
  const normalized = Math.min(100, Math.max(0, value));
  return <div className="progress-wrap"><div className="progress-track" role="progressbar" aria-label={label ?? "İlerleme"} aria-valuemin={0} aria-valuemax={100} aria-valuenow={normalized}><span style={{ width: `${normalized}%` }}/></div>{label ? <span className="progress-label">{label}</span> : null}</div>;
}
