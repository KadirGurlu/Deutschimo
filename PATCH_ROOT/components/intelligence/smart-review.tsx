"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  CircleAlert,
  Clock3,
  RefreshCw,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { AdaptiveReviewControls } from "@/components/review/adaptive-review-controls";
import type {
  ReviewAnswerResult,
  ReviewConfidence,
  ReviewItem,
} from "@/types/intelligence";

type PersonalizationSummary = {
  errorHistory: number;
  weakTopics: number;
  recentMistakes: number;
};

type ReviewPayload = {
  items: ReviewItem[];
  completedIds: string[];
  attempts: Record<string, number>;
  total: number;
  completed: number;
  personalization: PersonalizationSummary;
  error?: string;
};

const sourceLabels: Record<ReviewItem["sourceType"], string> = {
  ERROR_HISTORY: "Hata geçmişinden",
  INSIGHT: "Zayıf konu analizinden",
  EXERCISE: "Son yanlışından",
  QUIZ: "Ünite değerlendirmesinden",
};

const priorityLabels: Record<NonNullable<ReviewItem["priority"]>, string> = {
  CRITICAL: "Öncelikli",
  HIGH: "Yüksek öncelik",
  MEDIUM: "Tekrar edilmeli",
};

const modeLabels: Record<NonNullable<ReviewItem["reviewMode"]>, string> = {
  MULTIPLE_CHOICE: "Çoktan seçmeli",
  TRUE_FALSE: "Doğru / yanlış",
  FILL_BLANK: "Boşluğu doldur",
  TRANSLATION: "Çeviri",
  NEW_SENTENCE: "Yeni cümlede kullan",
  CONCEPT: "Kuralı açıkla",
};

