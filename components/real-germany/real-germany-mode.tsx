"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  AudioLines,
  BadgeCheck,
  BookOpenText,
  BriefcaseBusiness,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Compass,
  FileText,
  Filter,
  Headphones,
  Landmark,
  MapPinned,
  MessageSquare,
  Search,
  Sparkles,
  Target,
} from "lucide-react";

import { realGermanyCategories, realGermanyScenarios, realGermanyScenariosForLevel } from "@/data/real-germany";
import type { RealGermanyLevel, RealGermanyScenario, RealGermanyStep, RealGermanyStepKind } from "@/types/real-germany";
import styles from "./real-germany-mode.module.css";

type StepState = Record<string, { response: string; completed: boolean }>;

const levelDescriptions: Record<RealGermanyLevel, string> = {
  A1: "İlk gün, temel kurumlar ve basit günlük ihtiyaçlar",
  A2: "Günlük işlemler, randevular ve kısa resmî iletişim",
  B1: "Bağlantılı e-postalar, sorun bildirimleri ve iş-akademi yazışmaları",
  B2: "Profesyonel ve resmî bağlamlarda ayrıntılı görev tamamlama",
};

const stepMeta: Record<RealGermanyStepKind, { label: string; Icon: typeof BookOpenText }> = {
  READ: { label: "Oku", Icon: BookOpenText },
  LISTEN: { label: "Dinle", Icon: Headphones },
  FORM: { label: "Formu doldur", Icon: ClipboardList },
  WRITE: { label: "Yaz", Icon: FileText },
  SPEAK: { label: "Konuşma taslağı", Icon: MessageSquare },
};

function scenarioStorageKey(id: string) {
  return `deutschimo-real-germany-${id}`;
}

function isResponseStep(step: RealGermanyStep) {
  return step.requiredResponse || step.kind === "FORM" || step.kind === "WRITE" || step.kind === "SPEAK";
}

function buildInitialState(scenario: RealGermanyScenario): StepState {
  return Object.fromEntries(
    scenario.steps.map((step) => [step.id, { response: "", completed: false }]),
  );
}

