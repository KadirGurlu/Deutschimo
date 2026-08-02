"use client";

import Link from "next/link";
import { BookOpenCheck, Flame, Target, TrendingUp } from "lucide-react";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { IntelligenceOverviewPanel } from "@/components/intelligence/intelligence-overview";
import { SkillDashboardPanel } from "@/components/skills/skill-dashboard-panel";
import { VocabularyDashboardCard } from "@/components/vocabulary/vocabulary-dashboard-card";
import { ContinueLearningCard } from "@/components/progress/continue-learning-card";
import { RecentActivityList } from "@/components/progress/recent-activity-list";
import { StudyChart } from "@/components/dashboard/study-chart";
import { Progress } from "@/components/ui/progress";
import { courses } from "@/data/courses";
import { useLearningProgress } from "@/hooks/use-learning-progress";
import { calculateStudyStreak } from "@/lib/learning/streak";
import { useSession } from "next-auth/react";

export default function DashboardPage() {
  const { data: session } = useSession();
  const firstName = session?.user.firstName ?? session?.user.name?.split(" ")[0] ?? "Öğrenci";
  const dailyGoal = session?.user.dailyGoalMinutes ?? 30;
  const fallbackLevel = session?.user.currentLevel ?? "A1";
  const store = useLearningProgress();

  const mostRecentPosition = Object.values(store.state.learningPositions)
    .sort((left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime())
    .find((position) => courses.some((item) => item.id === position.courseId));
  const course = courses.find((item) => item.id === mostRecentPosition?.courseId)
    ?? courses.find((item) => item.level === fallbackLevel)
    ?? courses[0];
  const courseUnits = store.units.filter((unit) => unit.courseId === course.id);
  const position = store.state.learningPositions[course.id];
  const continueUnit = (position ? courseUnits.find((unit) => unit.id === position.unitId) : undefined)
    ?? courseUnits.find((unit) => store.getStatus(unit.id) !== "LOCKED" && store.unitProgressMap[unit.id]?.status !== "COMPLETED")
    ?? courseUnits.at(-1);

  const progressValues = courseUnits.map((unit) => store.unitProgressMap[unit.id]?.totalProgress ?? 0);
  const coursePercent = progressValues.length
    ? Math.round(progressValues.reduce((sum, value) => sum + value, 0) / progressValues.length)
    : 0;
  const completedCount = courseUnits.filter((unit) => store.unitProgressMap[unit.id]?.status === "COMPLETED").length;
  const inProgressCount = courseUnits.filter((unit) => store.unitProgressMap[unit.id]?.status === "IN_PROGRESS").length;
  const completedSlides = Object.values(store.state.slideProgress).filter((item) => item.status === "COMPLETED").length;
  const completedExercises = new Set(store.state.exerciseAttempts.map((item) => item.exerciseId)).size;
  const quizScores = store.state.quizAttempts.map((attempt) => attempt.score);
  const averageQuiz = quizScores.length ? Math.round(quizScores.reduce((sum, score) => sum + score, 0) / quizScores.length) : 0;
  const lastCompleted = [...courseUnits].reverse().find((unit) => store.unitProgressMap[unit.id]?.status === "COMPLETED");
  const nextUnit = courseUnits.find((unit) => store.getStatus(unit.id) !== "LOCKED" && store.unitProgressMap[unit.id]?.status !== "COMPLETED");
  const streak = calculateStudyStreak([
    ...store.state.activities.map((activity) => activity.createdAt),
    ...store.state.studySessions.map((studySession) => studySession.startedAt),
    ...Object.values(store.state.learningPositions).map((learningPosition) => learningPosition.updatedAt),
  ]);

  const continueHref = continueUnit
    ? `/learn/${course.id}/${continueUnit.id}`
    : `/courses/${course.slug}`;

  return <div className="dashboard-shell"><AppSidebar active="dashboard"/><section className="dashboard-main">
    <div className="welcome"><div><span className="eyebrow">ÖĞRENCİ PANELİ</span><h1>Tekrar hoş geldin, {firstName}.</h1><p>{course.title} programında kaldığın yerden devam et.</p></div><div className="v26-welcome-actions"><Link className="button button-secondary" href="/courses">Kursları Görüntüle</Link><Link className="button button-primary" href={continueHref}>Derse Devam Et</Link></div></div>
    <div className="stats-grid">
      <Stat icon={<BookOpenCheck/>} label="Devam edilen kurs" value={course.level} note={course.title}/>
      <Stat icon={<Flame/>} label="Çalışma serisi" value={`${streak.current} gün`} note={streak.best ? `Kişisel rekor: ${streak.best} gün` : "İlk çalışmanla serini başlat"}/>
      <Stat icon={<TrendingUp/>} label="Kurs ilerlemesi" value={`%${coursePercent}`} note={`${completedCount}/${courseUnits.length} ünite tamamlandı`}/>
      <Stat icon={<Target/>} label="Günlük hedef" value={`${dailyGoal} dk`} note="Kişisel planına göre dağıtılır"/>
    </div>
    {continueUnit ? <ContinueLearningCard course={course} unit={continueUnit} position={position} progress={store.unitProgressMap[continueUnit.id]}/> : null}
    <IntelligenceOverviewPanel/>
    <SkillDashboardPanel/>
    <VocabularyDashboardCard/>
    <div className="dashboard-grid"><div style={{display:"grid",gap:20}}><section className="panel"><div className="section-head"><h2>Haftalık çalışma</h2><span className="level-badge">Son 7 gün</span></div><StudyChart/></section><section className="panel"><h2>{course.level} program ilerlemesi</h2><Progress value={coursePercent} label={`${completedCount}/${courseUnits.length} ünite tamamlandı`}/><div className="dashboard-detail-grid"><span><strong>{completedSlides}</strong>Tamamlanan ders slaytı</span><span><strong>{completedExercises}</strong>Tamamlanan alıştırma</span><span><strong>{lastCompleted?.title ?? "—"}</strong>Son tamamlanan ünite</span><span><strong>{nextUnit?.title ?? "—"}</strong>Sıradaki ünite</span><span><strong>%{averageQuiz}</strong>Quiz ortalaması</span><span><strong>{inProgressCount}</strong>Devam eden ünite</span></div></section></div><aside className="panel"><h2>Son aktiviteler</h2><RecentActivityList activities={store.state.activities.slice(0,8)}/></aside></div>
  </section></div>;
}

function Stat({ icon, label, value, note }: { icon: React.ReactNode; label: string; value: string; note: string }) { return <article className="stat-card"><span>{icon}</span><div><small>{label}</small><strong>{value}</strong><p>{note}</p></div></article>; }
