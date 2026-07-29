"use client";

import Link from "next/link";
import { BookOpenText, Clock3, Dumbbell, Star, Users } from "lucide-react";
import type { CourseCardData } from "@/data/mock";
import { courses as courseModels } from "@/data/courses";
import { Progress } from "@/components/ui/progress";
import { useLearningProgress } from "@/hooks/use-learning-progress";

export function CourseCard({ course }: { course: CourseCardData }) {
  const model = courseModels.find((item) => item.slug === course.slug)!;
  const { coursePercent } = useLearningProgress(model);
  return <article className="course-card">
    <Link href={`/courses/${course.slug}`} className="course-cover" style={{ background: course.accent }}><span className="cover-level">{course.level}</span><div><small>DEUTSCHIMO AKADEMİ</small><strong>{course.category}</strong></div></Link>
    <div className="course-body"><div className="eyebrow-row"><span className="level-badge">{course.level}</span><span>{course.access}</span></div><Link href={`/courses/${course.slug}`}><h3>{course.title}</h3></Link><p>{course.description}</p>
      <div className="course-meta"><span><Star size={15} fill="currentColor"/> {course.rating} ({course.reviews})</span><span><Users size={15}/> {course.students}</span></div>
      <div className="course-meta"><span><Clock3 size={15}/> {course.duration}</span><span><BookOpenText size={15}/> {course.lessons} ünite</span><span><Dumbbell size={15}/> {course.exercises} alıştırma</span></div>
      {coursePercent > 0 ? <Progress value={coursePercent} label={`%${coursePercent} tamamlandı`}/> : null}
    </div>
  </article>;
}
