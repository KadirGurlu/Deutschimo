import Link from "next/link";
import { BookOpen, Clock3, Star, Users } from "lucide-react";
import type { Course } from "@/data/mock";
import { Progress } from "@/components/ui/progress";

export function CourseCard({ course }: { course: Course }) {
  return (
    <article className="course-card">
      <Link href={`/courses/${course.slug}`} className="course-cover" style={{ background: course.accent }}>
        <span className="cover-level">{course.level}</span>
        <div><small>DEUTSCHIMO AKADEMİ</small><strong>{course.category}</strong></div>
      </Link>
      <div className="course-body">
        <div className="eyebrow-row"><span className="level-badge">{course.level}</span><span>{course.access}</span></div>
        <Link href={`/courses/${course.slug}`}><h3>{course.title}</h3></Link>
        <p>{course.description}</p>
        <div className="course-meta"><span><Star size={15} fill="currentColor" /> {course.rating} ({course.reviews})</span><span><Users size={15} /> {course.students}</span></div>
        <div className="course-meta"><span><Clock3 size={15} /> {course.duration}</span><span><BookOpen size={15} /> {course.lessons} ders</span></div>
        {typeof course.progress === "number" ? <Progress value={course.progress} label={`%${course.progress} tamamlandı`} /> : null}
      </div>
    </article>
  );
}
