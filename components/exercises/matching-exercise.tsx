"use client";

import type { Exercise } from "@/types/exercise";

export function MatchingExercise({ exercise, value, onChange, disabled }: { exercise: Exercise; value: unknown; onChange: (value: unknown) => void; disabled: boolean }) {
  const matches = typeof value === "object" && value !== null ? value as Record<string, string> : {};
  const rightItems = [...(exercise.pairs ?? [])].map((pair) => pair.right).reverse();
  return <div className="matching-grid">{exercise.pairs?.map((pair) => <label key={pair.left}><span>{pair.left}</span><select disabled={disabled} value={matches[pair.left] ?? ""} onChange={(event) => onChange({ ...matches, [pair.left]: event.target.value })}><option value="">Eşini seç</option>{rightItems.map((right) => <option key={right} value={right}>{right}</option>)}</select></label>)}</div>;
}
