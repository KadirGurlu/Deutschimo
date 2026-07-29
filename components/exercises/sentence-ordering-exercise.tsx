"use client";

import { RotateCcw, Undo2 } from "lucide-react";
import type { Exercise } from "@/types/exercise";

export function SentenceOrderingExercise({ exercise, value, onChange, disabled }: { exercise: Exercise; value: unknown; onChange: (value: unknown) => void; disabled: boolean }) {
  const ordered = Array.isArray(value) ? value.map(String) : [];
  const remaining = (exercise.tokens ?? []).filter((token) => !ordered.includes(token));
  return <div className="ordering-exercise"><div className="ordering-result">{ordered.length ? ordered.map((token) => <span key={token}>{token}</span>) : <em>Parçalara dokunarak sıraya ekle.</em>}</div><div className="ordering-tokens">{remaining.map((token) => <button type="button" disabled={disabled} key={token} onClick={() => onChange([...ordered, token])}>{token}</button>)}</div><div className="ordering-actions"><button type="button" disabled={disabled || !ordered.length} onClick={() => onChange(ordered.slice(0, -1))}><Undo2 size={16}/> Geri al</button><button type="button" disabled={disabled || !ordered.length} onClick={() => onChange([])}><RotateCcw size={16}/> Sıfırla</button></div></div>;
}
