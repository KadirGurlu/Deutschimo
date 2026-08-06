"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  BadgeCheck,
  BarChart3,
  BookOpenText,
  BriefcaseBusiness,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Cloud,
  Compass,
  FileText,
  Filter,
  Headphones,
  History,
  Landmark,
  Loader2,
  MapPinned,
  MessageSquare,
  RefreshCcw,
  Search,
  Sparkles,
  Target,
  TrendingUp,
} from "lucide-react";

import { realGermanyCategories, realGermanyScenarios, realGermanyScenariosForLevel } from "@/data/real-germany";
import type {
  RealGermanyEvaluationResult,
  RealGermanyLevel,
  RealGermanyProgressSummary,
  RealGermanyScenario,
  RealGermanySkill,
  RealGermanyStepKind,
} from "@/types/real-germany";
import styles from "./real-germany-mode.module.css";

type StepState = Record<string, { response: string }>;
type SaveState = "idle" | "saving" | "saved" | "error";

const levelDescriptions: Record<RealGermanyLevel, string> = {
  A1: "İlk gün, temel kurumlar ve basit günlük ihtiyaçlar",
  A2: "Günlük işlemler, randevular ve kısa resmî iletişim",
  B1: "Bağlantılı e-postalar, sorun bildirimleri ve iş-akademi yazışmaları",
  B2: "Profesyonel ve resmî bağlamlarda ayrıntılı görev tamamlama",
};

const stepMeta: Record<RealGermanyStepKind, { label: string; Icon: typeof BookOpenText }> = {
  READ: { label: "Okuduğunu anlama", Icon: BookOpenText },
  LISTEN: { label: "Dinlediğini anlama", Icon: Headphones },
  FORM: { label: "Form doğruluğu", Icon: ClipboardList },
  WRITE: { label: "Yazılı iletişim", Icon: FileText },
  SPEAK: { label: "Yazılı iletişim", Icon: MessageSquare },
};

const skillLabels: Record<RealGermanySkill, string> = {
  READING: "Okuma",
  LISTENING: "Dinleme",
  FORM: "Form",
  WRITING: "Yazma",
};

const statusLabels = {
  NOT_STARTED: "Başlanmadı",
  IN_PROGRESS: "Devam ediyor",
  COMPLETED: "Tamamlandı",
} as const;

function buildState(scenario: RealGermanyScenario, responses?: Record<string, string>): StepState {
  return Object.fromEntries(
    scenario.steps.map((step) => [step.id, { response: responses?.[step.id] ?? "" }]),
  );
}

function responsePayload(state: StepState) {
  return Object.fromEntries(Object.entries(state).map(([key, value]) => [key, value.response.trim()]));
}

function scoreTone(score: number) {
  if (score >= 80) return styles.scoreStrong;
  if (score >= 60) return styles.scoreMedium;
  return styles.scoreNeedsWork;
}

function deltaLabel(delta: number) {
  if (delta > 0) return `+${delta}`;
  return String(delta);
}

