import Link from "next/link";
import { ArrowRight, BookOpenCheck } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import type { Course, Unit } from "@/types/course";
import type { LearningPosition } from "@/types/learning";
import type { UnitProgress } from "@/types/progress";

export function ContinueLearningCard({ course, unit, position, progress }: { course: Course; unit: Unit; position?: LearningPosition; progress?: UnitProgress }) {
  const stage = position?.stage ?? progress?.stage ?? "LESSONS";
  const href = stage === "EXERCISES" ? `/learn/${course.id}/${unit.id}/exercises` : stage === "QUIZ" ? `/learn/${course.id}/${unit.id}/quiz` : `/learn/${course.id}/${unit.id}`;
  return <section className="continue-learning-card"><BookOpenCheck size={28}/><div><span className="eyebrow">KALDIĞIN YERDEN DEVAM ET</span><h2>{unit.title}</h2><p>{stage === "LESSONS" ? "Ders Notları" : stage === "EXERCISES" ? "Alıştırmalar" : stage === "QUIZ" ? "Ünite sonu testi" : "Ünite tamamlandı"} · {position?.itemId ?? "İlk adım"}</p><Progress value={progress?.totalProgress ?? 0} label={`%${progress?.totalProgress ?? 0} ünite ilerlemesi`}/></div><Link className="button button-primary" href={href}>Devam Et <ArrowRight size={18}/></Link></section>;
}
