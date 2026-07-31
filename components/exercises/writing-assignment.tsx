"use client";

import { useEffect } from "react";
import type { Exercise } from "@/types/exercise";

export function WritingAssignment({ exercise, value, onChange, disabled }: { exercise: Exercise; value: unknown; onChange: (value: unknown) => void; disabled: boolean }) {
  const text = String(value ?? "");
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  useEffect(() => {
    const saved = window.localStorage.getItem(`deutschimo-writing-${exercise.id}`);
    if (saved && !text) onChange(saved);
  }, [exercise.id]);
  return <label className="writing-assignment"><span>Yazma alanı</span><textarea rows={12} value={text} disabled={disabled} placeholder="Taslağını burada yaz..." onChange={(event) => { onChange(event.target.value); window.localStorage.setItem(`deutschimo-writing-${exercise.id}`, event.target.value); }}/><div><span>{words} kelime</span><span>Hedef: {exercise.minWords ?? 0}-{exercise.maxWords ?? "—"} kelime</span></div></label>;
}
