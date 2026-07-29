import { CheckCircle2, Circle, Lock, PlayCircle } from "lucide-react";
import { units } from "@/data/mock";
import { Progress } from "@/components/ui/progress";

export function CourseSidebar() {
  return (
    <aside className="learning-sidebar">
      <div className="sidebar-course"><span className="level-badge">A1</span><h2>A1.1 Almancaya İlk Adım</h2><Progress value={42} label="%42 tamamlandı" /></div>
      {units.map((unit) => <div className="unit" key={unit.title}><div className="unit-title"><strong>{unit.title}</strong><span>%{unit.progress}</span></div>{unit.lessons.map((lesson) => <div className={`lesson-link ${lesson.active ? "active" : ""}`} key={lesson.title}>{lesson.locked ? <Lock size={17} /> : lesson.done ? <CheckCircle2 size={18} /> : lesson.active ? <PlayCircle size={18} /> : <Circle size={18} />}<div><strong>{lesson.title}</strong><span>{lesson.type}</span></div></div>)}</div>)}
    </aside>
  );
}