export function RealGermanyMode({ initialLevel }: { initialLevel: RealGermanyLevel }) {
  const [level, setLevel] = useState<RealGermanyLevel>(initialLevel);
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [query, setQuery] = useState("");
  const [scenario, setScenario] = useState<RealGermanyScenario | null>(null);
  const [stepState, setStepState] = useState<StepState>({});
  const [message, setMessage] = useState<string | null>(null);

  const levelScenarios = useMemo(() => realGermanyScenariosForLevel(level), [level]);
  const categories = useMemo(() => realGermanyCategories(level), [level]);

  const filteredScenarios = useMemo(() => {
    const lowered = query.trim().toLocaleLowerCase("tr-TR");
    return levelScenarios.filter((item) => {
      const categoryOk = selectedCategory === "ALL" || item.category === selectedCategory;
      const searchSource = [item.title, item.summary, item.category, item.tags.join(" ")].join(" ").toLocaleLowerCase("tr-TR");
      const searchOk = !lowered || searchSource.includes(lowered);
      return categoryOk && searchOk;
    });
  }, [levelScenarios, query, selectedCategory]);

  useEffect(() => {
    setSelectedCategory("ALL");
    setScenario(null);
    setStepState({});
    setMessage(null);
  }, [level]);

  useEffect(() => {
    if (!scenario || typeof window === "undefined") return;
    const raw = window.localStorage.getItem(scenarioStorageKey(scenario.id));
    if (!raw) {
      setStepState(buildInitialState(scenario));
      return;
    }

    try {
      const parsed = JSON.parse(raw) as StepState;
      const initial = buildInitialState(scenario);
      setStepState({ ...initial, ...parsed });
    } catch {
      setStepState(buildInitialState(scenario));
    }
  }, [scenario]);

  useEffect(() => {
    if (!scenario || typeof window === "undefined" || !Object.keys(stepState).length) return;
    window.localStorage.setItem(scenarioStorageKey(scenario.id), JSON.stringify(stepState));
  }, [scenario, stepState]);

  const totalCount = realGermanyScenarios.length;
  const categoryCount = realGermanyCategories().length;
  const completedSteps = scenario
    ? scenario.steps.filter((step) => {
        const state = stepState[step.id];
        if (!state) return false;
        return isResponseStep(step) ? Boolean(state.response.trim()) : state.completed;
      }).length
    : 0;
  const progress = scenario ? Math.round((completedSteps / scenario.steps.length) * 100) : 0;

  function selectScenario(next: RealGermanyScenario) {
    setScenario(next);
    setMessage(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function updateResponse(stepId: string, value: string) {
    setStepState((current) => ({
      ...current,
      [stepId]: {
        response: value,
        completed: value.trim().length > 0,
      },
    }));
  }

  function toggleCompleted(stepId: string) {
    setStepState((current) => ({
      ...current,
      [stepId]: {
        response: current[stepId]?.response ?? "",
        completed: !current[stepId]?.completed,
      },
    }));
  }

  function resetScenario() {
    if (!scenario) return;
    const initial = buildInitialState(scenario);
    setStepState(initial);
    setMessage("Bu görev sıfırlandı. Tekrar başlayabilirsin.");
    if (typeof window !== "undefined") window.localStorage.removeItem(scenarioStorageKey(scenario.id));
  }

  function finishScenario() {
    if (!scenario) return;
    const missing = scenario.steps.filter((step) => {
      const state = stepState[step.id];
      return isResponseStep(step) ? !state?.response?.trim() : !state?.completed;
    });
    if (missing.length > 0) {
      setMessage(`Görevi tamamlamak için ${missing.length} adımı daha bitirmen gerekiyor.`);
      return;
    }
    setMessage("Harika! Bu gerçek görev akışını tamamladın. Şimdi farklı bir senaryoya geçebilirsin.");
  }

  if (!scenario) {
    return (
      <section className={styles.page}>
        <header className={styles.hero}>
          <div>
            <span className={styles.eyebrow}>V30.1 · GERÇEK ALMANYA MODU</span>
            <h1>Almanya’daki gerçek görevleri güvenli bir alanda prova et.</h1>
            <p>
              Kelime ezberlemenin ötesine geç: e-postayı oku, sesli mesajı anla, formu doldur,
              ardından Almanca cevap yaz veya konuşma taslağını oluştur.
            </p>
          </div>
          <div className={styles.heroPanel}>
            <div>
              <strong>{totalCount} senaryo</strong>
              <span>A1’den B2’ye, gerçek yaşam odaklı</span>
            </div>
            <div>
              <strong>{categoryCount} kategori</strong>
              <span>İlk gelişten resmî yazışmalara kadar</span>
            </div>
            <div>
              <strong>4 beceri akışı</strong>
              <span>Oku → Dinle → Form → Yaz / Konuş</span>
            </div>
          </div>
        </header>

        <section className={styles.levelSection}>
          <div className={styles.sectionHeading}>
            <div>
              <span>SEVİYE SEÇ</span>
              <h2>Hangi aşamayı çalışmak istiyorsun?</h2>
            </div>
            <Compass size={22} />
          </div>
          <div className={styles.levelGrid}>
            {(["A1", "A2", "B1", "B2"] as RealGermanyLevel[]).map((item) => (
              <button
                key={item}
                type="button"
                className={`${styles.levelCard} ${item === level ? styles.levelCardActive : ""}`}
                onClick={() => setLevel(item)}
              >
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
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Senaryo, kategori veya etiket ara"
                />
              </label>
              <div className={styles.categoryBar}>
                <button
                  type="button"
                  className={`${styles.categoryChip} ${selectedCategory === "ALL" ? styles.categoryChipActive : ""}`}
                  onClick={() => setSelectedCategory("ALL")}
                >
                  <Filter size={16} /> Tümü
                </button>
                {categories.map((item) => (
                  <button
                    key={item}
                    type="button"
                    className={`${styles.categoryChip} ${selectedCategory === item ? styles.categoryChipActive : ""}`}
                    onClick={() => setSelectedCategory(item)}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.sectionHeading}>
              <div>
                <span>SENARYOLAR</span>
                <h2>{level} seviyesi için gerçek Almanya görevleri</h2>
              </div>
              <BadgeCheck size={22} />
            </div>

            <div className={styles.scenarioGrid}>
              {filteredScenarios.map((item) => (
                <button key={item.id} type="button" className={styles.scenarioCard} onClick={() => selectScenario(item)}>
                  <div className={styles.scenarioTop}>
                    <span>{item.category}</span>
                    <ChevronRight size={18} />
                  </div>
                  <h3>{item.title}</h3>
                  <p>{item.summary}</p>
                  <div className={styles.scenarioMeta}>
                    <span><MapPinned size={15} /> {item.city}</span>
                    <span>{item.estimatedMinutes} dk</span>
                    <span>{item.difficulty}</span>
                  </div>
                </button>
              ))}
            </div>
            {filteredScenarios.length === 0 ? (
              <div className={styles.emptyState}>Bu filtreyle eşleşen senaryo bulunamadı.</div>
            ) : null}
          </section>

          <aside className={styles.sidePanel}>
            <div className={styles.panelTitle}>
              <Landmark size={20} />
              <div>
                <strong>Neden önemli?</strong>
                <span>Rakiplerden ayrıştıran günlük Almanya pratiği</span>
              </div>
            </div>
            <ul className={styles.checkList}>
              <li>Resmî kurum, kampüs, iş ve günlük hayat bağlamı içerir.</li>
              <li>Her görev dört beceriyi zincir halinde çalıştırır.</li>
              <li>Senaryolar seviyeye göre sadeleşir veya karmaşıklaşır.</li>
            </ul>

            <div className={styles.panelTitle}>
              <Sparkles size={20} />
              <div>
                <strong>Öne çıkan kategoriler</strong>
                <span>Daha fazla senaryo ile genişletildi</span>
              </div>
            </div>
            <div className={styles.tagCloud}>
              {realGermanyCategories().map((item) => (
                <span key={item} className={styles.tag}>{item}</span>
              ))}
            </div>

            <div className={styles.flowCard}>
              <strong>Tipik görev akışı</strong>
              <ol>
                <li>E-posta veya duyuru oku</li>
                <li>Sesli mesajı anla</li>
                <li>Form / bilgi alanını doldur</li>
                <li>Almanca cevap yaz veya konuşma taslağı hazırla</li>
              </ol>
            </div>
          </aside>
        </div>
      </section>
    );
  }

  return (
    <section className={styles.page}>
      <div className={styles.taskHeader}>
        <div>
          <button type="button" className={styles.backButton} onClick={() => setScenario(null)}>
            <ArrowLeft size={16} /> Tüm senaryolara dön
          </button>
          <span className={styles.eyebrow}>{scenario.level} · {scenario.category}</span>
          <h1>{scenario.title}</h1>
          <p>{scenario.summary}</p>
        </div>
        <div className={styles.taskSummary}>
          <div>
            <strong>{scenario.city}</strong>
            <span>Şehir bağlamı</span>
          </div>
          <div>
            <strong>{scenario.estimatedMinutes} dk</strong>
            <span>Tahmini süre</span>
          </div>
          <div>
            <strong>{scenario.difficulty}</strong>
            <span>Zorluk</span>
          </div>
        </div>
      </div>

      <div className={styles.progressShell}>
        <div className={styles.progressHeader}>
          <div>
            <span>GÖREV İLERLEMESİ</span>
            <strong>{completedSteps} / {scenario.steps.length} adım tamamlandı</strong>
          </div>
          <Target size={18} />
        </div>
        <div className={styles.progressTrack}>
          <div className={styles.progressBar} style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className={styles.layoutGrid}>
        <section>
          <div className={styles.goalCard}>
            <div className={styles.panelTitle}>
              <BriefcaseBusiness size={20} />
              <div>
                <strong>Görev amacı</strong>
                <span>{scenario.goal}</span>
              </div>
            </div>
          </div>

          <div className={styles.stepList}>
            {scenario.steps.map((step, index) => {
              const meta = stepMeta[step.kind];
              const current = stepState[step.id] ?? { response: "", completed: false };
              const complete = isResponseStep(step) ? Boolean(current.response.trim()) : current.completed;

              return (
                <article key={step.id} className={styles.stepCard}>
                  <div className={styles.stepHeader}>
                    <div className={styles.stepIndex}>{index + 1}</div>
                    <div>
                      <span>{meta.label}</span>
                      <h3>{step.title}</h3>
                    </div>
                    <meta.Icon size={20} className={styles.stepIcon} />
                  </div>
                  <p className={styles.stepInstruction}>{step.instruction}</p>
                  <div className={styles.promptBox}>{step.prompt}</div>
                  {step.helper ? <p className={styles.helperText}>İpucu: {step.helper}</p> : null}
                  {isResponseStep(step) ? (
                    <textarea
                      value={current.response}
                      onChange={(event) => updateResponse(step.id, event.target.value)}
                      placeholder={step.placeholder ?? "Cevabını buraya yaz"}
                      className={styles.textarea}
                      rows={step.kind === "FORM" ? 3 : 5}
                    />
                  ) : (
                    <button type="button" className={styles.completeButton} onClick={() => toggleCompleted(step.id)}>
                      {complete ? <CheckCircle2 size={16} /> : <AudioLines size={16} />}
                      {complete ? "Tamamlandı" : "Okudum / dinledim"}
                    </button>
                  )}
                  {isResponseStep(step) && complete ? <div className={styles.inlineSuccess}><CheckCircle2 size={15} /> Yanıt kaydedildi</div> : null}
                </article>
              );
            })}
          </div>

          {message ? <div className={styles.messageBox}>{message}</div> : null}

          <div className={styles.actionRow}>
            <button type="button" className={styles.secondaryButton} onClick={resetScenario}>Görevi sıfırla</button>
            <button type="button" className={styles.primaryButton} onClick={finishScenario}>Görevi tamamla</button>
          </div>
        </section>

        <aside className={styles.sidePanel}>
          <div className={styles.panelTitle}>
            <CheckCircle2 size={20} />
            <div>
              <strong>Başarı kontrol listesi</strong>
              <span>Bu görevi bitirirken odak noktaların</span>
            </div>
          </div>
          <ul className={styles.checkList}>
            {scenario.successChecklist.map((item) => <li key={item}>{item}</li>)}
          </ul>

          <div className={styles.panelTitle}>
            <BookOpenText size={20} />
            <div>
              <strong>Ana kelimeler</strong>
              <span>Görev içindeki kritik kelime havuzu</span>
            </div>
          </div>
          <div className={styles.tagCloud}>
            {scenario.vocabulary.map((item) => <span key={item} className={styles.tag}>{item}</span>)}
          </div>

          <div className={styles.panelTitle}>
            <MessageSquare size={20} />
            <div>
              <strong>Destek ifadeleri</strong>
              <span>Yazarken veya konuşurken kullan</span>
            </div>
          </div>
          <ul className={styles.phraseList}>
            {scenario.supportPhrases.map((item) => <li key={item}>{item}</li>)}
          </ul>
        </aside>
      </div>
    </section>
  );
}
