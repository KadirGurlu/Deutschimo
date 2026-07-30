import Link from "next/link";
import { BookOpenText, CheckCircle2, Clock3, Dumbbell, Lock } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { UnitStatusBadge } from "@/components/course/unit-status-badge";
import type { Unit } from "@/types/course";
import type { LearningStatus } from "@/types/learning";
import type { UnitProgress } from "@/types/progress";

export function UnitCard({ unit, status, progress, slideCount, exerciseCount, lockReason }: {
  unit: Unit;
  status: LearningStatus;
  progress: UnitProgress;
  slideCount: number;
  exerciseCount: number;
  lockReason?: string;
}) {
  const route = progress.stage === "QUIZ" ? `/learn/${unit.courseId}/${unit.id}/quiz` : progress.stage === "EXERCISES" ? `/learn/${unit.courseId}/${unit.id}/exercises` : `/learn/${unit.courseId}/${unit.id}`;
  const actionLabel = status === "COMPLETED" ? "Tekrar Çalış" : status === "IN_PROGRESS" ? "Devam Et" : "Üniteye Başla";
  const completedSlides = Math.round((progress.lessonProgress / 100) * slideCount);
  const completedExercises = Math.round((progress.exerciseProgress / 100) * exerciseCount);

  return <article className={`unit-card unit-card-${status.toLowerCase()}`} aria-label={`Ünite ${unit.order}: ${unit.title}, ${status}`}>
    <div className="learning-path-node">{status === "COMPLETED" ? <CheckCircle2 size={22}/> : status === "LOCKED" ? <Lock size={20}/> : unit.order}</div>
    <div className="unit-card-content">
      <div className="unit-card-head"><div><span className="eyebrow">ÜNİTE {unit.order}</span><h2>{unit.title}</h2></div><UnitStatusBadge status={status}/></div>
      <p>{unit.description}</p>
      <div className="unit-card-meta">
        <span><Clock3 size={16}/>{unit.estimatedMinutes} dakika</span>
        <span><BookOpenText size={16}/>{slideCount} ders slaytı</span>
        <span><Dumbbell size={16}/>{exerciseCount} alıştırma</span>
      </div>
      {status === "IN_PROGRESS" || status === "COMPLETED" ? <div className="unit-detail-progress">
        <Progress value={progress.totalProgress} label={`%${progress.totalProgress} ünite ilerlemesi`}/>
        <div><span>Ders notları {completedSlides}/{slideCount}</span><span>Alıştırmalar {completedExercises}/{exerciseCount}</span>{progress.bestQuizScore !== undefined ? <span>Quiz %{progress.bestQuizScore}</span> : null}</div>
      </div> : null}
      {status === "LOCKED" ? <div className="locked-reason"><Lock size={17}/><span>{lockReason}</span></div> : null}
      {status === "COMPLETED" && progress.completedAt ? <p className="completion-date">Tamamlanma: {new Intl.DateTimeFormat("tr-TR", { dateStyle: "medium" }).format(new Date(progress.completedAt))}</p> : null}
      <div className="unit-card-action">
        {status === "LOCKED" ? <button className="button button-secondary" disabled aria-label={lockReason}>Kilitli</button> : <Link className={`button ${status === "IN_PROGRESS" ? "button-primary" : "button-secondary"}`} href={route}>{actionLabel}</Link>}
        {status === "IN_PROGRESS" ? <span className="current-stage">{progress.stage === "LESSONS" ? `Ders notlarında ${completedSlides}/${slideCount}` : progress.stage === "EXERCISES" ? `Alıştırmalarda ${completedExercises}/${exerciseCount}` : "Ünite sonu değerlendirmesi bekliyor"}</span> : null}
      </div>
    </div>
  </article>;
}
