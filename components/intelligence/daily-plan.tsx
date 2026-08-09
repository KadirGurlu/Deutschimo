"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  BookOpenCheck,
  BrainCircuit,
  CalendarCheck2,
  Check,
  Clock3,
  RefreshCw,
  Sparkles,
  Target,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import type { DailyStudyPlan } from "@/types/intelligence";
import type { PersonalLearningSkill } from "@/types/personal-learning-v43";

function localDate() {
  const date = new Date();
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
}

const typeLabel: Record<string, string> = {
  LESSON: "Ders",
  REVIEW: "Tekrar",
  QUIZ: "Quiz",
  VOCABULARY: "Kelime",
  WRITING: "Yazma",
  PLACEMENT: "Seviye testi",
  SKILL: "Beceri",
};

const skillLabel: Record<PersonalLearningSkill, string> = {
  VOCABULARY: "Kelime",
  GRAMMAR: "Gramer",
  READING: "Okuma",
  LISTENING: "Dinleme",
  WRITING: "Yazma",
  SPEAKING: "Konuşma",
};

export function DailyPlan() {
  const [plan, setPlan] = useState<DailyStudyPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const date = useMemo(localDate, []);

  async function load(refresh = false) {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(
        `/api/intelligence/daily-plan?date=${date}${refresh ? "&refresh=1" : ""}`,
        { cache: "no-store" },
      );
      const payload = await response.json() as { plan?: DailyStudyPlan; error?: string };
      if (!response.ok || !payload.plan) {
        throw new Error(payload.error ?? "Günlük plan getirilemedi.");
      }
      setPlan(payload.plan);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Günlük plan getirilemedi.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);

  async function toggle(taskId: string, completed: boolean) {
    if (!plan) return;
    const optimisticTasks = plan.tasks.map((task) =>
      task.id === taskId ? { ...task, completed } : task
    );
    setPlan({
      ...plan,
      tasks: optimisticTasks,
      completedMinutes: optimisticTasks
        .filter((task) => task.completed)
        .reduce((sum, task) => sum + task.minutes, 0),
    });

    const response = await fetch("/api/intelligence/daily-plan", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ planDate: plan.planDate, taskId, completed }),
    });
    const payload = await response.json() as { plan?: DailyStudyPlan; error?: string };
    if (!response.ok || !payload.plan) {
      setError(payload.error ?? "Plan güncellenemedi.");
      await load();
      return;
    }
    setPlan(payload.plan);
  }

  if (loading) {
    return (
      <section className="panel intelligence-loading">
        <BrainCircuit className="spin-soft"/>
        <h2>V43 kişisel planın hazırlanıyor</h2>
        <p>Onboarding profilin, Mastery, tekrar kuyruğu ve son beceri sonuçların birleştiriliyor.</p>
      </section>
    );
  }

  if (error && !plan) {
    return (
      <section className="panel">
        <div className="auth-message auth-error">{error}</div>
        <button className="button button-secondary" onClick={() => load()}>
          <RefreshCw size={17}/>Tekrar Dene
        </button>
      </section>
    );
  }

  if (!plan) return null;

  const percent = plan.plannedMinutes
    ? Math.round((plan.completedMinutes / plan.plannedMinutes) * 100)
    : 0;
  const engine = plan.personalization;

  return (
    <div className="intelligence-stack v43-plan">
      <section className="daily-plan-hero v43-plan-hero">
        <div>
          <span className="eyebrow">V43 · KİŞİSEL ÖĞRENME MOTORU 2.0</span>
          <h1>Bugünkü {plan.goalMinutes} dakikan sana göre dağıtıldı.</h1>
          <p>
            Plan yalnız profil tercihlerine bakmaz; gerçek performans geldikçe
            beceriler arasındaki dakika payını kontrollü biçimde değiştirir.
          </p>
        </div>
        <div className="daily-plan-score">
          <CalendarCheck2/>
          <strong>%{percent}</strong>
          <span>{plan.completedMinutes}/{plan.plannedMinutes} dakika</span>
        </div>
      </section>

      {engine ? (
        <>
          <section className="panel v43-profile-card">
            <div className="section-head">
              <div>
                <span className="eyebrow">ÖĞRENME PROFİLİN</span>
                <h2>V32 onboarding artık planın girdisi</h2>
              </div>
              <span className={`v43-mode ${engine.mode.toLowerCase()}`}>
                {engine.mode === "ADAPTIVE" ? "Adaptif mod" : "Profil ağırlıklı başlangıç"}
              </span>
            </div>
            <div className="v43-profile-grid">
              <div><span>Seviye</span><strong>{engine.profile.level}</strong></div>
              <div><span>Hedef</span><strong>{engine.profile.goalLabel}</strong></div>
              <div><span>Günlük süre</span><strong>{engine.profile.dailyMinutes} dk</strong></div>
              <div><span>Haftalık ritim</span><strong>{engine.profile.studyDaysPerWeek} gün</strong></div>
              <div className="wide">
                <span>Önceliklerin</span>
                <strong>{engine.profile.focusLabels.join(" · ") || "Dengeli çalışma"}</strong>
              </div>
              <div><span>Veri kapsamı</span><strong>%{engine.dataCoverage}</strong></div>
            </div>
          </section>

          <section className="panel">
            <div className="section-head">
              <div>
                <span className="eyebrow">BUGÜN NEDEN BU DAĞILIM?</span>
                <h2>Motorun kararını görebilirsin</h2>
              </div>
              <Target/>
            </div>
            <div className="v43-reason-list">
              {engine.reasons.map((reason) => <p key={reason}>{reason}</p>)}
            </div>
            <div className="v43-signal-grid">
              {engine.signals.map((signal) => (
                <article key={signal.skill} className={signal.skill === engine.primarySkill ? "primary" : ""}>
                  <div>
                    <strong>{skillLabel[signal.skill]}</strong>
                    <b>{Math.round(signal.priorityScore)}</b>
                  </div>
                  <div className="v43-signal-track">
                    <span style={{ width: `${signal.priorityScore}%` }}/>
                  </div>
                  <small>
                    {signal.masteryScore !== null ? `Ustalık %${Math.round(signal.masteryScore)}` : "Ustalık verisi bekleniyor"}
                    {signal.recentAverage !== null ? ` · Son ort. %${Math.round(signal.recentAverage)}` : ""}
                  </small>
                </article>
              ))}
            </div>
            <p className="v43-plan-note">
              Bugünkü plan gün içinde sabit kalır. Yeni sonuçlar yarının dağılımını değiştirir;
              “Planı yeniden hesapla” yalnızca bilinçli olarak yeni plan istediğinde kullanılır.
            </p>
          </section>
        </>
      ) : null}

      <section className="panel">
        <div className="section-head">
          <div>
            <h2>Bugünün görevleri</h2>
            <p className="section-copy">
              {new Date(`${plan.planDate}T12:00:00`).toLocaleDateString(
                "tr-TR",
                { weekday: "long", day: "numeric", month: "long" },
              )}
            </p>
          </div>
          <button className="button button-secondary" onClick={() => load(true)}>
            <RefreshCw size={17}/>Planı yeniden hesapla
          </button>
        </div>

        <Progress value={percent} label={`Tamamlanma · %${percent}`}/>

        <div className="plan-task-list">
          {plan.tasks.map((task, index) => (
            <article
              className={task.completed ? "plan-task completed" : "plan-task"}
              key={task.id}
            >
              <button
                className="plan-check"
                onClick={() => toggle(task.id, !task.completed)}
                aria-label={task.completed ? "Tamamlanmadı olarak işaretle" : "Tamamlandı olarak işaretle"}
              >
                {task.completed ? <Check/> : <span>{index + 1}</span>}
              </button>
              <div className="plan-task-body">
                <div className="plan-task-meta">
                  <span className="level-badge">{typeLabel[task.type]}</span>
                  <span className={`priority priority-${task.priority.toLowerCase()}`}>
                    {task.priority === "HIGH" ? "Yüksek öncelik" : task.priority === "MEDIUM" ? "Orta öncelik" : "İsteğe bağlı"}
                  </span>
                  {task.adaptive ? <span className="v43-adaptive-badge">V43 uyarlaması</span> : null}
                </div>
                <h3>{task.title}</h3>
                <p>{task.description}</p>
                {task.reason ? (
                  <p className="v43-task-reason"><Sparkles size={15}/>{task.reason}</p>
                ) : null}
                <span className="task-time"><Clock3 size={16}/>{task.minutes} dakika</span>
              </div>
              <Link className="button button-secondary" href={task.href}>
                {task.completed ? <BookOpenCheck size={17}/> : <Sparkles size={17}/>}Aç
              </Link>
            </article>
          ))}
        </div>

        {error ? <div className="auth-message auth-error">{error}</div> : null}
      </section>
    </div>
  );
}
