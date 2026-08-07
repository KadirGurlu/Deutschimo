"use client";

import Link from "next/link";
import { Check } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { DailyPlanTask, DailyStudyPlan } from "@/types/intelligence";
import styles from "./v32-1-dashboard.module.css";

function localDate() {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
}

const typeLabel: Record<string, string> = {
  LESSON: "Ders",
  REVIEW: "Akıllı Tekrar",
  QUIZ: "Günlük Alıştırma",
  VOCABULARY: "Kelime",
  WRITING: "Yazma",
  PLACEMENT: "Seviye Testi",
  SKILL: "Beceri",
};

function actionLabel(task: DailyPlanTask) {
  if (task.type === "LESSON") return "Derse devam et";
  if (task.type === "REVIEW") return "Tekrar başlat";
  if (task.type === "PLACEMENT") return "Teste başla";
  return "Başla";
}

export function TodayPlanCard() {
  const [plan, setPlan] = useState<DailyStudyPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const date = useMemo(localDate, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/intelligence/daily-plan?date=${date}`, { cache: "no-store" });
      const payload = await response.json() as { plan?: DailyStudyPlan; error?: string };
      if (!response.ok || !payload.plan) throw new Error(payload.error ?? "Bugünkü plan getirilemedi.");
      setPlan(payload.plan);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Bugünkü plan getirilemedi.");
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => { void load(); }, [load]);

  async function toggle(taskId: string, completed: boolean) {
    if (!plan) return;
    const tasks = plan.tasks.map((task) => task.id === taskId ? { ...task, completed } : task);
    const completedMinutes = tasks.filter((task) => task.completed).reduce((sum, task) => sum + task.minutes, 0);
    setPlan({ ...plan, tasks, completedMinutes });
    try {
      const response = await fetch("/api/intelligence/daily-plan", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planDate: plan.planDate, taskId, completed }),
      });
      const payload = await response.json() as { plan?: DailyStudyPlan; error?: string };
      if (!response.ok || !payload.plan) throw new Error(payload.error ?? "Görev güncellenemedi.");
      setPlan(payload.plan);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Görev güncellenemedi.");
      await load();
    }
  }

  if (loading) return <section className={styles.loading} data-testid="v32-1-plan-loading">Bugünkü kişisel çalışma paketin hazırlanıyor…</section>;
  if (!plan) return <section className={styles.error}><strong>Bugünkü plan yüklenemedi.</strong><p>{error}</p><Link className={styles.smallLink} href="/study-plan">Günlük Plan sayfasını aç</Link></section>;

  const percent = plan.goalMinutes ? Math.min(100, Math.round((plan.completedMinutes / plan.goalMinutes) * 100)) : 0;
  return (
    <section className={styles.planCard} data-testid="v32-1-today-plan">
      <div className={styles.planHeader}>
        <div>
          <span className={styles.eyebrow}>BUGÜN BUNLARI YAP</span>
          <h2>Bugünkü Planın</h2>
          <p>Ders, tekrar ve kısa pratiğin tek bir çalışma paketinde.</p>
        </div>
        <div className={styles.planScore} data-testid="v32-1-plan-minutes">
          <strong>{plan.completedMinutes} / {plan.goalMinutes} dk</strong>
          <span>bugünkü hedef</span>
        </div>
      </div>

      <div className={styles.taskList}>
        {plan.tasks.map((task, index) => (
          <article className={`${styles.task} ${task.completed ? styles.taskDone : ""}`} key={task.id} data-testid={`v32-1-task-${index}`}>
            <button className={styles.check} type="button" onClick={() => void toggle(task.id, !task.completed)} aria-label={task.completed ? `${task.title} görevini geri al` : `${task.title} görevini tamamla`}>
              {task.completed ? <Check size={18}/> : index + 1}
            </button>
            <div className={styles.taskBody}>
              <div className={styles.taskMeta}><span>{typeLabel[task.type] ?? task.type}</span><span>•</span><span>{task.priority === "HIGH" ? "Öncelikli" : "Destek çalışması"}</span></div>
              <h3>{task.title}</h3>
              <p>{task.description}</p>
            </div>
            <span className={styles.minutes}>{task.minutes} dk</span>
            <Link className={styles.action} href={task.href}>{actionLabel(task)}</Link>
          </article>
        ))}
      </div>

      <div className={styles.progressTrack} aria-hidden="true"><div className={styles.progressFill} style={{ width: `${percent}%` }}/></div>
      <div className={styles.planFooter}>
        <span><strong>%{percent}</strong> tamamlandı</span>
        <Link className={styles.smallLink} href="/study-plan">Planın ayrıntılarını görüntüle</Link>
      </div>
      {error ? <p className={styles.error}>{error}</p> : null}
    </section>
  );
}
