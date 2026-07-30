"use client";

import Link from "next/link";
import { BookOpenCheck, Clock3, Dumbbell, Target, TrendingUp } from "lucide-react";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { Progress } from "@/components/ui/progress";
import { ProgressTimeline } from "@/components/progress/progress-timeline";
import { RecentActivityList } from "@/components/progress/recent-activity-list";
import { StudyChart } from "@/components/dashboard/study-chart";
import { courses } from "@/data/courses";
import { useLearningProgress } from "@/hooks/use-learning-progress";

export default function ProgressPage() {
  const store = useLearningProgress(courses[0]);
  const completedExercises = new Set(store.state.exerciseAttempts.map((attempt) => attempt.exerciseId)).size;
  const scores = store.state.quizAttempts.map((attempt) => attempt.score);
  const average = scores.length ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length) : 0;
  const focusedUnit = store.units.find((unit) => store.unitProgressMap[unit.id]?.status === "IN_PROGRESS") ?? store.units[0];
  return <div className="dashboard-shell"><AppSidebar active="progress"/><section className="dashboard-main"><div className="section-head"><div><span className="eyebrow">PERFORMANS ANALİZİ</span><h1 className="section-title">İlerlemen</h1><p className="section-copy">Kurs, ünite, ders slaytı, alıştırma ve quiz gelişimini tek ekranda incele.</p></div><select><option>Son 30 gün</option><option>Son 7 gün</option><option>Tüm zamanlar</option></select></div>
    <div className="stats-grid"><Metric icon={<TrendingUp/>} label="A1 kurs ilerlemesi" value={`%${store.coursePercent}`} note={`${store.completedCount}/${store.units.length} ünite`}/><Metric icon={<BookOpenCheck/>} label="Tamamlanan ünite" value={String(store.completedCount)} note={`${store.inProgressCount} devam ediyor`}/><Metric icon={<Dumbbell/>} label="Alıştırmalar" value={String(completedExercises)} note="Tamamlanan zorunlu adımlar"/><Metric icon={<Target/>} label="Quiz ortalaması" value={`%${average}`} note={`${scores.length} sonuç`}/></div>
    <div className="progress-layout"><section className="panel"><h2>Haftalık çalışma</h2><StudyChart/></section><section className="panel"><h2>Kurs bazlı ilerleme</h2><div className="course-progress-list">{courses.map((course) => <CourseProgressItem course={course} key={course.id}/>)}</div></section><section className="panel full-span"><h2>Ünite bazlı ilerleme</h2><div className="unit-progress-table">{store.units.map((unit) => <article key={unit.id}><div><span className="level-badge">Ünite {unit.order}</span><strong>{unit.title}</strong></div><Progress value={store.unitProgressMap[unit.id]?.totalProgress ?? 0} label={`%${store.unitProgressMap[unit.id]?.totalProgress ?? 0}`}/><Link href={`/learn/${unit.courseId}/${unit.id}`}>Tekrar Çalış</Link></article>)}</div></section>
      {focusedUnit ? <section className="panel"><h2>{focusedUnit.title} zaman çizelgesi</h2><ProgressTimeline progress={store.unitProgressMap[focusedUnit.id]}/></section> : null}<section className="panel"><h2>Son aktiviteler</h2><RecentActivityList activities={store.state.activities.slice(0,10)}/></section></div>
  </section></div>;
}
function Metric({ icon, label, value, note }: { icon: React.ReactNode; label: string; value: string; note: string }) { return <article className="stat-card"><span>{icon}</span><div><small>{label}</small><strong>{value}</strong><p>{note}</p></div></article>; }
function CourseProgressItem({ course }: { course: (typeof courses)[number] }) { const store = useLearningProgress(course); return <article><div><span className="level-badge">{course.level}</span><strong>{store.completedCount}/{store.units.length} ünite</strong></div><Progress value={store.coursePercent} label={`%${store.coursePercent}`}/></article>; }
