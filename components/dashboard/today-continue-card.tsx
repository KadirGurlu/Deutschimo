import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { Course, Unit } from "@/types/course";
import type { LearningPosition } from "@/types/learning";
import type { UnitProgress } from "@/types/progress";
import styles from "./v32-1-dashboard.module.css";

export function TodayContinueCard({ course, unit, position, progress, lastStudyLabel }: {
  course: Course;
  unit: Unit;
  position?: LearningPosition;
  progress?: UnitProgress;
  lastStudyLabel: string;
}) {
  const stage = position?.stage ?? progress?.stage ?? "LESSONS";
  const href = stage === "EXERCISES" ? `/learn/${course.id}/${unit.id}/exercises`
    : stage === "QUIZ" ? `/learn/${course.id}/${unit.id}/quiz`
      : `/learn/${course.id}/${unit.id}`;
  const percent = progress?.totalProgress ?? 0;
  return (
    <section className={styles.continueCard} data-testid="v32-1-continue-card">
      <div>
        <span className={styles.continueEyebrow}>KALDIĞIN YERDEN DEVAM ET</span>
        <h2>{course.level} Almanca · {unit.title}</h2>
        <p>{stage === "LESSONS" ? "Ders Notları" : stage === "EXERCISES" ? "Alıştırmalar" : stage === "QUIZ" ? "Ünite sonu testi" : "Ünite"}</p>
        <div className={styles.unitProgress}>
          <div className={styles.unitTrack}><div className={styles.unitFill} style={{ width: `${percent}%` }}/></div>
          <div className={styles.unitLabel}>%{percent} tamamlandı</div>
        </div>
        <div className={styles.continueMeta}><span>Son çalışma: {lastStudyLabel}</span><span>{course.title}</span></div>
      </div>
      <Link className={styles.continueAction} href={href}>Devam Et <ArrowRight size={17}/></Link>
    </section>
  );
}
