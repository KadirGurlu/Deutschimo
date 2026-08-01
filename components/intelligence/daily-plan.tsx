"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { BookOpenCheck, CalendarCheck2, Check, Clock3, RefreshCw, Sparkles } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import type { DailyStudyPlan } from "@/types/intelligence";

function localDate() {
  const date = new Date();
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
}

const typeLabel: Record<string,string> = { LESSON:"Ders", REVIEW:"Tekrar", QUIZ:"Quiz", VOCABULARY:"Kelime", WRITING:"Yazma", PLACEMENT:"Seviye testi", SKILL:"Beceri" };

export function DailyPlan() {
  const [plan, setPlan] = useState<DailyStudyPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const date = useMemo(localDate, []);

  async function load(refresh = false) {
    setLoading(true); setError("");
    try {
      const response = await fetch(`/api/intelligence/daily-plan?date=${date}${refresh ? "&refresh=1" : ""}`, { cache: "no-store" });
      const payload = await response.json() as { plan?: DailyStudyPlan; error?: string };
      if (!response.ok || !payload.plan) throw new Error(payload.error ?? "Günlük plan getirilemedi.");
      setPlan(payload.plan);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Günlük plan getirilemedi."); }
    finally { setLoading(false); }
  }
  useEffect(()=>{ void load(); },[]);

  async function toggle(taskId: string, completed: boolean) {
    if (!plan) return;
    const optimisticTasks = plan.tasks.map((task)=>task.id===taskId?{...task,completed}:task);
    setPlan({...plan,tasks:optimisticTasks,completedMinutes:optimisticTasks.filter((task)=>task.completed).reduce((sum,task)=>sum+task.minutes,0)});
    const response = await fetch("/api/intelligence/daily-plan", { method:"PATCH", headers:{"Content-Type":"application/json"}, body:JSON.stringify({planDate:plan.planDate,taskId,completed}) });
    const payload = await response.json() as { plan?: DailyStudyPlan; error?: string };
    if (!response.ok || !payload.plan) { setError(payload.error ?? "Plan güncellenemedi."); await load(); return; }
    setPlan(payload.plan);
  }

  if (loading) return <section className="panel intelligence-loading"><CalendarCheck2 className="spin-soft"/><h2>Bugünkü planın hazırlanıyor</h2><p>Hedefin, kaldığın ders ve zayıf konu analizin birleştiriliyor.</p></section>;
  if (error && !plan) return <section className="panel"><div className="auth-message auth-error">{error}</div><button className="button button-secondary" onClick={()=>load()}><RefreshCw size={17}/>Tekrar Dene</button></section>;
  if (!plan) return null;
  const percent = plan.plannedMinutes ? Math.round((plan.completedMinutes/plan.plannedMinutes)*100) : 0;

  return <div className="intelligence-stack"><section className="daily-plan-hero"><div><span className="eyebrow">GÜNLÜK KİŞİSEL PLAN</span><h1>Bugünkü {plan.goalMinutes} dakikanı en verimli şekilde kullan.</h1><p>Plan, ilerleme verilerine göre otomatik oluşturuldu. Görevleri kendi sırana göre tamamlayabilirsin.</p></div><div className="daily-plan-score"><CalendarCheck2/><strong>%{percent}</strong><span>{plan.completedMinutes}/{plan.plannedMinutes} dakika</span></div></section><section className="panel"><div className="section-head"><div><h2>Bugünün görevleri</h2><p className="section-copy">{new Date(`${plan.planDate}T12:00:00`).toLocaleDateString("tr-TR",{weekday:"long",day:"numeric",month:"long"})}</p></div><button className="button button-secondary" onClick={()=>load(true)}><RefreshCw size={17}/>Planı Yenile</button></div><Progress value={percent} label={`Tamamlanma · %${percent}`}/><div className="plan-task-list">{plan.tasks.map((task,index)=><article className={task.completed?"plan-task completed":"plan-task"} key={task.id}><button className="plan-check" onClick={()=>toggle(task.id,!task.completed)} aria-label={task.completed?"Tamamlanmadı olarak işaretle":"Tamamlandı olarak işaretle"}>{task.completed?<Check/>:<span>{index+1}</span>}</button><div className="plan-task-body"><div className="plan-task-meta"><span className="level-badge">{typeLabel[task.type]}</span><span className={`priority priority-${task.priority.toLowerCase()}`}>{task.priority === "HIGH" ? "Yüksek öncelik" : task.priority === "MEDIUM" ? "Orta öncelik" : "İsteğe bağlı"}</span></div><h3>{task.title}</h3><p>{task.description}</p><span className="task-time"><Clock3 size={16}/>{task.minutes} dakika</span></div><Link className="button button-secondary" href={task.href}>{task.completed?<BookOpenCheck size={17}/>:<Sparkles size={17}/>}Aç</Link></article>)}</div>{error?<div className="auth-message auth-error">{error}</div>:null}</section></div>;
}
