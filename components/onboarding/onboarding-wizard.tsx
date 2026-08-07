"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { ArrowLeft, ArrowRight, BookOpen, BrainCircuit, BriefcaseBusiness, CalendarDays, Check, CheckCircle2, Clock3, GraduationCap, Headphones, MapPin, MessageCircle, PenLine, Sparkles, Target } from "lucide-react";
import { focusSkillLabels, learningGoalLabels, levelChoiceLabels } from "@/lib/onboarding/plan";
import type { LearningGoal, OnboardingFocusSkill, OnboardingLevelChoice, OnboardingPlan, OnboardingSnapshot } from "@/types/onboarding";
import styles from "./onboarding-wizard.module.css";

const levelChoices: OnboardingLevelChoice[] = ["BEGINNER", "SOME", "A1", "A2", "B1", "B2", "UNSURE"];
const goals: Array<{ id: LearningGoal; icon: typeof Target; note: string }> = [
  { id: "GERMANY_LIFE", icon: MapPin, note: "Günlük yaşam, resmi işlemler ve iletişim" },
  { id: "UNIVERSITY", icon: GraduationCap, note: "Akademik Almanca ve üniversite hayatı" },
  { id: "WORK", icon: BriefcaseBusiness, note: "İş hayatı ve profesyonel iletişim" },
  { id: "DAILY_GERMAN", icon: MessageCircle, note: "Günlük konuşmalar ve pratik kullanım" },
  { id: "TESTDAF", icon: Target, note: "TestDaF hedefli çalışma" },
  { id: "TELC", icon: Target, note: "TELC hedefli çalışma" },
  { id: "GOETHE", icon: Target, note: "Goethe sınavlarına hazırlık" },
  { id: "IMPROVE", icon: Sparkles, note: "Genel Almanca seviyemi yükseltmek" },
];
const skillIcons: Record<OnboardingFocusSkill, typeof BookOpen> = {
  VOCABULARY: BookOpen,
  GRAMMAR: BrainCircuit,
  READING: BookOpen,
  LISTENING: Headphones,
  WRITING: PenLine,
  SPEAKING: MessageCircle,
};
const skillOrder: OnboardingFocusSkill[] = ["VOCABULARY", "GRAMMAR", "READING", "LISTENING", "WRITING", "SPEAKING"];
const dailyOptions = [10, 20, 30, 45, 60];
const dayOptions = [3, 4, 5, 6, 7];

type FormState = {
  levelChoice?: OnboardingLevelChoice;
  learningGoal?: LearningGoal;
  dailyMinutes?: number;
  studyDaysPerWeek?: number;
  focusSkills: OnboardingFocusSkill[];
};