export function SmartReview() {
  const [payload, setPayload] = useState<ReviewPayload | null>(null);
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState<unknown>("");
  const [feedback, setFeedback] = useState<ReviewAnswerResult | null>(null);
  const [confidence, setConfidence] = useState<ReviewConfidence | null>(null);
  const [hintUsed, setHintUsed] = useState(false);
  const [startedAt, setStartedAt] = useState(Date.now());
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  function resetAttempt() {
    setFeedback(null);
    setAnswer("");
    setConfidence(null);
    setHintUsed(false);
    setStartedAt(Date.now());
  }

  async function load(refresh = false) {
    setLoading(true);
    setError("");
    resetAttempt();
    setIndex(0);
    try {
      const response = await fetch(`/api/intelligence/review${refresh ? "?refresh=1" : ""}`, { cache: "no-store" });
      const result = await response.json() as ReviewPayload;
      if (!response.ok) throw new Error(result.error ?? "Tekrar listesi getirilemedi.");
      setPayload(result);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Tekrar listesi getirilemedi.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);

  const pendingItems = useMemo(
    () => payload?.items.filter((item) => !payload.completedIds.includes(item.id)) ?? [],
    [payload],
  );
  const current = pendingItems[index];
  const completionPercent = payload?.total ? Math.round((payload.completed / payload.total) * 100) : 0;

  async function check() {
    if (!current) return;
    if (!confidence) {
      setError("Cevabı göndermeden önce ‘Eminim’ veya ‘Emin değilim’ seçimini yap.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const response = await fetch("/api/intelligence/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemId: current.id,
          answer,
          responseMs: Date.now() - startedAt,
          hintUsed,
          confidence,
        }),
      });
      const result = await response.json() as { result?: ReviewAnswerResult; error?: string };
      if (!response.ok || !result.result) throw new Error(result.error ?? "Cevap kontrol edilemedi.");
      setFeedback(result.result);
      if (result.result.correct) {
        setPayload((previous) => previous ? {
          ...previous,
          completed: Math.min(previous.total, previous.completed + 1),
          completedIds: Array.from(new Set([...previous.completedIds, current.id])),
        } : previous);
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Cevap kontrol edilemedi.");
    } finally {
      setSubmitting(false);
    }
  }

  function next() {
    resetAttempt();
    if (index >= pendingItems.length - 1) setIndex(0);
  }

  if (loading) return (
    <section className="panel intelligence-loading">
      <RotateCcw className="spin-soft" />
      <h2>Kişisel tekrar sıran hazırlanıyor</h2>
      <p>Doğruluk, hız, ipucu, hata geçmişi, zorluk ve güven seçimi birlikte değerlendiriliyor.</p>
    </section>
  );

  if (error && !payload) return (
    <section className="panel">
      <div className="auth-message auth-error">{error}</div>
      <button className="button button-secondary" onClick={() => load()}><RefreshCw size={17} />Tekrar Dene</button>
    </section>
  );

  if (!payload || payload.total === 0) return (
    <section className="intelligence-empty">
      <CheckCircle2 size={42} />
      <div>
        <h2>Kişisel tekrar kuyruğun temiz</h2>
        <p>Şu anda zamanı gelmiş açık hata veya zayıf öğrenme hedefi bulunmuyor.</p>
        <Link className="button button-primary" href="/dashboard">Öğrenci Paneline Dön</Link>
      </div>
    </section>
  );

  if (!current) return (
    <section className="placement-result-card">
      <div className="placement-result-level">
        <CheckCircle2 />
        <small>Bugünkü kişisel tekrar</small>
        <strong>%100</strong>
        <span>{payload.total} öğe tamamlandı</span>
      </div>
      <div className="placement-result-content">
        <span className="eyebrow">AKILLI TEKRAR 2.0 TAMAMLANDI</span>
        <h1>Zayıf noktalarını hedefleyerek aktif hatırlama yaptın.</h1>
        <p>Her öğe, verdiğin sinyallere göre kendi uygun tekrar tarihine yerleştirildi.</p>
        <div className="placement-result-actions">
          <Link className="button button-primary" href="/study-plan">Günlük Plana Dön</Link>
          <button className="button button-secondary" onClick={() => load(true)}><RefreshCw size={17} />Kuyruğu Yenile</button>
        </div>
      </div>
    </section>
  );

  const canSubmit = typeof answer === "string"
    ? answer.trim().length > 0
    : typeof answer === "boolean";
  const personalization = payload.personalization ?? { errorHistory: 0, weakTopics: 0, recentMistakes: 0 };

  return (
    <section className="review-shell">
      <div className="review-header">
        <div>
          <span className="eyebrow">V28.3 · KİŞİSEL AKILLI TEKRAR</span>
          <h2>{current.unitTitle}</h2>
          <p>{current.skill}</p>
        </div>
        <div><strong>{payload.completed}/{payload.total}</strong><span>tamamlandı</span></div>
      </div>

      <div className="review-personalization" aria-label="Tekrar sırasının kaynakları">
        <span><CircleAlert size={16} />{personalization.errorHistory} açık hata</span>
        <span><Sparkles size={16} />{personalization.weakTopics} zayıf konu</span>
        <span><RotateCcw size={16} />{personalization.recentMistakes} son yanlış</span>
      </div>

      <Progress value={completionPercent} label={`Tekrar ilerlemesi · %${completionPercent}`} />
      <article className="review-card">
        <div className="review-meta">
          <span className="level-badge">{current.courseId.toUpperCase()}</span>
          <span>{sourceLabels[current.sourceType]}</span>
          {current.reviewMode ? <span>{modeLabels[current.reviewMode]}</span> : null}
          {current.priority ? <span className={`review-priority priority-${current.priority.toLowerCase()}`}>{priorityLabels[current.priority]}</span> : null}
        </div>

        <div className="review-personalization" aria-label="Uyarlanabilir tekrar sinyalleri">
          <span><Sparkles size={16} />Zorluk {current.difficulty ?? 3}/5</span>
          <span><Clock3 size={16} />Hedef {current.expectedSeconds ?? 25} sn</span>
          <span><CheckCircle2 size={16} />Ustalık %{current.mastery ?? 0}</span>
          {(current.sameErrorStreak ?? 0) > 0 ? <span><RotateCcw size={16} />Aynı hata ×{current.sameErrorStreak}</span> : null}
        </div>

        {current.reason ? <p className="review-reason">{current.reason}</p> : null}
        <h2>{current.prompt}</h2>

        {current.type === "MULTIPLE_CHOICE" ? (
          <div className="placement-options">
            {current.options?.map((item, optionIndex) => (
              <button
                key={item.id}
                className={answer === item.value ? "selected" : ""}
                onClick={() => { setAnswer(item.value); setFeedback(null); }}
              >
                <span>{String.fromCharCode(65 + optionIndex)}</span>{item.label}
              </button>
            ))}
          </div>
        ) : current.type === "TRUE_FALSE" ? (
          <div className="placement-options two">
            <button className={answer === true ? "selected" : ""} onClick={() => { setAnswer(true); setFeedback(null); }}>Doğru</button>
            <button className={answer === false ? "selected" : ""} onClick={() => { setAnswer(false); setFeedback(null); }}>Yanlış</button>
          </div>
        ) : current.type === "CONCEPT" ? (
          <div className="concept-review">
            <CircleAlert />
            <p>İlgili kuralı incele ve öğrendiğini kendi Almanca örneğinle aktif olarak üret.</p>
            <Link className="button button-secondary" href={current.href}>Ders Notlarını Aç<ArrowRight size={17} /></Link>
            <label className="field">
              <span>Kendi Almanca örneğin</span>
              <textarea
                rows={3}
                value={typeof answer === "string" ? answer : ""}
                onChange={(event) => { setAnswer(event.target.value); setFeedback(null); }}
                placeholder="Örnek bir Almanca cümle yaz"
              />
            </label>
          </div>
        ) : (
          <label className="field">
            <span>Cevabın</span>
            <input
              value={typeof answer === "string" ? answer : ""}
              onChange={(event) => { setAnswer(event.target.value); setFeedback(null); }}
              placeholder="Cevabını yaz"
            />
          </label>
        )}

        <AdaptiveReviewControls
          confidence={confidence}
          onConfidenceChange={setConfidence}
          hint={current.hint}
          hintUsed={hintUsed}
          onUseHint={() => setHintUsed(true)}
          disabled={submitting || Boolean(feedback)}
        />

        {feedback ? (
          <div className={`review-feedback ${feedback.correct ? "correct" : "wrong"}`}>
            <strong>{feedback.correct ? "Doğru cevap" : "Tekrar dene"}</strong>
            <p>{feedback.explanation}</p>
            {feedback.correctAnswer !== undefined ? <small>Doğru cevap: {String(feedback.correctAnswer)}</small> : null}
            {feedback.schedule ? (
              <div>
                <small>Sonraki tekrar: <strong>{feedback.schedule.label}</strong> · Ustalık %{feedback.schedule.mastery}</small>
                {feedback.schedule.explanations[0] ? <p>{feedback.schedule.explanations[0]}</p> : null}
              </div>
            ) : null}
          </div>
        ) : null}

        {error ? <div className="auth-message auth-error">{error}</div> : null}
        <div className="review-actions">
          {!feedback ? (
            <button className="button button-primary" disabled={!canSubmit || !confidence || submitting} onClick={check}>
              {submitting ? "Kontrol ediliyor..." : "Cevabı Kontrol Et"}
            </button>
          ) : (
            <button className="button button-primary" onClick={next}>
              {feedback.correct ? "Sıradaki Tekrar" : "Yeniden Dene"}<ArrowRight size={17} />
            </button>
          )}
        </div>
      </article>
    </section>
  );
}
