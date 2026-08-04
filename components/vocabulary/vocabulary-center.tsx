"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BookMarked,
  BrainCircuit,
  CalendarClock,
  CheckCircle2,
  CircleAlert,
  Edit3,
  Headphones,
  ListChecks,
  Mic,
  PauseCircle,
  Plus,
  RotateCcw,
  Search,
  Trash2,
  Volume2,
  X,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { AdaptiveReviewControls } from "@/components/review/adaptive-review-controls";
import type {
  ReviewConfidence,
  VerbConjugation,
  VocabularyRating,
  VocabularyRecentAttempt,
  VocabularyRecord,
  VocabularyReviewCard,
  VocabularyReviewMode,
  VocabularyReviewResult,
  VocabularyScheduleResult,
  VocabularyStats,
} from "@/types/vocabulary";
import styles from "./vocabulary-center-v28-3.module.css";

type Tab = "REVIEW" | "NOTEBOOK" | "STATS";
type ReviewPayload = {
  card: VocabularyReviewCard | null;
  dueCount: number;
  nextReviewAt?: string | null;
  availableModes?: VocabularyReviewMode[];
};
type FormState = {
  id?: string;
  word: string;
  article: string;
  plural: string;
  translation: string;
  pronunciation: string;
  wordType: string;
  example: string;
  exampleTranslation: string;
  perfectForm: string;
  governedPreposition: string;
  sourceUnitTitle: string;
  notes: string;
  conjugation: Required<VerbConjugation>;
};

const emptyForm: FormState = {
  word: "", article: "", plural: "", translation: "", pronunciation: "", wordType: "",
  example: "", exampleTranslation: "", perfectForm: "", governedPreposition: "",
  sourceUnitTitle: "", notes: "",
  conjugation: { ich: "", du: "", erSieEs: "", wir: "", ihr: "", sieSie: "" },
};

const modeLabels: Record<"MIXED" | VocabularyReviewMode, string> = {
  MIXED: "Karışık tekrar",
  DE_TO_TR: "Almanca → Türkçe",
  TR_TO_DE: "Türkçe → Almanca",
  LISTEN_WRITE: "Dinle → Yaz",
  FILL_BLANK: "Boşluğu doldur",
  SENTENCE_ORDER: "Cümleyi sırala",
  SPEAK: "Sesli söyle",
  NEW_SENTENCE: "Yeni cümlede kullan",
  ARTICLE: "Artikel seç",
  PLURAL: "Çoğul biçimi",
  AUDIO_TO_WORD: "Dinle → Yaz",
  SENTENCE: "Yeni cümlede kullan",
};

const ratingLabels: Record<VocabularyRating, { label: string; note: string }> = {
  FORGOT: { label: "Unuttum", note: "çok yakın tekrar" },
  HARD: { label: "Zor", note: "kısa aralık" },
  GOOD: { label: "İyi", note: "normal aralık" },
  EASY: { label: "Çok kolay", note: "uzun aralık" },
};

const modeOrder: Array<"MIXED" | VocabularyReviewMode> = [
  "MIXED", "DE_TO_TR", "TR_TO_DE", "LISTEN_WRITE", "FILL_BLANK",
  "SENTENCE_ORDER", "SPEAK", "NEW_SENTENCE", "ARTICLE", "PLURAL",
];

