"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  BarChart3,
  BookOpenCheck,
  Check,
  CheckCircle2,
  Circle,
  Clock3,
  GitCompare,
  History,
  Lightbulb,
  Link2,
  ListChecks,
  Loader2,
  PenLine,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
} from "lucide-react";
import { writingCoachLevels, writingScenariosForLevel } from "@/data/writing-coach";
import type {
  WritingCoachAttemptSummary,
  WritingCoachError,
  WritingCoachFeedback,
  WritingCoachLevel,
  WritingCoachReviewResponse,
  WritingCoachRevisionSummary,
  WritingCoachRubricMode,
  WritingCoachScenario,
  WritingErrorCategory,
  WritingErrorProfileView,
  WritingRevisionComparison,
  WritingRubricKey,
} from "@/types/writing-coach";
import styles from "./writing-coach.module.css";

const rubricLabels: Record<WritingRubricKey, string> = {
  taskFulfillment: "Görevi yerine getirme",
  grammarAccuracy: "Gramer doğruluğu",
  vocabularyRange: "Kelime çeşitliliği",
  sentenceConnections: "Cümle bağlantıları",
  spellingPunctuation: "Yazım ve noktalama",
  levelAppropriateness: "Seviyeye uygunluk",
};

const rubricKeys = Object.keys(rubricLabels) as WritingRubricKey[];

const levelDescriptions: Record<WritingCoachLevel, string> = {
  A1: "Basit mesajlar, kısa tanıtımlar ve günlük ihtiyaçlar",
  A2: "Günlük e-postalar, deneyimler ve kısa görüş yazıları",
  B1: "Bağlantılı paragraflar, resmî yazışmalar ve gerekçeli görüşler",
  B2: "Ayrıntılı argümanlar, akademik ve profesyonel metinler",
};

const rubricModeLabels: Record<WritingCoachRubricMode, { title: string; description: string }> = {
  DEUTSCHIMO: { title: "Deutschimo", description: "Dengeli gelişim ve seviyeye uygunluk" },
  GOETHE: { title: "Goethe benzeri", description: "Görev, dil ve metin düzeni odaklı" },
  TELC: { title: "telc benzeri", description: "İletişim, görev kapsamı ve bağlantı odaklı" },
};

const grammarCategories = new Set<WritingErrorCategory>([
  "ARTICLE", "DATIVE", "ACCUSATIVE", "VERB_POSITION", "VERB_CONJUGATION", "TENSE",
  "PREPOSITION", "WORD_ORDER", "AGREEMENT",
]);
const vocabularyCategories = new Set<WritingErrorCategory>(["VOCABULARY", "REGISTER"]);
const connectionCategories = new Set<WritingErrorCategory>(["CONNECTOR", "COHERENCE", "TASK_FULFILLMENT"]);
const mechanicsCategories = new Set<WritingErrorCategory>(["SPELLING", "PUNCTUATION"]);

function countWords(value: string) {
  return value.trim() ? value.trim().split(/\s+/u).length : 0;
}

function errorSeverityLabel(severity: WritingCoachError["severity"]) {
  if (severity === "HIGH") return "Öncelikli";
  if (severity === "MEDIUM") return "Önemli";
  return "İnce ayar";
}

function errorTone(category: WritingErrorCategory) {
  if (grammarCategories.has(category)) return "toneGrammar";
  if (vocabularyCategories.has(category)) return "toneVocabulary";
  if (connectionCategories.has(category)) return "toneConnection";
  if (mechanicsCategories.has(category)) return "toneMechanics";
  return "toneOther";
}

function errorKey(error: WritingCoachError, index: number) {
  return `${error.category}:${error.excerpt}:${index}`;
}

function highlightedText(text: string, errors: WritingCoachError[]): ReactNode[] {
  const matches = errors
    .map((error, index) => ({ error, index, start: text.indexOf(error.excerpt) }))
    .filter((match) => match.start >= 0 && match.error.excerpt.length > 0)
    .sort((a, b) => a.start - b.start || b.error.excerpt.length - a.error.excerpt.length);

  const nodes: ReactNode[] = [];
  let cursor = 0;

  for (const match of matches) {
    if (match.start < cursor) continue;
    if (match.start > cursor) nodes.push(text.slice(cursor, match.start));
    nodes.push(
      <mark
        key={`${match.start}-${match.index}`}
        className={`${styles.errorMark} ${styles[errorTone(match.error.category)]}`}
        title={match.error.label}
      >
        {match.error.excerpt}
      </mark>,
    );
    cursor = match.start + match.error.excerpt.length;
  }

  if (cursor < text.length) nodes.push(text.slice(cursor));
  return nodes.length ? nodes : [text];
}

