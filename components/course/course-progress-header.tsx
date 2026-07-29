import { BookOpenCheck, Clock3, Target } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import type { Course } from "@/types/course";

export function CourseProgressHeader({ course, percent, completed, total, dailyGoal = 30 }: { course: Course; percent: number; completed: number; total: number; dailyGoal?: number }) {
  return <section className="course-progress-header">
    <div><span className="eyebrow">{course.level} PROGRAMI</span><h1>{course.title}</h1><p>{course.description}</p></div>
    <div className="course-progress-summary">
      <div className="course-progress-number"><strong>%{percent}</strong><span>Toplam ilerleme</span></div>
      <Progress value={percent} label={`${completed} / ${total} ünite tamamlandı`} />
      <div className="course-meta-grid">
        <span><Clock3 size={18}/><strong>{course.estimatedHours} saat</strong><small>Tahmini süre</small></span>
        <span><BookOpenCheck size={18}/><strong>{total} ünite</strong><small>Program yapısı</small></span>
        <span><Target size={18}/><strong>{dailyGoal} dakika</strong><small>Günlük hedef</small></span>
      </div>
    </div>
  </section>;
}
