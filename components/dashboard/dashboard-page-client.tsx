"use client";

import { AppSidebar } from "@/components/layout/app-sidebar";
import { RecentActivityList } from "@/components/progress/recent-activity-list";
import { Progress } from "@/components/ui/progress";
import { TodayContinueCard } from "@/components/dashboard/today-continue-card";
import { TodayPlanCard } from "@/components/dashboard/today-plan-card";
import { courses } from "@/data/courses";
import { useLearningProgress } from "@/hooks/use-learning-progress";
import type { OnboardingFocusSkill } from "@/types/onboarding";
import { useSession } from "next-auth/react";
import styles from "./v32-1-dashboard.module.css";

const focusLabels: Record<OnboardingFocusSkill, string> = {
  VOCABULARY: "kelime",
  GRAMMAR: "gramer",
  READING: "okuma",
  LISTENING: "dinleme",
  WRITING: "yazma",
  SPEAKING: "konuşma",
};

function startOfCurrentWeek() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  const mondayOffset = (date.getDay() + 6) % 7;
  date.setDate(date.getDate() - mondayOffset);
  return date;
}

function dateKey(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function relativeStudyLabel(value?: string) {
  if (!value) return "Henüz çalışma yok";
  const source = new Date(value);
  if (Number.isNaN(source.getTime())) return "Henüz çalışma yok";
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const sourceDay = new Date(source);
  sourceDay.setHours(0, 0, 0, 0);
  const days = Math.round((today.getTime() - sourceDay.getTime()) / 86_400_000);
  if (days <= 0) return "Bugün";
  if (days === 1) return "Dün";
  if (days < 7) return `${days} gün önce`;
  return source.toLocaleDateString("tr-TR", { day: "numeric", month: "long" });
}

export function DashboardPageClient({ weeklyTargetDays = 5, focusSkills = [] }: {
  weeklyTargetDays?: number;
  focusSkills?: OnboardingFocusSkill[];
}) {
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
  const coursePercent = progressValues.length ? Math.round(progressValues.reduce((sum, value) => sum + value, 0) / progressValues.length) : 0;
  const completedCount = courseUnits.filter((unit) => store.unitProgressMap[unit.id]?.status === "COMPLETED").length;

  const studyTimestamps = [
    ...store.state.activities.map((item) => item.createdAt),
    ...store.state.studySessions.map((item) => item.startedAt),
    ...Object.values(store.state.learningPositions).map((item) => item.updatedAt),
    ...Object.values(store.unitProgressMap).flatMap((item) => [item.lastVisitedAt, item.completedAt].filter((value): value is string => Boolean(value))),
  ];
  const start = startOfCurrentWeek();
  const completedStudyDays = new Set(studyTimestamps
    .filter((value) => {
      const date = new Date(value);
      return !Number.isNaN(date.getTime()) && date >= start;
    })
    .map(dateKey)
    .filter((value): value is string => Boolean(value))).size;
  const targetDays = Math.max(1, Math.min(7, weeklyTargetDays || 5));
  const weeklyPercent = Math.min(100, Math.round((completedStudyDays / targetDays) * 100));
  const latestStudy = studyTimestamps
    .filter(Boolean)
    .sort((left, right) => new Date(right).getTime() - new Date(left).getTime())[0];
  const focusText = focusSkills.length
    ? focusSkills.map((skill) => focusLabels[skill]).join(" ve ")
    : "mevcut ilerleme";

  return (
    <div className="dashboard-shell">
      <AppSidebar active="dashboard"/>
      <section className="dashboard-main">
        <div className={styles.hero}>
          <div className={styles.heroCopy}>
            <span className={styles.eyebrow}>ÖĞRENCİ PANELİ</span>
            <h1 data-testid="v32-1-greeting">Guten Tag, {firstName}</h1>
            <p className={styles.goalLine}>Bugünkü hedefin: <strong>{dailyGoal} dakika</strong></p>
          </div>
          <div className={styles.focusNote}>Bugünkü planın <strong>{focusText}</strong> önceliklerin ve son öğrenme hareketlerin dikkate alınarak hazırlanır.</div>
        </div>

        <TodayPlanCard/>

        {continueUnit ? (
          <TodayContinueCard
            course={course}
            unit={continueUnit}
            position={position}
            progress={store.unitProgressMap[continueUnit.id]}
            lastStudyLabel={relativeStudyLabel(latestStudy)}
          />
        ) : null}

        <div className={styles.lowerGrid}>
          <section className={styles.infoCard} data-testid="v32-1-weekly-rhythm">
            <h2>Bu haftaki ritmin</h2>
            <p>Seri kaybetme baskısı yok. Hedefin, sürdürülebilir çalışma günlerini tamamlamak.</p>
            <span className={styles.bigNumber}>{completedStudyDays}/{targetDays} gün</span>
            <p>{completedStudyDays >= targetDays ? "Bu haftaki çalışma günü hedefini tamamladın." : `Bu hafta ${completedStudyDays}/${targetDays} çalışma gününü tamamladın.`}</p>
            <div className={styles.weekTrack}><div className={styles.weekFill} style={{ width: `${weeklyPercent}%` }}/></div>
          </section>

          <section className={styles.infoCard}>
            <h2>{course.level} kurs ilerlemesi</h2>
            <p>Günlük planın ana kurs ilerlemenle birlikte çalışır.</p>
            <span className={styles.bigNumber}>%{coursePercent}</span>
            <Progress value={coursePercent} label={`${completedCount}/${courseUnits.length} ünite tamamlandı`}/>
            <div className={styles.progressStats}>
              <div><strong>{completedCount}</strong><span>Tamamlanan ünite</span></div>
              <div><strong>{courseUnits.length - completedCount}</strong><span>Kalan ünite</span></div>
            </div>
          </section>

          <section className={`${styles.infoCard} ${styles.activityWrap}`}>
            <h2>Son hareketlerin</h2>
            <p>Bugünkü plan, son çalışmalarını da dikkate alır.</p>
            <RecentActivityList activities={store.state.activities.slice(0, 5)}/>
          </section>
        </div>
      </section>
    </div>
  );
}