function sentenceForExcerpt(text: string, excerpt: string) {
  const index = text.indexOf(excerpt);
  if (index < 0) return excerpt;
  const before = text.slice(0, index);
  const after = text.slice(index + excerpt.length);
  const previousBoundary = Math.max(before.lastIndexOf("."), before.lastIndexOf("!"), before.lastIndexOf("?"), before.lastIndexOf("\n"));
  const nextCandidates = [after.indexOf("."), after.indexOf("!"), after.indexOf("?"), after.indexOf("\n")].filter((value) => value >= 0);
  const nextBoundary = nextCandidates.length ? Math.min(...nextCandidates) : after.length;
  return text.slice(previousBoundary + 1, index + excerpt.length + nextBoundary + (nextBoundary < after.length ? 1 : 0)).trim();
}

function scoreDeltaLabel(value: number) {
  if (value > 0) return `+${value}`;
  return String(value);
}

interface HistoryPayload {
  errorHistory?: WritingErrorProfileView[];
  recentAttempts?: WritingCoachAttemptSummary[];
}

export function WritingCoach({ initialLevel }: { initialLevel: WritingCoachLevel }) {
  const [level, setLevel] = useState<WritingCoachLevel>(initialLevel);
  const [scenario, setScenario] = useState<WritingCoachScenario | null>(null);
  const [rubricMode, setRubricMode] = useState<WritingCoachRubricMode>("DEUTSCHIMO");
  const [draft, setDraft] = useState("");
  const [feedback, setFeedback] = useState<WritingCoachFeedback | null>(null);
  const [reviewedText, setReviewedText] = useState("");
  const [initialText, setInitialText] = useState("");
  const [sessionId, setSessionId] = useState<string | undefined>();
  const [revisionNumber, setRevisionNumber] = useState(0);
  const [comparison, setComparison] = useState<WritingRevisionComparison | null>(null);
  const [revisionHistory, setRevisionHistory] = useState<WritingCoachRevisionSummary[]>([]);
  const [correctedErrors, setCorrectedErrors] = useState<Set<string>>(new Set());
  const [smartReviewQueued, setSmartReviewQueued] = useState(0);
  const [errorHistory, setErrorHistory] = useState<WritingErrorProfileView[]>([]);
  const [recentAttempts, setRecentAttempts] = useState<WritingCoachAttemptSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const startedAt = useRef(Date.now());
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scenarios = useMemo(() => writingScenariosForLevel(level), [level]);
  const wordCount = countWords(draft);
  const progress = scenario ? Math.min(100, Math.round((wordCount / scenario.targetWords) * 100)) : 0;
  const correctedCount = correctedErrors.size;

  useEffect(() => {
    let active = true;
    setHistoryLoading(true);
    fetch("/api/writing-coach/review", { cache: "no-store" })
      .then(async (response) => {
        const payload = await response.json() as HistoryPayload & { error?: string };
        if (!response.ok) throw new Error(payload.error || "Yazma geçmişi yüklenemedi.");
        if (active) {
          setErrorHistory(payload.errorHistory ?? []);
          setRecentAttempts(payload.recentAttempts ?? []);
        }
      })
      .catch(() => null)
      .finally(() => active && setHistoryLoading(false));
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!scenario) return;
    const saved = window.localStorage.getItem(`deutschimo-writing-${scenario.id}`) ?? "";
    setDraft(saved);
    setFeedback(null);
    setReviewedText("");
    setInitialText("");
    setSessionId(undefined);
    setRevisionNumber(0);
    setComparison(null);
    setRevisionHistory([]);
    setCorrectedErrors(new Set());
    setSmartReviewQueued(0);
    setMessage(null);
    setRubricMode("DEUTSCHIMO");
    startedAt.current = Date.now();
  }, [scenario]);

  useEffect(() => {
    if (!scenario) return;
    window.localStorage.setItem(`deutschimo-writing-${scenario.id}`, draft);
  }, [draft, scenario]);

  function chooseLevel(nextLevel: WritingCoachLevel) {
    setLevel(nextLevel);
    setScenario(null);
    setFeedback(null);
    setMessage(null);
  }

  function chooseScenario(nextScenario: WritingCoachScenario) {
    setScenario(nextScenario);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function chooseRubricMode(nextMode: WritingCoachRubricMode) {
    if (nextMode === rubricMode) return;
    setRubricMode(nextMode);
    if (sessionId) {
      setSessionId(undefined);
      setRevisionNumber(0);
      setFeedback(null);
      setReviewedText("");
      setInitialText("");
      setComparison(null);
      setRevisionHistory([]);
      setCorrectedErrors(new Set());
      setSmartReviewQueued(0);
      setMessage("Değerlendirme modu değişti. Karşılaştırılabilir sonuçlar için yeni bir yazma oturumu başlatıldı.");
    }
  }

  function resetScenario() {
    if (!scenario) return;
    setDraft("");
    setFeedback(null);
    setReviewedText("");
    setInitialText("");
    setSessionId(undefined);
    setRevisionNumber(0);
    setComparison(null);
    setRevisionHistory([]);
    setCorrectedErrors(new Set());
    setSmartReviewQueued(0);
    setMessage(null);
    window.localStorage.removeItem(`deutschimo-writing-${scenario.id}`);
    startedAt.current = Date.now();
    textareaRef.current?.focus();
  }

  function toggleCorrected(key: string) {
    setCorrectedErrors((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  async function submitReview() {
    if (!scenario) return;
    if (wordCount < 12) {
      setMessage("Anlamlı bir değerlendirme için en az 12 kelime yazmalısın.");
      textareaRef.current?.focus();
      return;
    }
    if (draft.length > 8_000) {
      setMessage("Metin 8.000 karakterden uzun olamaz.");
      return;
    }

    setLoading(true);
    setMessage(null);
    try {
      const response = await fetch("/api/writing-coach/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scenarioId: scenario.id,
          level: scenario.level,
          text: draft,
          rubricMode,
          sessionId,
          durationSeconds: Math.max(1, Math.round((Date.now() - startedAt.current) / 1000)),
        }),
      });
      const payload = await response.json() as WritingCoachReviewResponse & { error?: string };
      if (!response.ok) throw new Error(payload.error || "Metnin değerlendirilemedi.");

      setFeedback(payload.feedback);
      setReviewedText(payload.currentText);
      setInitialText(payload.initialText);
      setSessionId(payload.sessionId);
      setRevisionNumber(payload.revisionNumber);
      setComparison(payload.comparison);
      setRevisionHistory(payload.revisionHistory);
      setSmartReviewQueued(payload.smartReviewQueued);
      setCorrectedErrors(new Set());
      setErrorHistory(payload.errorHistory);
      setRecentAttempts((current) => [{
        id: `${payload.sessionId}-${payload.revisionNumber}`,
        scenarioId: scenario.id,
        level: scenario.level,
        revisionNumber: payload.revisionNumber,
        overallScore: payload.feedback.overallScore,
        improvement: payload.comparison.overallDelta,
        errorCount: payload.feedback.errors.length,
        rubricMode,
        createdAt: new Date().toISOString(),
      }, ...current].slice(0, 8));
      startedAt.current = Date.now();
      window.setTimeout(() => document.getElementById("writing-feedback")?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Beklenmeyen bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  }

  if (!scenario) {
    return (
      <section className={styles.page}>
        <header className={styles.hero}>
          <div>
            <span className={styles.eyebrow}>V29.2 · YAZMA KOÇU 2.0</span>
            <h1>İlk metninden daha güçlü bir son metne ilerle.</h1>
            <p>Seviyene uygun bir görev seç, hatalarını kendin düzelt ve ilk–son puan gelişimini ayrıntılı biçimde gör.</p>
          </div>
          <div className={styles.heroBadge}>
            <ShieldCheck size={22} />
            <div><strong>Öğreten geri bildirim</strong><span>İşaretle · açıkla · yeniden yazdır · karşılaştır</span></div>
          </div>
        </header>

        <div className={styles.levelGrid}>
          {writingCoachLevels.map((item) => (
            <button key={item} type="button" onClick={() => chooseLevel(item)} className={`${styles.levelCard} ${level === item ? styles.levelCardActive : ""}`}>
              <span>{item}</span>
              <strong>{levelDescriptions[item]}</strong>
              <small>6 senaryo</small>
            </button>
          ))}
        </div>

        <div className={styles.contentGrid}>
          <div>
            <div className={styles.sectionHeading}>
              <div><span>{level} seviyesi</span><h2>Bir yazma senaryosu seç</h2></div>
              <Target size={24} />
            </div>
            <div className={styles.scenarioGrid}>
              {scenarios.map((item) => (
                <button key={item.id} type="button" className={styles.scenarioCard} onClick={() => chooseScenario(item)}>
                  <div className={styles.scenarioTop}><span>{item.category}</span><PenLine size={18} /></div>
                  <h3>{item.title}</h3>
                  <p>{item.situation}</p>
                  <div className={styles.scenarioMeta}><span><Clock3 size={15} /> {item.targetWords} kelime</span><span>{item.level}</span></div>
                </button>
              ))}
            </div>
          </div>

          <aside className={styles.historyPanel}>
            <div className={styles.panelTitle}><History size={20} /><div><strong>Hata geçmişin</strong><span>Tekrarlanan sorunlar Akıllı Tekrar’a aktarılır.</span></div></div>
            {historyLoading ? <div className={styles.emptyState}><Loader2 className={styles.spin} size={22} /> Yükleniyor…</div> : errorHistory.length ? (
              <div className={styles.errorHistoryList}>
                {errorHistory.slice(0, 8).map((item) => (
                  <div key={item.category} className={styles.historyRow}>
                    <div><strong>{item.label}</strong><span>{item.lastExcerpt || "Son hata kaydı"}</span></div>
                    <b>{item.count} kez</b>
                  </div>
                ))}
              </div>
            ) : <div className={styles.emptyState}>Henüz kayıtlı yazma hatan yok. İlk metnini gönderdiğinde burada görünecek.</div>}

            {recentAttempts.length > 0 && (
              <div className={styles.recentBox}>
                <span>Son denemeler</span>
                {recentAttempts.slice(0, 4).map((attempt) => (
                  <div key={attempt.id}>
                    <small>{attempt.level} · Revizyon {attempt.revisionNumber}</small>
                    <strong>%{attempt.overallScore}</strong>
                  </div>
                ))}
              </div>
            )}
          </aside>
        </div>
      </section>
    );
  }

  return (
    <section className={styles.page}>
      <button type="button" className={styles.backButton} onClick={() => setScenario(null)}><ArrowLeft size={18} /> Senaryolara dön</button>

      <header className={styles.taskHeader}>
        <div><span className={styles.eyebrow}>{scenario.level} · {scenario.category}</span><h1>{scenario.title}</h1><p>{scenario.situation}</p></div>
        <div className={styles.wordTarget}><strong>{wordCount}</strong><span>/ {scenario.targetWords} hedef kelime</span></div>
      </header>

      <div className={styles.flowTracker} aria-label="Yazma koçu ilerleme adımları">
        {[
          ["1", "İlk metin", revisionNumber >= 1],
          ["2", "Hataları anla", Boolean(feedback)],
          ["3", "Kendin düzelt", revisionNumber >= 1],
          ["4", "İlk–son karşılaştır", revisionNumber >= 2],
        ].map(([number, label, completed]) => (
          <div key={String(number)} className={completed ? styles.flowDone : ""}>
            <span>{completed ? <Check size={15} /> : number}</span><strong>{label}</strong>
          </div>
        ))}
      </div>

      <div className={styles.modeSection}>
        <div><span className={styles.eyebrow}>DEĞERLENDİRME MODU</span><h2>Metnin hangi ölçütlerle değerlendirilsin?</h2></div>
        <div className={styles.modeGrid}>
          {(Object.keys(rubricModeLabels) as WritingCoachRubricMode[]).map((mode) => (
            <button key={mode} type="button" onClick={() => chooseRubricMode(mode)} className={`${styles.modeCard} ${rubricMode === mode ? styles.modeCardActive : ""}`}>
              <strong>{rubricModeLabels[mode].title}</strong><span>{rubricModeLabels[mode].description}</span>
            </button>
          ))}
        </div>
        {rubricMode !== "DEUTSCHIMO" && <p className={styles.modeDisclaimer}>Bu çalışma modu resmî Goethe veya telc puanı vermez; yalnızca benzer genel ölçütlerle pratik değerlendirme sunar.</p>}
      </div>

      <div className={styles.workspace}>
        <div className={styles.editorColumn}>
          <div className={styles.promptCard}>
            <BookOpenCheck size={22} />
            <div><strong>Görevin</strong><p>{scenario.prompt}</p></div>
          </div>

          <div className={styles.requirementsGrid}>
            <div><span>Metninde bulunmalı</span>{scenario.requiredPoints.map((point) => <p key={point}><Check size={15} /> {point}</p>)}</div>
            <div><span>İşine yarayabilecek ifadeler</span>{scenario.usefulPhrases.map((phrase) => <p key={phrase}><Lightbulb size={15} /> {phrase}</p>)}</div>
          </div>

          <label className={styles.editorLabel} htmlFor="writing-draft">Almanca metnin</label>
          <textarea
            ref={textareaRef}
            id="writing-draft"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            className={styles.editor}
            placeholder="Metnini burada Almanca olarak yaz…"
            maxLength={8_000}
          />
          <div className={styles.editorFooter}>
            <div className={styles.progressTrack}><span style={{ width: `${progress}%` }} /></div>
            <span className={wordCount > scenario.maxWords ? styles.wordWarning : ""}>{wordCount} kelime · önerilen {scenario.minWords}–{scenario.maxWords}</span>
          </div>

          {message && <div className={styles.errorMessage}><AlertCircle size={18} /> {message}</div>}

          <div className={styles.actionRow}>
            <button type="button" className={styles.secondaryButton} onClick={resetScenario}><RotateCcw size={17} /> Taslağı temizle</button>
            <button type="button" className={styles.primaryButton} onClick={submitReview} disabled={loading}>
              {loading ? <><Loader2 className={styles.spin} size={18} /> AI değerlendiriyor…</> : <><Sparkles size={18} /> {revisionNumber ? "Revizyonu değerlendir" : "İlk metni değerlendir"}</>}
            </button>
          </div>
          <p className={styles.privacyNote}>Kontrol sırasında metnin OpenAI API üzerinden değerlendirilir. AI sana hazır metin veya düzeltilmiş tam cümle vermez; öğrenme kayıtların hesabında saklanır.</p>
        </div>

        <aside className={styles.sideSummary}>
          <div><strong>Değerlendirme rubriği</strong>{rubricKeys.map((key) => <span key={key}><CheckCircle2 size={15} /> {rubricLabels[key]}</span>)}</div>
          <div className={styles.coachRule}><ShieldCheck size={20} /><p><strong>Dört aşamalı koçluk</strong>İlk metin değerlendirilir, hata yerleri açıklanır, düzeltmeyi sen yaparsın ve gelişimin karşılaştırılır.</p></div>
          {revisionHistory.length > 0 && (
            <div className={styles.miniRevisionList}>
              <strong>Revizyon geçmişi</strong>
              {revisionHistory.map((revision) => (
                <span key={revision.id}>Revizyon {revision.revisionNumber}<b>%{revision.overallScore}</b></span>
              ))}
            </div>
          )}
        </aside>
      </div>

      {feedback && (
        <section id="writing-feedback" className={styles.feedbackSection}>
          <div className={styles.feedbackHeader}>
            <div><span className={styles.eyebrow}>REVİZYON {revisionNumber} · {rubricModeLabels[rubricMode].title.toUpperCase()}</span><h2>Yazma koçu geri bildirimin</h2><p>{feedback.nextStep}</p></div>
            <div className={styles.scoreCircle}><strong>{feedback.overallScore}</strong><span>/100</span></div>
          </div>

          <div className={styles.modeNote}><ShieldCheck size={18} /><span>{feedback.evaluationModeNote}</span></div>

          <div className={styles.errorLegend}>
            <span><i className={styles.toneGrammar} /> Gramer</span>
            <span><i className={styles.toneVocabulary} /> Kelime/üslup</span>
            <span><i className={styles.toneConnection} /> Bağlantı/görev</span>
            <span><i className={styles.toneMechanics} /> Yazım/noktalama</span>
          </div>

          <div className={styles.stageCard}>
            <div className={styles.stageNumber}>1</div>
            <div className={styles.stageContent}>
              <h3>Cümle bazında hata yerlerini gör</h3>
              <p className={styles.stageIntro}>Koç, sorunun geçtiği cümleyi ve ilgili parçayı renkli biçimde işaretler; doğrusunu senin yerine yazmaz.</p>
              <div className={styles.highlightPreview}>{highlightedText(reviewedText, feedback.errors)}</div>
              {feedback.errors.length > 0 && (
                <div className={styles.sentenceList}>
                  {feedback.errors.map((item, index) => {
                    const sentence = sentenceForExcerpt(reviewedText, item.excerpt);
                    return (
                      <div key={errorKey(item, index)} className={`${styles.sentenceRow} ${styles[errorTone(item.category)]}`}>
                        <span>{item.label}</span><p>{highlightedText(sentence, [item])}</p>
                      </div>
                    );
                  })}
                </div>
              )}
              {!feedback.errors.length && <div className={styles.successBox}><CheckCircle2 size={19} /> Öncelikli bir dil hatası bulunmadı. Aşağıdaki rubrikle metnini daha da geliştirebilirsin.</div>}
            </div>
          </div>

          <div className={styles.stageCard}>
            <div className={styles.stageNumber}>2</div>
            <div className={styles.stageContent}>
              <h3>Hata türünü anla ve kendi düzeltmeni planla</h3>
              <div className={styles.feedbackErrorGrid}>
                {feedback.errors.map((item, index) => {
                  const key = errorKey(item, index);
                  const checked = correctedErrors.has(key);
                  return (
                    <article key={key} className={`${styles.feedbackErrorCard} ${styles[errorTone(item.category)]} ${checked ? styles.errorCardChecked : ""}`}>
                      <div className={styles.errorCardTop}><span>{item.label}</span><small className={styles[`severity${item.severity}`]}>{errorSeverityLabel(item.severity)}</small></div>
                      <blockquote>“{item.excerpt}”</blockquote>
                      <p>{item.explanation}</p>
                      <div className={styles.hintBox}><Lightbulb size={16} /><span>{item.hint}</span></div>
                      <strong>{item.rewriteQuestion}</strong>
                      <button type="button" className={styles.correctedToggle} onClick={() => toggleCorrected(key)}>
                        {checked ? <CheckCircle2 size={18} /> : <Circle size={18} />}
                        {checked ? "Düzelttim olarak işaretlendi" : "Bu hatayı metnimde düzelttim"}
                      </button>
                    </article>
                  );
                })}
              </div>
            </div>
          </div>

          <div className={styles.stageCard}>
            <div className={styles.stageNumber}>3</div>
            <div className={styles.stageContent}>
              <h3>Şimdi metnini kendin yeniden yaz</h3>
              <p className={styles.stageIntro}>İşaretlenen yerleri kendi cümlelerinle düzelt. Hazır olduğunda “Revizyonu değerlendir” düğmesine bas.</p>
              {feedback.errors.length > 0 && <div className={styles.correctionProgress}><ListChecks size={18} /><span>{correctedCount}/{feedback.errors.length} hata “düzelttim” olarak işaretlendi.</span></div>}
              <button type="button" className={styles.rewriteButton} onClick={() => { textareaRef.current?.focus(); textareaRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }); }}>
                <PenLine size={18} /> Metnimi yeniden düzenle
              </button>
            </div>
          </div>

          {(feedback.vocabularySuggestions.length > 0 || feedback.connectorSuggestions.length > 0) && (
            <div className={styles.suggestionGrid}>
              <div>
                <div className={styles.suggestionTitle}><Sparkles size={18} /><h3>Seviyene uygun kelimeler</h3></div>
                {feedback.vocabularySuggestions.map((suggestion) => <p key={suggestion.item}><strong>{suggestion.item}</strong><span>{suggestion.turkishHint}</span></p>)}
              </div>
              <div>
                <div className={styles.suggestionTitle}><Link2 size={18} /><h3>Bağlaç ve bağlantı önerileri</h3></div>
                {feedback.connectorSuggestions.map((suggestion) => <p key={suggestion.item}><strong>{suggestion.item}</strong><span>{suggestion.turkishHint}</span></p>)}
              </div>
            </div>
          )}

          {comparison && revisionNumber >= 2 && (
            <div className={styles.comparisonSection}>
              <div className={styles.comparisonHeader}>
                <div><span className={styles.eyebrow}>4. AŞAMA</span><h2>İlk ve son metin karşılaştırması</h2></div>
                <div className={`${styles.deltaBadge} ${comparison.overallDelta >= 0 ? styles.deltaPositive : styles.deltaNegative}`}>
                  <TrendingUp size={18} /> {scoreDeltaLabel(comparison.overallDelta)} puan
                </div>
              </div>

              <div className={styles.scoreComparison}>
                <div><span>İlk metin</span><strong>{comparison.initialScore}/100</strong></div>
                <ArrowRight size={24} />
                <div><span>Son metin</span><strong>{comparison.currentScore}/100</strong></div>
                <div className={styles.repairStats}>
                  <span><CheckCircle2 size={16} /> {comparison.resolvedErrorCount} hata türü giderildi</span>
                  <span><RotateCcw size={16} /> {comparison.repeatedErrorCount} hata türü tekrarlandı</span>
                  <span><AlertCircle size={16} /> {comparison.newErrorCount} yeni hata türü</span>
                </div>
              </div>

              <div className={styles.textComparison}>
                <article><span>İlk metin</span><p>{initialText}</p></article>
                <article><span>Son metin</span><p>{reviewedText}</p></article>
              </div>

              <div className={styles.rubricDeltaGrid}>
                {rubricKeys.map((key) => (
                  <div key={key}><span>{rubricLabels[key]}</span><strong className={comparison.rubricDelta[key] >= 0 ? styles.positiveText : styles.negativeText}>{scoreDeltaLabel(comparison.rubricDelta[key])}</strong></div>
                ))}
              </div>
            </div>
          )}

          <div className={styles.resultGrid}>
            <div className={styles.rubricPanel}>
              <h3>Değerlendirme rubriği</h3>
              {rubricKeys.map((key) => {
                const result = feedback.rubric[key];
                return (
                  <div key={key} className={styles.rubricRow}>
                    <div><strong>{rubricLabels[key]}</strong><span>{result.feedback}</span></div>
                    <div className={styles.rubricScore}><b>{result.score}</b><span><i style={{ width: `${result.score}%` }} /></span></div>
                  </div>
                );
              })}
            </div>

            <div className={styles.resultSide}>
              <div className={styles.strengthCard}><h3>Güçlü yönlerin</h3>{feedback.strengths.map((strength) => <p key={strength}><Check size={16} /> {strength}</p>)}</div>
              <div className={styles.coverageCard}><h3>Görev kapsamı</h3>{feedback.taskCoverage.map((item) => <p key={item.point} className={item.met ? styles.coverageMet : styles.coverageMissing}>{item.met ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}<span><strong>{item.point}</strong>{item.note}</span></p>)}</div>
              <div className={styles.levelFitCard}><strong>Seviyeye uygunluk</strong><p>{feedback.levelFit}</p></div>
              {smartReviewQueued > 0 && <div className={styles.smartReviewCard}><BarChart3 size={20} /><p><strong>Akıllı Tekrar bağlantısı</strong>{smartReviewQueued} tekrarlanan hata, Hata Onarım/Akıllı Tekrar kuyruğuna eklendi.</p></div>}
            </div>
          </div>

          {revisionHistory.length > 0 && (
            <div className={styles.revisionTimeline}>
              <div className={styles.suggestionTitle}><GitCompare size={19} /><h3>Revizyon geçmişi</h3></div>
              <div>
                {revisionHistory.map((revision) => (
                  <article key={revision.id} className={revision.revisionNumber === revisionNumber ? styles.revisionCurrent : ""}>
                    <span>Revizyon {revision.revisionNumber}</span>
                    <strong>%{revision.overallScore}</strong>
                    <small>{revision.errorCount} hata · {scoreDeltaLabel(revision.improvement)} toplam gelişim</small>
                  </article>
                ))}
              </div>
            </div>
          )}
        </section>
      )}
    </section>
  );
}
