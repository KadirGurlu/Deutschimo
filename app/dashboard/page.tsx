"use client";

import Link from "next/link";
import { BookOpenCheck, Flame, Target, TrendingUp } from "lucide-react";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { IntelligenceOverviewPanel } from "@/components/intelligence/intelligence-overview";
import { SkillDashboardPanel } from "@/components/skills/skill-dashboard-panel";
import { ContinueLearningCard } from "@/components/progress/continue-learning-card";
import { RecentActivityList } from "@/components/progress/recent-activity-list";
import { StudyChart } from "@/components/dashboard/study-chart";
import { Progress } from "@/components/ui/progress";
import { courses } from "@/data/courses";
import { units } from "@/data/units";
import { useLearningProgress } from "@/hooks/use-learning-progress";
import { useSession } from "next-auth/react";

export default function DashboardPage() {
  const { data: session } = useSession();
  const firstName = session?.user.firstName ?? session?.user.name?.split(" ")[0] ?? "Öğrenci";
  const dailyGoal = session?.user.dailyGoalMinutes ?? 30;
  const level = session?.user.currentLevel ?? "A1";
  const course = courses.find((item) => item.level === level) ?? courses[0];
  const store = useLearningProgress(course);
  const position = store.state.learningPositions[course.id];
  const continueUnit = position ? units.find((unit) => unit.id === position.unitId) : store.units.find((unit) => store.getStatus(unit.id) !== "LOCKED") ?? store.units[0];
  const completedSlides = Object.values(store.state.slideProgress).filter((item) => item.status === "COMPLETED").length;
  const completedExercises = new Set(store.state.exerciseAttempts.map((item) => item.exerciseId)).size;
  const quizScores = store.state.quizAttempts.map((attempt) => attempt.score);
  const averageQuiz = quizScores.length ? Math.round(quizScores.reduce((sum, score) => sum + score, 0) / quizScores.length) : 0;
  const lastCompleted = [...store.units].reverse().find((unit) => store.unitProgressMap[unit.id]?.status === "COMPLETED");
  const nextUnit = store.units.find((unit) => store.getStatus(unit.id) !== "LOCKED" && store.unitProgressMap[unit.id]?.status !== "COMPLETED");

  return <div className="dashboard-shell"><AppSidebar active="dashboard"/><section className="dashboard-main">
    <div className="welcome"><div><span className="eyebrow">ÖĞRENCİ PANELİ</span><h1>Tekrar hoş geldin, {firstName}.</h1><p>Bugünkü {dailyGoal} dakikalık çalışma hedefini sürdür.</p></div><Link className="button button-primary" href={continueUnit ? `/learn/${course.id}/${continueUnit.id}` : `/courses/${course.slug}`}>Derse Devam Et</Link></div>
    <div className="stats-grid"><Stat icon={<Target/>} label="Günlük hedef" value={`${dailyGoal} dk`} note="Kişisel planına göre dağıtılır"/><Stat icon={<Flame/>} label="Çalışma serisi" value="6 gün" note="Kişisel rekor: 11 gün"/><Stat icon={<BookOpenCheck/>} label="Tamamlanan ünite" value={String(store.completedCount)} note={`${store.inProgressCount} ünite devam ediyor`}/><Stat icon={<TrendingUp/>} label="Ortalama quiz" value={`%${averageQuiz}`} note={`${quizScores.length} değerlendirme`}/></div>
    <IntelligenceOverviewPanel/>
    <SkillDashboardPanel/>
    {continueUnit ? <ContinueLearningCard course={course} unit={continueUnit} position={position} progress={store.unitProgressMap[continueUnit.id]}/> : null}
    <div className="dashboard-grid"><div style={{display:"grid",gap:20}}><section className="panel"><div className="section-head"><h2>Haftalık çalışma</h2><span className="level-badge">Son 7 gün</span></div><StudyChart/></section><section className="panel"><h2>{course.level} program ilerlemesi</h2><Progress value={store.coursePercent} label={`${store.completedCount}/${store.units.length} ünite tamamlandı`}/><div className="dashboard-detail-grid"><span><strong>{completedSlides}</strong>Tamamlanan ders slaytı</span><span><strong>{completedExercises}</strong>Tamamlanan alıştırma</span><span><strong>{lastCompleted?.title ?? "—"}</strong>Son tamamlanan ünite</span><span><strong>{nextUnit?.title ?? "—"}</strong>Sıradaki ünite</span></div></section></div><aside className="panel"><h2>Son aktiviteler</h2><RecentActivityList activities={store.state.activities.slice(0,8)}/></aside></div>
  </section></div>;
}

function Stat({ icon, label, value, note }: { icon: React.ReactNode; label: string; value: string; note: string }) { return <article className="stat-card"><span>{icon}</span><div><small>{label}</small><strong>{value}</strong><p>{note}</p></div></article>; }
