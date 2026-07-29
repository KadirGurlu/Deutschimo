import { CheckCircle2, Circle, Clock3, Lock } from "lucide-react";
import type { LearningStatus } from "@/types/learning";

export function UnitStatusBadge({ status }: { status: LearningStatus }) {
  const config = {
    NOT_STARTED: { label: "Başlanmadı", icon: <Circle size={15} /> },
    IN_PROGRESS: { label: "Devam Ediyor", icon: <Clock3 size={15} /> },
    COMPLETED: { label: "Tamamlandı", icon: <CheckCircle2 size={15} /> },
    LOCKED: { label: "Kilitli", icon: <Lock size={15} /> },
  }[status];
  return <span className={`unit-status-badge status-${status.toLowerCase()}`}>{config.icon}{config.label}</span>;
}