export function RealGermanyMode({ initialLevel }: { initialLevel: RealGermanyLevel }) {
  const [level, setLevel] = useState<RealGermanyLevel>(initialLevel);
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [query, setQuery] = useState("");
  const [scenario, setScenario] = useState<RealGermanyScenario | null>(null);
  const [stepState, setStepState] = useState<StepState>({});
  const [progressMap, setProgressMap] = useState<Record<string, RealGermanyProgressSummary>>({});
  const [loadingProgress, setLoadingProgress] = useState(true);
  const [scenarioHydrated, setScenarioHydrated] = useState(false);
  const [draftDirty, setDraftDirty] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [evaluating, setEvaluating] = useState(false);
  const [result, setResult] = useState<RealGermanyEvaluationResult | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const startedAtRef = useRef(Date.now());

  const levelScenarios = useMemo(() => realGermanyScenariosForLevel(level), [level]);
  const categories = useMemo(() => realGermanyCategories(level), [level]);

  const filteredScenarios = useMemo(() => {
    const lowered = query.trim().toLocaleLowerCase("tr-TR");
    return levelScenarios.filter((item) => {
      const categoryOk = selectedCategory === "ALL" || item.category === selectedCategory;
      const searchSource = [item.title, item.summary, item.category, item.tags.join(" ")].join(" ").toLocaleLowerCase("tr-TR");
      return categoryOk && (!lowered || searchSource.includes(lowered));
    });
  }, [levelScenarios, query, selectedCategory]);

  const loadProgress = useCallback(async () => {
    try {
      const response = await fetch("/api/real-germany/progress", { cache: "no-store" });
      if (!response.ok) throw new Error("İlerleme yüklenemedi.");
      const payload = await response.json() as { progress?: RealGermanyProgressSummary[] };
      const next = Object.fromEntries((payload.progress ?? []).map((item) => [item.scenarioId, item]));
      setProgressMap(next);
    } catch {
      setMessage("Hesabındaki senaryo ilerlemesi yüklenemedi. Sayfayı yenileyip tekrar deneyebilirsin.");
    } finally {
      setLoadingProgress(false);
    }
  }, []);

  useEffect(() => {
    void loadProgress();
  }, [loadProgress]);

  useEffect(() => {
    setSelectedCategory("ALL");
    setScenario(null);
    setStepState({});
    setResult(null);
    setMessage(null);
    setScenarioHydrated(false);
    setDraftDirty(false);
  }, [level]);

  useEffect(() => {
    if (!scenario || !scenarioHydrated || !draftDirty) return;
    const timer = window.setTimeout(async () => {
      setSaveState("saving");
      const responses = responsePayload(stepState);
      const currentStep = Math.max(0, scenario.steps.reduce((latest, step, index) => responses[step.id] ? index : latest, 0));
      try {
        const response = await fetch("/api/real-germany/progress", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ scenarioId: scenario.id, level: scenario.level, responses, currentStep, action: "SAVE" }),
        });
        if (!response.ok) throw new Error("Taslak kaydedilemedi.");
        setSaveState("saved");
        setDraftDirty(false);
        setProgressMap((current) => {
          const previous = current[scenario.id];
          return {
            ...current,
            [scenario.id]: {
              scenarioId: scenario.id,
              level: scenario.level,
              status: "IN_PROGRESS",
              currentStep,
              draftResponses: responses,
              latestAttemptNumber: previous?.latestAttemptNumber ?? 0,
              latestOverallScore: previous?.latestOverallScore ?? null,
              bestOverallScore: previous?.bestOverallScore ?? 0,
              completedCount: previous?.completedCount ?? 0,
              startedAt: previous?.startedAt ?? new Date().toISOString(),
              lastAttemptAt: previous?.lastAttemptAt ?? null,
              completedAt: null,
              updatedAt: new Date().toISOString(),
              latestResult: previous?.latestResult ?? null,
            },
          };
        });
      } catch {
        setSaveState("error");
      }
    }, 850);
    return () => window.clearTimeout(timer);
  }, [draftDirty, scenario, scenarioHydrated, stepState]);

  const totalCount = realGermanyScenarios.length;
  const categoryCount = realGermanyCategories().length;
  const completedCount = Object.values(progressMap).filter((item) => item.status === "COMPLETED").length;
  const inProgressCount = Object.values(progressMap).filter((item) => item.status === "IN_PROGRESS").length;
  const completedSteps = scenario ? scenario.steps.filter((step) => Boolean(stepState[step.id]?.response.trim())).length : 0;
  const progress = scenario ? Math.round((completedSteps / scenario.steps.length) * 100) : 0;

  function selectScenario(next: RealGermanyScenario) {
    const saved = progressMap[next.id];
    setScenario(next);
    setStepState(buildState(next, saved?.draftResponses));
    setResult(saved?.latestResult ?? null);
    setMessage(null);
    setSaveState(saved ? "saved" : "idle");
    setScenarioHydrated(true);
    setDraftDirty(false);
    startedAtRef.current = Date.now();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function updateResponse(stepId: string, value: string) {
    setStepState((current) => ({ ...current, [stepId]: { response: value.slice(0, 4_000) } }));
    setDraftDirty(true);
    setResult(null);
    setMessage(null);
  }

  async function retryScenario() {
    if (!scenario) return;
    setSaveState("saving");
    try {
      const response = await fetch("/api/real-germany/progress", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scenarioId: scenario.id, level: scenario.level, responses: {}, currentStep: 0, action: "RETRY" }),
      });
      if (!response.ok) throw new Error("Tekrar başlatılamadı.");
      setStepState(buildState(scenario));
      setDraftDirty(false);
      setResult(null);
      setMessage("Yeni deneme başlatıldı. Önceki sonuçların hesabında korunuyor.");
      setSaveState("saved");
      startedAtRef.current = Date.now();
      await loadProgress();
    } catch {
      setSaveState("error");
      setMessage("Senaryo yeniden başlatılamadı. Lütfen tekrar dene.");
    }
  }

  async function evaluateScenario() {
    if (!scenario) return;
    const responses = responsePayload(stepState);
    const missing = scenario.steps.filter((step) => !responses[step.id]);
    if (missing.length) {
      setMessage(`Değerlendirme için ${missing.length} adımı daha cevaplamalısın.`);
      return;
    }

    setEvaluating(true);
    setMessage(null);
    try {
      const response = await fetch("/api/real-germany/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scenarioId: scenario.id,
          level: scenario.level,
          responses,
          durationSeconds: Math.max(1, Math.round((Date.now() - startedAtRef.current) / 1_000)),
        }),
      });
      const payload = await response.json() as { result?: RealGermanyEvaluationResult; error?: string };
      if (!response.ok || !payload.result) throw new Error(payload.error || "Değerlendirme tamamlanamadı.");
      setResult(payload.result);
      setSaveState("saved");
      setMessage("Sonucun hesabına kaydedildi ve gelişim alanların Akıllı Tekrar sistemine aktarıldı.");
      await loadProgress();
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Değerlendirme tamamlanamadı.");
    } finally {
      setEvaluating(false);
    }
  }

  if (!scenario) {
    return (
      <section className={styles.page}>
        <header className={styles.hero}>
          <div>
            <span className={styles.eyebrow}>V30.2 · GERÇEK ALMANYA MODU 2.0</span>
            <h1>Gerçek görevleri tamamla, puanlarını ve gelişimini hesabında koru.</h1>
            <p>
              Her senaryoda okuma, dinleme, form ve yazılı iletişim ayrı değerlendirilir. Sonuçların
              cihazlar arasında senkronize edilir ve zayıf alanların Akıllı Tekrar’a gönderilir.
            </p>
          </div>
          <div className={styles.heroPanel}>
            <div><strong>{totalCount} senaryo</strong><span>A1’den B2’ye gerçek yaşam görevleri</span></div>
            <div><strong>{completedCount} tamamlandı</strong><span>Hesabına kaydedilen görevler</span></div>
            <div><strong>{inProgressCount} devam ediyor</strong><span>Başka cihazdan sürdürülebilir</span></div>
          </div>
        </header>

        {message ? <div className={styles.messageBox}><AlertCircle size={17} /> {message}</div> : null}

        <section className={styles.levelSection}>
          <div className={styles.sectionHeading}>
            <div><span>SEVİYE SEÇ</span><h2>Hangi aşamayı çalışmak istiyorsun?</h2></div>
            <Compass size={22} />
          </div>
          <div className={styles.levelGrid}>
            {(["A1", "A2", "B1", "B2"] as RealGermanyLevel[]).map((item) => (
              <button key={item} type="button" className={`${styles.levelCard} ${item === level ? styles.levelCardActive : ""}`} onClick={() => setLevel(item)}>
                <span>{item}</span>
                <strong>{levelDescriptions[item]}</strong>
                <small>{realGermanyScenariosForLevel(item).length} görev</small>
              </button>
            ))}
          </div>
        </section>

        <div className={styles.layoutGrid}>
          <section>
            <div className={styles.toolbar}>
              <label className={styles.searchBox}>
                <Search size={18} />
                <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Senaryo, kategori veya etiket ara" />
              </label>
              <div className={styles.categoryBar}>
                <button type="button" className={`${styles.categoryChip} ${selectedCategory === "ALL" ? styles.categoryChipActive : ""}`} onClick={() => setSelectedCategory("ALL")}>
                  <Filter size={16} /> Tümü
                </button>
                {categories.map((item) => (
                  <button key={item} type="button" className={`${styles.categoryChip} ${selectedCategory === item ? styles.categoryChipActive : ""}`} onClick={() => setSelectedCategory(item)}>{item}</button>
                ))}
              </div>
            </div>

            <div className={styles.sectionHeading}>
              <div><span>SENARYOLAR</span><h2>{level} seviyesi için gerçek Almanya görevleri</h2></div>
              {loadingProgress ? <Loader2 size={22} className={styles.spin} /> : <BadgeCheck size={22} />}
            </div>

            <div className={styles.scenarioGrid}>
              {filteredScenarios.map((item) => {
                const saved = progressMap[item.id];
                const status = saved?.status ?? "NOT_STARTED";
                return (
                  <button key={item.id} type="button" className={styles.scenarioCard} onClick={() => selectScenario(item)}>
                    <div className={styles.scenarioTop}>
                      <span>{item.category}</span>
                      <span className={`${styles.statusBadge} ${styles[`status${status}`]}`}>{statusLabels[status]}</span>
                    </div>
                    <h3>{item.title}</h3>
                    <p>{item.summary}</p>
                    {saved?.latestOverallScore != null ? (
                      <div className={styles.latestScore}><BarChart3 size={16} /> Son puan: <strong>%{saved.latestOverallScore}</strong> · En iyi: %{saved.bestOverallScore}</div>
                    ) : null}
                    <div className={styles.scenarioMeta}>
                      <span><MapPinned size={15} /> {item.city}</span>
                      <span>{item.estimatedMinutes} dk</span>
                      <ChevronRight size={18} />
                    </div>
                  </button>
                );
              })}
            </div>
            {filteredScenarios.length === 0 ? <div className={styles.emptyState}>Bu filtreyle eşleşen senaryo bulunamadı.</div> : null}
          </section>

          <aside className={styles.sidePanel}>
            <div className={styles.panelTitle}><Cloud size={20} /><div><strong>Hesap senkronizasyonu</strong><span>Taslaklar ve sonuçlar veritabanında saklanır</span></div></div>
            <ul className={styles.checkList}>
              <li>Bilgisayarda başladığın senaryoya başka cihazda devam edebilirsin.</li>
              <li>İlk ve sonraki denemelerin ayrı ayrı korunur.</li>
              <li>Tamamlanan görevler puanlarıyla birlikte görünür.</li>
            </ul>

            <div className={styles.panelTitle}><Sparkles size={20} /><div><strong>Öğrenme döngüsü</strong><span>Dört beceri tek görevde ölçülür</span></div></div>
            <div className={styles.flowCard}>
              <ol>
                <li>E-postayı veya duyuruyu anla</li>
                <li>Sesli mesajın bilgilerini çıkar</li>
                <li>Formu eksiksiz doldur</li>
                <li>Amaca uygun Almanca cevap yaz</li>
                <li>Sonucu gör ve hatalarını tekrar et</li>
              </ol>
            </div>

            <div className={styles.panelTitle}><Landmark size={20} /><div><strong>Kategoriler</strong><span>Gerçek Almanya bağlamları</span></div></div>
            <div className={styles.tagCloud}>{realGermanyCategories().map((item) => <span key={item} className={styles.tag}>{item}</span>)}</div>
          </aside>
        </div>
      </section>
    );
  }

  return (
    <section className={styles.page}>
      <div className={styles.taskHeader}>
        <div>
          <button type="button" className={styles.backButton} onClick={() => { setScenario(null); setResult(null); }}><ArrowLeft size={16} /> Tüm senaryolara dön</button>
          <span className={styles.eyebrow}>{scenario.level} · {scenario.category}</span>
          <h1>{scenario.title}</h1>
          <p>{scenario.summary}</p>
          <div className={styles.syncLine}>
            {saveState === "saving" ? <><Loader2 size={15} className={styles.spin} /> Hesabına kaydediliyor…</>
              : saveState === "saved" ? <><Cloud size={15} /> Hesabına kaydedildi</>
                : saveState === "error" ? <><AlertCircle size={15} /> Kaydetme başarısız</>
                  : <><Cloud size={15} /> Cihazlar arası senkronizasyon hazır</>}
          </div>
        </div>
        <div className={styles.taskSummary}>
          <div><strong>{scenario.city}</strong><span>Şehir bağlamı</span></div>
          <div><strong>{scenario.estimatedMinutes} dk</strong><span>Tahmini süre</span></div>
          <div><strong>{scenario.difficulty}</strong><span>Zorluk</span></div>
        </div>
      </div>

      <div className={styles.progressShell}>
        <div className={styles.progressHeader}>
          <div><span>GÖREV İLERLEMESİ</span><strong>{completedSteps} / {scenario.steps.length} yanıt tamamlandı</strong></div>
          <Target size={18} />
        </div>
        <div className={styles.progressTrack}><div className={styles.progressBar} style={{ width: `${progress}%` }} /></div>
      </div>

      {result ? <ResultPanel result={result} onRetry={() => void retryScenario()} /> : null}

      <div className={styles.layoutGrid}>
        <section>
          <div className={styles.goalCard}>
            <div className={styles.panelTitle}><BriefcaseBusiness size={20} /><div><strong>Görev amacı</strong><span>{scenario.goal}</span></div></div>
          </div>

          <div className={styles.stepList}>
            {scenario.steps.map((step, index) => {
              const meta = stepMeta[step.kind];
              const current = stepState[step.id] ?? { response: "" };
              return (
                <article key={step.id} className={styles.stepCard}>
                  <div className={styles.stepHeader}>
                    <div className={styles.stepIndex}>{index + 1}</div>
                    <div><span>{meta.label}</span><h3>{step.title}</h3></div>
                    <meta.Icon size={20} className={styles.stepIcon} />
                  </div>
                  <p className={styles.stepInstruction}>{step.instruction}</p>
                  <div className={styles.promptBox}>{step.prompt}</div>
                  <label className={styles.answerLabel}>{step.helper ? `Görev sorusu: ${step.helper}` : "Cevabını yaz"}</label>
                  <textarea
                    value={current.response}
                    onChange={(event) => updateResponse(step.id, event.target.value)}
                    placeholder={step.placeholder ?? (step.kind === "READ" || step.kind === "LISTEN" ? "Anladığın temel bilgiyi Almanca veya Türkçe kısa şekilde yaz." : "Cevabını buraya yaz.")}
                    className={styles.textarea}
                    rows={step.kind === "FORM" ? 3 : 5}
                  />
                  {current.response.trim() ? <div className={styles.inlineSuccess}><CheckCircle2 size={15} /> Yanıt otomatik kaydediliyor</div> : null}
                </article>
              );
            })}
          </div>

          {message ? <div className={styles.messageBox}><AlertCircle size={17} /> {message}</div> : null}

          <div className={styles.actionRow}>
            <button type="button" className={styles.secondaryButton} onClick={() => void retryScenario()} disabled={evaluating}><RefreshCcw size={16} /> Bu senaryoyu tekrar çalış</button>
            <button type="button" className={styles.primaryButton} onClick={() => void evaluateScenario()} disabled={evaluating}>
              {evaluating ? <><Loader2 size={17} className={styles.spin} /> Değerlendiriliyor…</> : <><BarChart3 size={17} /> Görevi değerlendir</>}
            </button>
          </div>
        </section>

        <aside className={styles.sidePanel}>
          <div className={styles.panelTitle}><CheckCircle2 size={20} /><div><strong>Başarı kontrol listesi</strong><span>Değerlendirme bu hedeflere göre yapılır</span></div></div>
          <ul className={styles.checkList}>{scenario.successChecklist.map((item) => <li key={item}>{item}</li>)}</ul>

          <div className={styles.panelTitle}><BookOpenText size={20} /><div><strong>Ana kelimeler</strong><span>Görev içindeki kritik kelime havuzu</span></div></div>
          <div className={styles.tagCloud}>{scenario.vocabulary.map((item) => <span key={item} className={styles.tag}>{item}</span>)}</div>

          <div className={styles.panelTitle}><MessageSquare size={20} /><div><strong>Destek ifadeleri</strong><span>Kopyalamak yerine kendi cümlende kullan</span></div></div>
          <ul className={styles.phraseList}>{scenario.supportPhrases.map((item) => <li key={item}>{item}</li>)}</ul>
        </aside>
      </div>
    </section>
  );
}