export function OnboardingWizard({ firstName }: { firstName: string }) {
  const router = useRouter();
  const { update } = useSession();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState(1);
  const [snapshot, setSnapshot] = useState<OnboardingSnapshot | null>(null);
  const [form, setForm] = useState<FormState>({ focusSkills: [] });
  const [plan, setPlan] = useState<OnboardingPlan | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetch("/api/onboarding", { cache: "no-store" })
      .then(async (response) => {
        const payload = await response.json() as OnboardingSnapshot & { error?: string };
        if (!response.ok) throw new Error(payload.error ?? "Onboarding bilgileri yüklenemedi.");
        return payload;
      })
      .then((payload) => {
        if (cancelled) return;
        setSnapshot(payload);
        const restored: FormState = {
          levelChoice: payload.profile?.levelChoice,
          learningGoal: payload.profile?.learningGoal,
          dailyMinutes: payload.profile?.dailyMinutes,
          studyDaysPerWeek: payload.profile?.studyDaysPerWeek,
          focusSkills: payload.profile?.focusSkills ?? [],
        };
        setForm(restored);
        const levelReady = Boolean(restored.levelChoice && (restored.levelChoice !== "UNSURE" || payload.latestPlacement));
        const nextStep = !levelReady ? 1 : !restored.learningGoal ? 2 : !restored.dailyMinutes ? 3 : !restored.studyDaysPerWeek ? 4 : !restored.focusSkills.length ? 5 : 5;
        setStep(nextStep);
      })
      .catch((reason: Error) => setError(reason.message))
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const stepTitle = useMemo(() => ["", "Almanca seviyen nedir?", "Almanca öğrenme amacın nedir?", "Günde ne kadar çalışabilirsin?", "Haftada kaç gün?", "Hangi becerilerini geliştirmek istiyorsun?"][step], [step]);
  const levelNeedsTest = form.levelChoice === "UNSURE" && !snapshot?.latestPlacement;
  const canContinue = step === 1 ? Boolean(form.levelChoice && !levelNeedsTest)
    : step === 2 ? Boolean(form.learningGoal)
    : step === 3 ? Boolean(form.dailyMinutes)
    : step === 4 ? Boolean(form.studyDaysPerWeek)
    : form.focusSkills.length > 0;

  async function saveDraft(nextStep?: number) {
    setSaving(true); setError("");
    try {
      const response = await fetch("/api/onboarding", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "draft", ...form }) });
      const payload = await response.json() as { error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Seçimlerin kaydedilemedi.");
      if (nextStep) setStep(nextStep);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Seçimlerin kaydedilemedi."); }
    finally { setSaving(false); }
  }
  async function goToPlacement() {
    setSaving(true); setError("");
    try {
      await fetch("/api/onboarding", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "draft", ...form, levelChoice: "UNSURE" }) });
      router.push("/placement-test?onboarding=1");
    } finally { setSaving(false); }
  }
  async function complete() {
    setSaving(true); setError("");
    try {
      const response = await fetch("/api/onboarding", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "complete", ...form }) });
      const payload = await response.json() as { plan?: OnboardingPlan; error?: string; code?: string };
      if (!response.ok || !payload.plan) {
        if (payload.code === "PLACEMENT_REQUIRED") { setStep(1); throw new Error(payload.error ?? "Önce seviye testini tamamla."); }
        throw new Error(payload.error ?? "Kişisel plan oluşturulamadı.");
      }
      setPlan(payload.plan);
      await update({});
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Kişisel plan oluşturulamadı."); }
    finally { setSaving(false); }
  }
  function toggleSkill(skill: OnboardingFocusSkill) {
    setForm((current) => ({ ...current, focusSkills: current.focusSkills.includes(skill) ? current.focusSkills.filter((item) => item !== skill) : [...current.focusSkills, skill] }));
  }

  if (loading) return <div className={styles.page}><section className={styles.loading}><Sparkles className="spin-soft"/><strong>Kişisel öğrenme alanın hazırlanıyor...</strong></section></div>;
  if (plan) return (
    <div className={styles.page}>
      <section className={styles.resultCard} data-testid="onboarding-plan">
        <div className={styles.resultIcon}><CheckCircle2 /></div>
        <span className={styles.eyebrow}>DEUTSCHIMO V32 · KİŞİSEL PLAN</span>
        <h1>Kişisel planın hazır, {firstName}.</h1>
        <p>Başlangıç seviyeni, hedefini ve ayırabildiğin zamanı tek bir çalışma ritminde birleştirdik.</p>
        <div className={styles.resultGrid}>
          <article><small>Başlangıç seviyesi</small><strong>{plan.level}</strong><span>{plan.source === "PLACEMENT_TEST" ? "Seviye testine göre" : "Seçimine göre"}</span></article>
          <article><small>Haftalık ritim</small><strong>{plan.studyDaysPerWeek} gün × {plan.dailyMinutes} dk</strong><span>Toplam {plan.weeklyMinutes} dakika</span></article>
          <article><small>Tahmini kurs süresi</small><strong>{plan.estimatedCompletionWeeks} hafta</strong><span>{plan.level} kurs planı için tahmini süre</span></article>
          <article><small>Önceliklerin</small><strong>{plan.priorityText}</strong><span>{plan.goalLabel}</span></article>
        </div>
        <div className={styles.resultNote}><Target size={19}/><span>Bu süre bir garanti değil; Deutschimo ilerlemene göre planını sonraki sürümlerde dinamik olarak güncelleyecek.</span></div>
        <div className={styles.resultActions}>
          <Link className="button button-secondary" href={plan.suggestedCourseHref}>Önerilen kursu gör</Link>
          <button className="button button-primary" onClick={() => { router.replace("/dashboard"); router.refresh(); }}>Öğrenci paneline geç <ArrowRight size={18}/></button>
        </div>
      </section>
    </div>
  );

  return (
    <div className={styles.page}>
      <section className={styles.shell}>
        <aside className={styles.side}>
          <span className={styles.eyebrow}>DEUTSCHIMO V32.0</span>
          <h1>Öğrenme yolunu sana göre kuralım.</h1>
          <p>Beş kısa seçimle seviyeni, hedefini ve çalışma ritmini belirle. Sonunda kişisel başlangıç planını oluşturacağız.</p>
          <div className={styles.sideProgress}>
            {[1,2,3,4,5].map((item) => <span key={item} className={item <= step ? styles.progressActive : ""}><i>{item < step ? <Check size={14}/> : item}</i><b>{["Seviye","Amaç","Süre","Gün","Beceri"][item-1]}</b></span>)}
          </div>
          <div className={styles.privacyNote}>Seçimlerin yalnızca öğrenme deneyimini kişiselleştirmek için hesabına kaydedilir.</div>
        </aside>
        <main className={styles.card}>
          <div className={styles.header}><div><small>ADIM {step} / 5</small><h2>{stepTitle}</h2></div><span>%{step * 20}</span></div>
          <div className={styles.progressBar}><i style={{ width: `${step * 20}%` }} /></div>

          {step === 1 ? <div className={styles.optionsGrid}>
            {levelChoices.map((choice) => <button data-testid={`level-${choice}`} type="button" key={choice} onClick={() => setForm({ ...form, levelChoice: choice })} className={`${styles.option} ${form.levelChoice === choice ? styles.selected : ""}`}><span><strong>{levelChoiceLabels[choice]}</strong>{choice === "BEGINNER" ? <small>Almancaya sıfırdan başlayacağım.</small> : choice === "SOME" ? <small>Temel kelimeler ve birkaç kalıp biliyorum.</small> : choice === "UNSURE" ? <small>Mevcut seviye testimizle belirleyelim.</small> : <small>Bu seviyede olduğumu düşünüyorum.</small>}</span>{form.levelChoice === choice ? <CheckCircle2/> : null}</button>)}
            {form.levelChoice === "UNSURE" ? <div className={styles.testBridge}><BrainCircuit/><div><strong>{snapshot?.latestPlacement ? `Son test sonucun: ${snapshot.latestPlacement.overallBand ?? snapshot.latestPlacement.recommendedLevel}` : "Seviyeni birlikte ölçebiliriz."}</strong><p>{snapshot?.latestPlacement ? "Bu sonucu kişisel planında başlangıç seviyesi olarak kullanacağız." : "Hızlı veya ayrıntılı seviye testini tamamla; sonra buraya dönüp planına devam et."}</p></div>{snapshot?.latestPlacement ? null : <button className="button button-secondary" onClick={goToPlacement} disabled={saving}>Seviye testine git</button>}</div> : null}
          </div> : null}

          {step === 2 ? <div className={styles.goalGrid}>{goals.map(({id,icon:Icon,note}) => <button data-testid={`goal-${id}`} key={id} type="button" className={`${styles.goalCard} ${form.learningGoal === id ? styles.selected : ""}`} onClick={() => setForm({ ...form, learningGoal: id })}><Icon/><span><strong>{learningGoalLabels[id]}</strong><small>{note}</small></span>{form.learningGoal === id ? <CheckCircle2/> : null}</button>)}</div> : null}

          {step === 3 ? <div className={styles.timeGrid}>{dailyOptions.map((minutes) => <button data-testid={`daily-${minutes}`} key={minutes} type="button" className={`${styles.timeCard} ${form.dailyMinutes === minutes ? styles.selected : ""}`} onClick={() => setForm({ ...form, dailyMinutes: minutes })}><Clock3/><strong>{minutes} dakika{minutes === 60 ? "+" : ""}</strong><small>{minutes <= 20 ? "Kısa ve sürdürülebilir" : minutes <= 45 ? "Dengeli çalışma" : "Yoğun çalışma"}</small></button>)}</div> : null}

          {step === 4 ? <div className={styles.timeGrid}>{dayOptions.map((days) => <button data-testid={`days-${days}`} key={days} type="button" className={`${styles.timeCard} ${form.studyDaysPerWeek === days ? styles.selected : ""}`} onClick={() => setForm({ ...form, studyDaysPerWeek: days })}><CalendarDays/><strong>{days === 7 ? "Her gün" : `${days} gün`}</strong><small>{days <= 4 ? "Esnek tempo" : days <= 6 ? "Düzenli tempo" : "Günlük alışkanlık"}</small></button>)}</div> : null}

          {step === 5 ? <><p className={styles.skillIntro}>Bir veya daha fazla alan seçebilirsin. Planın bu becerilere daha fazla ağırlık verecek.</p><div className={styles.skillGrid}>{skillOrder.map((skill) => { const Icon=skillIcons[skill]; const selected=form.focusSkills.includes(skill); return <button data-testid={`skill-${skill}`} key={skill} type="button" className={`${styles.skillCard} ${selected ? styles.selected : ""}`} onClick={() => toggleSkill(skill)}><Icon/><strong>{focusSkillLabels[skill]}</strong>{selected ? <CheckCircle2/> : null}</button>; })}</div></> : null}

          {error ? <div className={styles.error}>{error}</div> : null}
          <div className={styles.actions}>
            {step > 1 ? <button type="button" className="button button-secondary" onClick={() => setStep((value) => value - 1)} disabled={saving}><ArrowLeft size={18}/> Geri</button> : <span/>}
            {step < 5 ? <button data-testid="onboarding-next" type="button" className="button button-primary" onClick={() => saveDraft(step + 1)} disabled={!canContinue || saving}>{saving ? "Kaydediliyor..." : "Devam Et"}<ArrowRight size={18}/></button> : <button data-testid="onboarding-complete" type="button" className="button button-primary" onClick={complete} disabled={!canContinue || saving}>{saving ? "Plan oluşturuluyor..." : "Kişisel Planımı Oluştur"}<Sparkles size={18}/></button>}
          </div>
        </main>
      </section>
    </div>
  );
}
