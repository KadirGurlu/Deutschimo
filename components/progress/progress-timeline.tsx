import { CheckCircle2, Circle } from "lucide-react";
import type { UnitProgress } from "@/types/progress";

export function ProgressTimeline({ progress }: { progress: UnitProgress }) {
  const steps = [
    ["Üniteye başlandı", Boolean(progress.startedAt)],
    ["Ders notları tamamlandı", progress.lessonProgress === 100],
    ["Alıştırmalar tamamlandı", progress.exerciseProgress === 100],
    ["Quiz tamamlandı", progress.quizProgress > 0],
    ["Ünite tamamlandı", progress.status === "COMPLETED"],
  ] as const;
  return <ol className="progress-timeline">{steps.map(([label, done]) => <li className={done ? "done" : ""} key={label}>{done ? <CheckCircle2 size={18}/> : <Circle size={18}/>}<span>{label}</span></li>)}</ol>;
}