function ResultPanel({ result, onRetry }: { result: RealGermanyEvaluationResult; onRetry: () => void }) {
  const scoreItems: Array<[RealGermanySkill, number]> = [
    ["READING", result.readingScore],
    ["LISTENING", result.listeningScore],
    ["FORM", result.formScore],
    ["WRITING", result.writingScore],
  ];
  const hasPrevious = result.comparison.previousOverallScore != null;

  return (
    <section className={styles.resultPanel}>
      <div className={styles.resultHero}>
        <div>
          <span>GÖREV SONUCU · {result.attemptNumber}. DENEME</span>
          <strong className={scoreTone(result.overallScore)}>%{result.overallScore}</strong>
          <p>Genel başarı</p>
        </div>
        <div className={styles.resultMeta}>
          <span><CheckCircle2 size={16} /> Sonuç hesabına kaydedildi</span>
          <span><History size={16} /> İlk ve sonraki denemeler korunuyor</span>
          <span><Sparkles size={16} /> {result.smartReviewQueued} konu Akıllı Tekrar’a gönderildi</span>
          {result.evaluationMode === "HEURISTIC_FALLBACK" ? <span className={styles.fallbackNote}><AlertCircle size={16} /> AI erişilemediği için güvenli ön değerlendirme kullanıldı</span> : null}
        </div>
      </div>

      <div className={styles.scoreGrid}>
        {scoreItems.map(([skill, score]) => {
          const delta = skill === "READING" ? result.comparison.readingDelta
            : skill === "LISTENING" ? result.comparison.listeningDelta
              : skill === "FORM" ? result.comparison.formDelta
                : result.comparison.writingDelta;
          return (
            <div key={skill} className={styles.scoreCard}>
              <span>{skillLabels[skill]}</span>
              <strong className={scoreTone(score)}>%{score}</strong>
              {hasPrevious ? <small className={delta >= 0 ? styles.deltaPositive : styles.deltaNegative}><TrendingUp size={14} /> {deltaLabel(delta)} puan</small> : <small>İlk ölçüm</small>}
            </div>
          );
        })}
      </div>

      {hasPrevious ? (
        <div className={styles.comparisonStrip}>
          <History size={18} /> Önceki genel puan: %{result.comparison.previousOverallScore} → Yeni puan: %{result.overallScore}
          <strong className={result.comparison.overallDelta >= 0 ? styles.deltaPositive : styles.deltaNegative}>{deltaLabel(result.comparison.overallDelta)} puan</strong>
        </div>
      ) : null}

      <div className={styles.resultColumns}>
        <div>
          <h3>Güçlü yönlerin</h3>
          <ul className={styles.checkList}>{result.strengths.map((item) => <li key={item}>{item}</li>)}</ul>
        </div>
        <div>
          <h3>Tekrar edilmesi gerekenler</h3>
          {result.weakAreas.length ? (
            <div className={styles.weakAreaList}>
              {result.weakAreas.map((area) => (
                <article key={`${area.code}-${area.skill}`}>
                  <div><span>{skillLabels[area.skill]}</span><strong>{area.label}</strong></div>
                  <p>{area.explanation}</p>
                  <small>{area.nextReviewDays} gün içinde tekrar</small>
                </article>
              ))}
            </div>
          ) : <p className={styles.successText}>Öncelikli hata bulunmadı. Daha zor bir senaryoya geçebilirsin.</p>}
        </div>
      </div>

      <div className={styles.resultFooter}>
        <p><strong>Sonraki adım:</strong> {result.nextStep}</p>
        <button type="button" className={styles.secondaryButton} onClick={onRetry}><RefreshCcw size={16} /> Bu senaryoyu tekrar çalış</button>
      </div>
    </section>
  );
}