export function VocabularyCenter() {
  const [tab, setTab] = useState<Tab>("REVIEW");
  const [items, setItems] = useState<VocabularyRecord[]>([]);
  const [stats, setStats] = useState<VocabularyStats>({
    total: 0, due: 0, newCount: 0, learning: 0, mastered: 0,
    averageMastery: 0, reviewedToday: 0, currentStreak: 0,
  });
  const [recentAttempts, setRecentAttempts] = useState<VocabularyRecentAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState<FormState>(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [reviewMode, setReviewMode] = useState<"MIXED" | VocabularyReviewMode>("MIXED");
  const [review, setReview] = useState<ReviewPayload>({ card: null, dueCount: 0 });
  const [answer, setAnswer] = useState("");
  const [selectedTokens, setSelectedTokens] = useState<number[]>([]);
  const [reviewResult, setReviewResult] = useState<VocabularyReviewResult | null>(null);
  const [scheduleResult, setScheduleResult] = useState<VocabularyScheduleResult | null>(null);
  const [confidence, setConfidence] = useState<ReviewConfidence | null>(null);
  const [hintUsed, setHintUsed] = useState(false);
  const [checking, setChecking] = useState(false);
  const [startedAt, setStartedAt] = useState(Date.now());
  const [message, setMessage] = useState("");

  const loadOverview = useCallback(async () => {
    const response = await fetch("/api/skills/vocabulary", { cache: "no-store" });
    if (!response.ok) throw new Error("Kelime verileri yüklenemedi.");
    const data = await response.json() as {
      items: VocabularyRecord[];
      stats: VocabularyStats;
      recentAttempts: VocabularyRecentAttempt[];
    };
    setItems(data.items);
    setStats(data.stats);
    setRecentAttempts(data.recentAttempts);
  }, []);

  const resetAttempt = useCallback(() => {
    setAnswer("");
    setSelectedTokens([]);
    setReviewResult(null);
    setScheduleResult(null);
    setConfidence(null);
    setHintUsed(false);
    setStartedAt(Date.now());
  }, []);

  const loadReview = useCallback(async () => {
    const response = await fetch(`/api/vocabulary/review?mode=${encodeURIComponent(reviewMode)}`, { cache: "no-store" });
    if (!response.ok) throw new Error("Tekrar kuyruğu yüklenemedi.");
    setReview(await response.json() as ReviewPayload);
    resetAttempt();
  }, [reviewMode, resetAttempt]);

  useEffect(() => {
    Promise.all([loadOverview(), loadReview()])
      .catch((error) => setMessage(error instanceof Error ? error.message : "Bir hata oluştu."))
      .finally(() => setLoading(false));
  }, [loadOverview, loadReview]);

  const filteredItems = useMemo(() => {
    const needle = search.trim().toLocaleLowerCase("tr-TR");
    if (!needle) return items;
    return items.filter((item) => [
      item.word, item.translation, item.article, item.plural, item.sourceUnitTitle, item.wordType,
    ].some((value) => value?.toLocaleLowerCase("tr-TR").includes(needle)));
  }, [items, search]);

  const orderedAnswer = useMemo(() => {
    if (!review.card?.tokens) return answer;
    return selectedTokens.map((tokenIndex) => review.card!.tokens![tokenIndex]).join(" ");
  }, [answer, review.card, selectedTokens]);

  function speak(text?: string | null) {
    if (!text || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "de-DE";
    utterance.rate = 0.84;
    window.speechSynthesis.speak(utterance);
  }

  function chooseToken(index: number) {
    if (selectedTokens.includes(index)) return;
    setSelectedTokens((previous) => [...previous, index]);
    setReviewResult(null);
  }

  function removeToken(position: number) {
    setSelectedTokens((previous) => previous.filter((_, index) => index !== position));
    setReviewResult(null);
  }

  async function checkAnswer() {
    if (!review.card) return;
    const value = review.card.mode === "SENTENCE_ORDER" ? orderedAnswer : answer;
    if (!confidence) {
      setMessage("Cevabı kontrol etmeden önce ‘Eminim’ veya ‘Emin değilim’ seçimini yap.");
      return;
    }
    if (!String(value).trim() && !review.card.selfAssessment) return;
    setChecking(true);
    setMessage("");
    try {
      const response = await fetch("/api/vocabulary/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "CHECK",
          itemId: review.card.itemId,
          mode: review.card.mode,
          answer: value,
          confidence,
          hintUsed,
        }),
      });
      const data = await response.json() as { result?: VocabularyReviewResult; error?: string };
      if (!response.ok || !data.result) throw new Error(data.error || "Cevap kontrol edilemedi.");
      setReviewResult(data.result);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Cevap kontrol edilemedi.");
    } finally {
      setChecking(false);
    }
  }

  async function rateAnswer(rating: VocabularyRating) {
    if (!review.card || !reviewResult || !confidence) return;
    const value = review.card.mode === "SENTENCE_ORDER" ? orderedAnswer : answer;
    setChecking(true);
    setMessage("");
    try {
      const response = await fetch("/api/vocabulary/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "RATE",
          itemId: review.card.itemId,
          mode: review.card.mode,
          answer: value,
          rating,
          responseMs: Date.now() - startedAt,
          hintUsed,
          confidence,
        }),
      });
      const data = await response.json() as { schedule?: VocabularyScheduleResult; error?: string };
      if (!response.ok) throw new Error(data.error || "Tekrar sonucu kaydedilemedi.");
      if (data.schedule) {
        setScheduleResult(data.schedule);
        setMessage(`Sonraki tekrar: ${data.schedule.label}. ${data.schedule.explanations[0] ?? ""}`);
      }
      await Promise.all([loadReview(), loadOverview()]);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Tekrar sonucu kaydedilemedi.");
    } finally {
      setChecking(false);
    }
  }

  function editItem(item: VocabularyRecord) {
    const conjugation = item.verbConjugation ?? {};
    setForm({
      id: item.id,
      word: item.word,
      article: item.article ?? "",
      plural: item.plural ?? "",
      translation: item.translation,
      pronunciation: item.pronunciation ?? "",
      wordType: item.wordType ?? "",
      example: item.example ?? "",
      exampleTranslation: item.exampleTranslation ?? "",
      perfectForm: item.perfectForm ?? "",
      governedPreposition: item.governedPreposition ?? "",
      sourceUnitTitle: item.sourceUnitTitle ?? "",
      notes: item.notes ?? "",
      conjugation: {
        ich: conjugation.ich ?? "", du: conjugation.du ?? "", erSieEs: conjugation.erSieEs ?? "",
        wir: conjugation.wir ?? "", ihr: conjugation.ihr ?? "", sieSie: conjugation.sieSie ?? "",
      },
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function saveItem(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      const response = await fetch("/api/skills/vocabulary", {
        method: form.id ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, verbConjugation: form.conjugation, sourceSkill: form.id ? undefined : "MANUAL" }),
      });
      const data = await response.json() as { error?: string };
      if (!response.ok) throw new Error(data.error || "Kelime kaydedilemedi.");
      setForm(emptyForm);
      setShowForm(false);
      await Promise.all([loadOverview(), loadReview()]);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Kelime kaydedilemedi.");
    } finally {
      setSaving(false);
    }
  }

  async function removeItem(id: string) {
    if (!window.confirm("Bu kelimeyi ve tekrar geçmişini kalıcı olarak silmek istiyor musun?")) return;
    const response = await fetch(`/api/skills/vocabulary?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    if (response.ok) await Promise.all([loadOverview(), loadReview()]);
  }

  async function toggleSuspended(item: VocabularyRecord) {
    const response = await fetch("/api/skills/vocabulary", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...item, id: item.id, verbConjugation: item.verbConjugation, suspended: !item.suspended }),
    });
    if (response.ok) await Promise.all([loadOverview(), loadReview()]);
  }

  return (
    <div className="vocab-v14">
      <header className="vocab-hero">
        <div>
          <span className="eyebrow">V28.3 · AKILLI TEKRAR 2.0</span>
          <h1>Her kelime için doğru zamanda, doğru biçimde tekrar.</h1>
          <p>Doğruluk, cevap süresi, ipucu, tekrar eden hata, zorluk ve güven seçimi birlikte değerlendirilir.</p>
        </div>
        <BrainCircuit size={54} />
      </header>

      <div className="vocab-stat-grid">
        <Stat icon={<CalendarClock />} label="Bugün bekleyen" value={stats.due} />
        <Stat icon={<BookMarked />} label="Toplam kelime" value={stats.total} />
        <Stat icon={<CheckCircle2 />} label="Ustalaşılan" value={stats.mastered} />
        <Stat icon={<RotateCcw />} label="Bugünkü tekrar" value={stats.reviewedToday} />
      </div>

      <nav className="vocab-tabs">
        <button className={tab === "REVIEW" ? "active" : ""} onClick={() => setTab("REVIEW")}><BrainCircuit />Akıllı tekrar</button>
        <button className={tab === "NOTEBOOK" ? "active" : ""} onClick={() => setTab("NOTEBOOK")}><BookMarked />Kelime defteri</button>
        <button className={tab === "STATS" ? "active" : ""} onClick={() => setTab("STATS")}><ListChecks />İstatistikler</button>
      </nav>

      {message ? <div className="vocab-message"><CircleAlert size={18} />{message}<button onClick={() => setMessage("")}><X size={16} /></button></div> : null}
      {loading ? <section className="panel">Kelime sistemi hazırlanıyor...</section> : null}

      {!loading && tab === "REVIEW" ? (
        <ReviewPanel
          review={review}
          mode={reviewMode}
          setMode={setReviewMode}
          answer={answer}
          setAnswer={(value) => { setAnswer(value); setReviewResult(null); }}
          selectedTokens={selectedTokens}
          onChooseToken={chooseToken}
          onRemoveToken={removeToken}
          result={reviewResult}
          schedule={scheduleResult}
          confidence={confidence}
          setConfidence={setConfidence}
          hintUsed={hintUsed}
          setHintUsed={setHintUsed}
          checking={checking}
          onCheck={checkAnswer}
          onRate={rateAnswer}
          onSpeak={speak}
        />
      ) : null}

      {!loading && tab === "NOTEBOOK" ? (
        <section className="vocab-notebook">
          <div className="section-head">
            <div><h2>Kelime defteri</h2><p>Örnek, artikel ve çoğul bilgileri yeni tekrar biçimlerini otomatik açar.</p></div>
            <button className="button button-primary" onClick={() => { setForm(emptyForm); setShowForm(!showForm); }}><Plus size={17} />Yeni kelime</button>
          </div>
          {showForm ? <VocabularyForm form={form} setForm={setForm} saving={saving} onSubmit={saveItem} onCancel={() => { setShowForm(false); setForm(emptyForm); }} /> : null}
          <label className="vocab-search"><Search size={18} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Kelime, anlam, artikel veya ünite ara" /></label>
          <div className="vocab-item-list">
            {filteredItems.map((item) => <VocabularyItemCard key={item.id} item={item} onSpeak={speak} onEdit={editItem} onDelete={removeItem} onSuspend={toggleSuspended} />)}
          </div>
          {!filteredItems.length ? <div className="panel intelligence-empty"><BookMarked /><div><h2>Kelime bulunamadı</h2><p>Yeni kelime ekleyebilir veya arama ifadesini değiştirebilirsin.</p></div></div> : null}
        </section>
      ) : null}

      {!loading && tab === "STATS" ? <StatsPanel stats={stats} attempts={recentAttempts} /> : null}
    </div>
  );
}

function ReviewPanel(props: {
  review: ReviewPayload;
  mode: "MIXED" | VocabularyReviewMode;
  setMode: (mode: "MIXED" | VocabularyReviewMode) => void;
  answer: string;
  setAnswer: (value: string) => void;
  selectedTokens: number[];
  onChooseToken: (index: number) => void;
  onRemoveToken: (position: number) => void;
  result: VocabularyReviewResult | null;
  schedule: VocabularyScheduleResult | null;
  confidence: ReviewConfidence | null;
  setConfidence: (value: ReviewConfidence) => void;
  hintUsed: boolean;
  setHintUsed: (value: boolean) => void;
  checking: boolean;
  onCheck: () => void;
  onRate: (rating: VocabularyRating) => void;
  onSpeak: (text?: string | null) => void;
}) {
  const card = props.review.card;
  return (
    <section className="vocab-review-layout">
      <div className="section-head">
        <div><h2>Akıllı tekrar</h2><p>{props.review.dueCount} öğe şu an tekrar bekliyor.</p></div>
        <select value={props.mode} onChange={(event) => props.setMode(event.target.value as "MIXED" | VocabularyReviewMode)}>
          {modeOrder.map((mode) => <option key={mode} value={mode}>{modeLabels[mode]}</option>)}
        </select>
      </div>

      {!card ? (
        <div className="panel intelligence-empty"><CheckCircle2 /><div><h2>Tekrar kuyruğun temiz</h2><p>Yeni bir tekrar oluştuğunda burada görünecek.</p></div></div>
      ) : (
        <article className="vocab-review-card">
          <div className="review-meta"><span>{modeLabels[card.mode]}</span>{card.sourceUnitTitle ? <span>{card.sourceUnitTitle}</span> : null}</div>
          <div className={styles.signalRow}>
            <span className={styles.signalChip}>Zorluk {card.difficulty}/5</span>
            <span className={styles.signalChip}>Hedef süre {card.expectedSeconds} sn</span>
            <span className={styles.signalChip}>Ustalık %{card.mastery}</span>
            {card.sameErrorStreak > 0 ? <span className={styles.signalChip}>Aynı hata ×{card.sameErrorStreak}</span> : null}
          </div>
          <h2>{card.prompt}</h2>

          {card.audioText ? (
            <div className={styles.audioActions}>
              <button type="button" className="button button-secondary" onClick={() => props.onSpeak(card.audioText)}><Volume2 size={18} />Dinle</button>
            </div>
          ) : null}

          {card.mode === "SENTENCE_ORDER" && card.tokens ? (
            <div>
              <div className={styles.answerBank} aria-label="Sıralanan cümle">
                {props.selectedTokens.map((tokenIndex, position) => (
                  <button type="button" key={`${tokenIndex}-${position}`} onClick={() => props.onRemoveToken(position)}>{card.tokens![tokenIndex]}</button>
                ))}
              </div>
              <div className={styles.tokenBank} aria-label="Kelime bankası">
                {card.tokens.map((token, index) => (
                  <button type="button" key={`${token}-${index}`} disabled={props.selectedTokens.includes(index)} onClick={() => props.onChooseToken(index)}>{token}</button>
                ))}
              </div>
            </div>
          ) : card.options ? (
            <div className="placement-options three">
              {card.options.map((option) => <button type="button" key={option} className={props.answer === option ? "selected" : ""} onClick={() => props.setAnswer(option)}>{option}</button>)}
            </div>
          ) : card.mode === "SPEAK" ? (
            <div className={styles.speakActions}>
              <button type="button" className="button button-primary" onClick={() => props.setAnswer("__SPOKEN__")}><Mic size={18} />Söyledim</button>
              <span className={styles.modeNote}>Önce dinle, sonra kelimeyi sesli tekrar et.</span>
            </div>
          ) : (
            <label className="field">
              <span>{card.mode === "NEW_SENTENCE" ? "Yeni cümlen" : "Cevabın"}</span>
              {card.mode === "NEW_SENTENCE" ? (
                <textarea value={props.answer} onChange={(event) => props.setAnswer(event.target.value)} placeholder="Almanca bir cümle yaz" rows={3} />
              ) : (
                <input value={props.answer} onChange={(event) => props.setAnswer(event.target.value)} placeholder="Cevabını yaz" />
              )}
            </label>
          )}

          <AdaptiveReviewControls
            confidence={props.confidence}
            onConfidenceChange={props.setConfidence}
            hint={card.hint}
            hintUsed={props.hintUsed}
            onUseHint={() => props.setHintUsed(true)}
            disabled={props.checking || Boolean(props.result)}
          />

          {!props.result ? (
            <div className={styles.reviewActions}>
              <button className="button button-primary" disabled={props.checking || !props.confidence} onClick={props.onCheck}>
                {props.checking ? "Kontrol ediliyor..." : "Cevabı Kontrol Et"}
              </button>
            </div>
          ) : (
            <>
              <div className={`review-feedback ${props.result.correct ? "correct" : "wrong"}`}>
                <strong>{props.result.correct ? "Tamamlandı" : "Tekrar dene"}</strong>
                <p>{props.result.explanation}</p>
                {props.result.modelSentence ? <small>Model: {props.result.modelSentence}</small> : null}
              </div>
              {props.schedule ? <div className={styles.feedbackSchedule}>Sonraki tekrar: <strong>{props.schedule.label}</strong></div> : null}
              <div className={styles.ratingGrid}>
                {(Object.keys(ratingLabels) as VocabularyRating[]).map((rating) => (
                  <button type="button" className="button button-secondary" key={rating} disabled={props.checking} onClick={() => props.onRate(rating)}>
                    <strong>{ratingLabels[rating].label}</strong><small>{ratingLabels[rating].note}</small>
                  </button>
                ))}
              </div>
            </>
          )}
        </article>
      )}
    </section>
  );
}

function VocabularyForm({ form, setForm, saving, onSubmit, onCancel }: {
  form: FormState;
  setForm: React.Dispatch<React.SetStateAction<FormState>>;
  saving: boolean;
  onSubmit: (event: React.FormEvent) => void;
  onCancel: () => void;
}) {
  const set = (key: keyof FormState, value: string) => setForm((previous) => ({ ...previous, [key]: value }));
  return (
    <form className="panel vocab-form" onSubmit={onSubmit}>
      <div className="form-grid">
        <label className="field"><span>Kelime *</span><input required value={form.word} onChange={(event) => set("word", event.target.value)} /></label>
        <label className="field"><span>Türkçe anlamı *</span><input required value={form.translation} onChange={(event) => set("translation", event.target.value)} /></label>
        <label className="field"><span>Artikel</span><input value={form.article} onChange={(event) => set("article", event.target.value)} placeholder="der / die / das" /></label>
        <label className="field"><span>Çoğul</span><input value={form.plural} onChange={(event) => set("plural", event.target.value)} /></label>
        <label className="field"><span>Kelime türü</span><input value={form.wordType} onChange={(event) => set("wordType", event.target.value)} /></label>
        <label className="field"><span>Telaffuz</span><input value={form.pronunciation} onChange={(event) => set("pronunciation", event.target.value)} /></label>
        <label className="field field-wide"><span>Örnek cümle</span><textarea value={form.example} onChange={(event) => set("example", event.target.value)} rows={2} /></label>
        <label className="field field-wide"><span>Örnek çevirisi</span><textarea value={form.exampleTranslation} onChange={(event) => set("exampleTranslation", event.target.value)} rows={2} /></label>
        <label className="field"><span>Perfekt biçimi</span><input value={form.perfectForm} onChange={(event) => set("perfectForm", event.target.value)} /></label>
        <label className="field"><span>Kullanıldığı edat</span><input value={form.governedPreposition} onChange={(event) => set("governedPreposition", event.target.value)} /></label>
        <label className="field"><span>Kaynak ünite</span><input value={form.sourceUnitTitle} onChange={(event) => set("sourceUnitTitle", event.target.value)} /></label>
        <label className="field"><span>Notlar</span><input value={form.notes} onChange={(event) => set("notes", event.target.value)} /></label>
      </div>
      <div className="placement-result-actions">
        <button type="submit" className="button button-primary" disabled={saving}>{saving ? "Kaydediliyor..." : "Kaydet"}</button>
        <button type="button" className="button button-secondary" onClick={onCancel}>İptal</button>
      </div>
    </form>
  );
}

function VocabularyItemCard({ item, onSpeak, onEdit, onDelete, onSuspend }: {
  item: VocabularyRecord;
  onSpeak: (text?: string | null) => void;
  onEdit: (item: VocabularyRecord) => void;
  onDelete: (id: string) => void;
  onSuspend: (item: VocabularyRecord) => void;
}) {
  return (
    <article className={`vocab-item-card ${item.suspended ? "suspended" : ""}`}>
      <div>
        <span className="eyebrow">{item.sourceUnitTitle || item.sourceSkill}</span>
        <h3>{item.article ? `${item.article} ` : ""}{item.word}</h3>
        <p>{item.translation}{item.plural ? ` · Plural: ${item.plural}` : ""}</p>
        {item.example ? <small>{item.example}</small> : null}
        <Progress value={item.mastery} label={`Ustalık · %${item.mastery}`} />
      </div>
      <div className="vocab-card-actions">
        <button title="Dinle" onClick={() => onSpeak(`${item.article ? `${item.article} ` : ""}${item.word}`)}><Volume2 size={17} /></button>
        <button title="Düzenle" onClick={() => onEdit(item)}><Edit3 size={17} /></button>
        <button title={item.suspended ? "Tekrarı aç" : "Tekrarı duraklat"} onClick={() => onSuspend(item)}><PauseCircle size={17} /></button>
        <button title="Sil" onClick={() => onDelete(item.id)}><Trash2 size={17} /></button>
      </div>
    </article>
  );
}

function StatsPanel({ stats, attempts }: { stats: VocabularyStats; attempts: VocabularyRecentAttempt[] }) {
  return (
    <section className="vocab-stats">
      <div className="panel">
        <h2>Öğrenme özeti</h2>
        <Progress value={stats.averageMastery} label={`Ortalama ustalık · %${stats.averageMastery}`} />
        <p>{stats.learning} kelime öğrenme aşamasında, {stats.mastered} kelimede ustalık sağlandı.</p>
      </div>
      <div className="panel">
        <h2>Son tekrarlar</h2>
        <div className="vocab-attempt-list">
          {attempts.map((attempt) => (
            <div key={attempt.id}>
              <strong>{attempt.word}</strong>
              <span>{modeLabels[attempt.mode] ?? attempt.mode}</span>
              <span>{attempt.correct ? "Doğru" : "Yanlış"}</span>
              {attempt.confidence ? <span>{attempt.confidence === "SURE" ? "Eminim" : "Emin değilim"}</span> : null}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return <div className="vocab-stat-card">{icon}<div><strong>{value}</strong><span>{label}</span></div></div>;
}
