"use client";

// V45_ACCESSIBLE_LISTENING_TRANSCRIPT
// V46_LISTENING_RESILIENCE

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  Check,
  CheckCircle2,
  Gauge,
  Headphones,
  Keyboard,
  Pause,
  Play,
  RotateCcw,
  Save,
  Sparkles,
  Volume2,
  XCircle,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { goldStandardListeningTasks } from "@/data/listening-gold-standard";
import type {
  LabLevel,
  ListeningTask,
  ListeningPlaybackMode,
  VocabularyItem,
} from "@/types/skills";
import { LevelTabs, TaskCards } from "@/components/skills/task-picker";
import { QuestionStep } from "@/components/skills/question-step";
import { Progress } from "@/components/ui/progress";

type Phase =
  | "PREP"
  | "LISTEN"
  | "QUESTIONS"
  | "DICTATION"
  | "SHADOWING"
  | "REVIEW"
  | "RESULT";

type DictationResult = {
  answer: string;
  similarity: number;
  checked: boolean;
};

const phaseProgress: Record<Phase, number> = {
  PREP: 8,
  LISTEN: 18,
  QUESTIONS: 45,
  DICTATION: 64,
  SHADOWING: 78,
  REVIEW: 90,
  RESULT: 100,
};

function normalizeGerman(value: string) {
  return value
    .toLocaleLowerCase("de-DE")
    .replace(/[„“"'.!?;,():]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function levenshtein(a: string, b: string) {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;

  const previous = Array.from({ length: b.length + 1 }, (_, index) => index);
  const current = new Array<number>(b.length + 1);

  for (let i = 1; i <= a.length; i += 1) {
    current[0] = i;
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      current[j] = Math.min(
        current[j - 1] + 1,
        previous[j] + 1,
        previous[j - 1] + cost,
      );
    }
    for (let j = 0; j <= b.length; j += 1) previous[j] = current[j];
  }

  return previous[b.length];
}

function textSimilarity(answer: string, target: string) {
  const a = normalizeGerman(answer);
  const b = normalizeGerman(target);
  if (!a && !b) return 1;
  if (!a || !b) return 0;
  const distance = levenshtein(a, b);
  return Math.max(0, 1 - distance / Math.max(a.length, b.length));
}

function stripSpeakerLabels(value: string) {
  return value
    .replace(/\b[\p{L}ÄÖÜäöüß-]{2,28}:\s*/gu, "")
    .replace(/[„“"]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function phaseLabel(phase: Phase) {
  if (phase === "PREP") return "Dinleme öncesi";
  if (phase === "LISTEN") return "Aktif dinleme";
  if (phase === "QUESTIONS") return "Anlama";
  if (phase === "DICTATION") return "Dikte";
  if (phase === "SHADOWING") return "Shadowing";
  if (phase === "REVIEW") return "Transkript kontrolü";
  return "Sonuç";
}

export function ListeningLab() {
  const { data: session } = useSession();
  const initialLevel = (session?.user.currentLevel ?? "A1") as LabLevel;
  const [level, setLevel] = useState<LabLevel>(initialLevel);

  const levelTasks = useMemo(
    () => goldStandardListeningTasks.filter((item) => item.level === level),
    [level],
  );

  const [task, setTask] = useState<ListeningTask>(
    levelTasks[0] ?? goldStandardListeningTasks[0],
  );
  const [phase, setPhase] = useState<Phase>("PREP");
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [checked, setChecked] = useState(false);
  const [playCount, setPlayCount] = useState(0);
  const [speaking, setSpeaking] = useState(false);
  const [lastPlaybackMode, setLastPlaybackMode] = useState<ListeningPlaybackMode>("NORMAL");
  const [playbackCounts, setPlaybackCounts] = useState<Record<ListeningPlaybackMode, number>>({
    NORMAL: 0,
    SLOW_75: 0,
    REPEAT: 0,
  });
  const [savedWords, setSavedWords] = useState<string[]>([]);
  const [saveState, setSaveState] = useState("");
  const [accessibleTranscriptOpened, setAccessibleTranscriptOpened] = useState(false);
  const [dictationIndex, setDictationIndex] = useState(0);
  const [dictationResults, setDictationResults] = useState<Record<number, DictationResult>>({});
  const [shadowIndex, setShadowIndex] = useState(0);
  const [shadowStep, setShadowStep] = useState<"LISTEN" | "REPEAT" | "RELISTEN">("LISTEN");
  const [shadowCompleted, setShadowCompleted] = useState(0);
  const startedAt = useRef(Date.now());

  const question = task.questions[questionIndex];
  const selected = question ? answers[question.id] : undefined;
  const correctCount = task.questions.filter(
    (item) => answers[item.id] === item.correctAnswer,
  ).length;
  const dictationSegments = task.dictationSegments ?? [];
  const shadowingSegments = task.shadowingSegments ?? [];
  const currentDictation = dictationSegments[dictationIndex] ?? "";
  const currentShadow = shadowingSegments[shadowIndex] ?? "";

  useEffect(() => {
    if (!levelTasks.length) return;
    if (task.level !== level) reset(levelTasks[0]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [level]);

  function chooseLevel(next: LabLevel) {
    setLevel(next);
    const nextTask =
      goldStandardListeningTasks.find((item) => item.level === next) ??
      goldStandardListeningTasks[0];
    reset(nextTask);
  }

  function reset(nextTask = task) {
    window.speechSynthesis?.cancel();
    setTask(nextTask);
    setPhase("PREP");
    setQuestionIndex(0);
    setAnswers({});
    setChecked(false);
    setPlayCount(0);
    setSpeaking(false);
    setLastPlaybackMode("NORMAL");
    setPlaybackCounts({ NORMAL: 0, SLOW_75: 0, REPEAT: 0 });
    setSavedWords([]);
    setSaveState("");
    setAccessibleTranscriptOpened(false);
    setDictationIndex(0);
    setDictationResults({});
    setShadowIndex(0);
    setShadowStep("LISTEN");
    setShadowCompleted(0);
    startedAt.current = Date.now();
  }

  function voiceForGerman() {
    return window.speechSynthesis
      ?.getVoices()
      .find((item) => item.lang.toLocaleLowerCase().startsWith("de"));
  }

  function speakText(
    text: string,
    mode: ListeningPlaybackMode = "NORMAL",
    explicitRate?: number,
    onEnd?: () => void,
  ) {
    if (!("speechSynthesis" in window)) {
      setSaveState("Tarayıcın sesli okuma özelliğini desteklemiyor.");
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(stripSpeakerLabels(text));
    utterance.lang = "de-DE";

    const normalRate = task.normalRate ?? 1;
    const slowRate = task.slowRate ?? Number((normalRate * 0.75).toFixed(2));
    const rate =
      explicitRate ??
      (mode === "SLOW_75"
        ? slowRate
        : mode === "REPEAT"
          ? lastPlaybackMode === "SLOW_75"
            ? slowRate
            : normalRate
          : normalRate);

    utterance.rate = rate;
    const voice = voiceForGerman();
    if (voice) utterance.voice = voice;

    utterance.onstart = () => {
      setSpeaking(true);
      setPlayCount((value) => value + 1);
      setPlaybackCounts((current) => ({
        ...current,
        [mode]: current[mode] + 1,
      }));
      if (mode !== "REPEAT") setLastPlaybackMode(mode);
    };
    utterance.onend = () => {
      setSpeaking(false);
      onEnd?.();
    };
    utterance.onerror = () => {
      setSpeaking(false);
      setSaveState(
        "Sesli okuma sırasında bir sorun oluştu. Metin alternatifini kullanabilir veya yeniden deneyebilirsin.",
      );
    };

    try {
      window.speechSynthesis.speak(utterance);
    } catch {
      setSpeaking(false);
      setSaveState(
        "Tarayıcı sesli okumayı başlatamadı. Metin alternatifini kullanabilir veya sayfayı yenileyip yeniden deneyebilirsin.",
      );
    }
  }

  function speakTask(mode: ListeningPlaybackMode) {
    speakText(task.transcript, mode);
  }

  function stop() {
    window.speechSynthesis?.cancel();
    setSpeaking(false);
  }

  function checkQuestion() {
    if (selected) setChecked(true);
  }

  function nextQuestion() {
    if (!checked) return;
    if (questionIndex < task.questions.length - 1) {
      setQuestionIndex((value) => value + 1);
      setChecked(false);
    } else {
      setPhase("DICTATION");
    }
  }

  function updateDictationAnswer(value: string) {
    setDictationResults((current) => ({
      ...current,
      [dictationIndex]: {
        answer: value,
        similarity: current[dictationIndex]?.similarity ?? 0,
        checked: false,
      },
    }));
  }

  function checkDictation() {
    const answer = dictationResults[dictationIndex]?.answer ?? "";
    const similarity = textSimilarity(answer, currentDictation);
    setDictationResults((current) => ({
      ...current,
      [dictationIndex]: { answer, similarity, checked: true },
    }));
  }

  function nextDictation() {
    if (dictationIndex < dictationSegments.length - 1) {
      setDictationIndex((value) => value + 1);
    } else {
      setPhase("SHADOWING");
    }
  }

  function playShadow() {
    speakText(
      currentShadow,
      lastPlaybackMode === "SLOW_75" ? "SLOW_75" : "NORMAL",
      undefined,
      () => setShadowStep("REPEAT"),
    );
  }

  function markShadowRepeated() {
    setShadowStep("RELISTEN");
  }

  function replayShadowAndAdvance() {
    speakText(currentShadow, "REPEAT", undefined, () => {
      const nextCompleted = Math.max(shadowCompleted, shadowIndex + 1);
      setShadowCompleted(nextCompleted);

      if (shadowIndex < shadowingSegments.length - 1) {
        setShadowIndex((value) => value + 1);
        setShadowStep("LISTEN");
      } else {
        setPhase("REVIEW");
      }
    });
  }

  async function saveWord(item: VocabularyItem) {
    const response = await fetch("/api/skills/vocabulary", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...item,
        sourceSkill: "LISTENING",
        sourceTaskId: task.id,
        sourceCourseId: task.level.toLowerCase(),
        sourceUnitTitle: task.title,
      }),
    });

    if (response.ok) {
      setSavedWords((values) => [...new Set([...values, item.word])]);
    }
  }

  function scoreBreakdown() {
    const comprehension =
      task.questions.length > 0
        ? Math.round((correctCount / task.questions.length) * 100)
        : 0;

    const checkedDictations = dictationSegments.map(
      (_, index) => dictationResults[index]?.similarity ?? 0,
    );
    const dictation =
      checkedDictations.length > 0
        ? Math.round(
            (checkedDictations.reduce((sum, value) => sum + value, 0) /
              checkedDictations.length) *
              100,
          )
        : 0;

    const shadowing =
      shadowingSegments.length > 0
        ? Math.round((shadowCompleted / shadowingSegments.length) * 100)
        : 100;

    return {
      comprehension,
      dictation,
      shadowing,
      overall: Math.round(comprehension * 0.7 + dictation * 0.2 + shadowing * 0.1),
    };
  }

  async function complete() {
    const scores = scoreBreakdown();
    setSaveState("Kaydediliyor...");

    const questionResults = task.questions.map((item) => ({
      questionId: item.id,
      masteryQuestionId: item.masteryQuestionId ?? item.id,
      masteryTags: item.masteryTags ?? [],
      kind: item.kind,
      correct: answers[item.id] === item.correctAnswer,
      selected: answers[item.id] ?? null,
    }));

    const response = await fetch("/api/skills/attempts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        skill: "LISTENING",
        taskId: task.id,
        level: task.level,
        score: scores.overall,
        durationSeconds: Math.round((Date.now() - startedAt.current) / 1000),
        answerPayload: {
          unitId: task.unitId,
          answers,
          playCount,
          playbackCounts,
          accessibleTranscriptOpened,
          dictationResults,
          shadowCompleted,
        },
        feedback: {
          sourceVersion: task.sourceVersion,
          unitId: task.unitId,
          accessibleTranscriptOpened,
          listeningScore: scores.overall,
          comprehensionScore: scores.comprehension,
          dictationScore: scores.dictation,
          shadowingCompletion: scores.shadowing,
          correctCount,
          questionCount: task.questions.length,
          questionResults,
        },
      }),
    });

    setSaveState(
      response.ok
        ? "Çalışma hesabına kaydedildi ve Dinleme Mastery verisine aktarıldı."
        : "Sonuç kaydedilemedi; tekrar deneyebilirsin.",
    );
    setPhase("RESULT");
  }

  const scores = scoreBreakdown();

  return (
    <div className="lab-page v39-listening">
      <div className="lab-page-head">
        <div>
          <span className="eyebrow">V39 · DİNLEME LABORATUVARI</span>
          <h1>Dinle, ayırt et, yaz ve sesle yeniden üret.</h1>
          <p>
            Gold Standard dinlemeleri artık ana fikir, ayrıntı, çıkarım, tutum,
            dikte ve shadowing ile gerçek bir beceri çalışmasına dönüşüyor.
          </p>
        </div>
        <Headphones size={42} />
      </div>

      <LevelTabs value={level} onChange={chooseLevel} />
      <TaskCards tasks={levelTasks} selectedId={task.id} onSelect={reset} />

      <Progress
        value={phaseProgress[phase]}
        label={`${phaseLabel(phase)} · %${phaseProgress[phase]}`}
      />

      <section className="v39-listening-meta">
        <span>
          <Sparkles size={16} />
          {task.sourceVersion} Gold Standard · {task.unitId?.toUpperCase()}
        </span>
        <span>
          <Gauge size={16} />
          {task.level === "A1" || task.level === "A2"
            ? "Öğrenen odaklı kontrollü tempo"
            : "Doğal konuşmaya yakın tempo"}
        </span>
        <span>
          <Headphones size={16} />
          {task.questions.length} anlama sorusu
        </span>
      </section>

      {phase === "PREP" ? (
        <section className="lab-stage v39-prelisten">
          <span className="eyebrow">0 · DİNLEMEDEN ÖNCE</span>
          <h2>{task.title}</h2>
          <p>
            Metni görmeden önce anahtar kelimelere göz at. Amaç metni tahmin
            etmek değil; ses içinde kritik kelimeleri daha hızlı tanımak.
          </p>

          <div className="v39-keywords">
            {(task.keywords ?? []).map((keyword) => (
              <article key={`${keyword.de}-${keyword.tr}`}>
                <strong>{keyword.de}</strong>
                <span>{keyword.tr}</span>
              </article>
            ))}
          </div>

          <div className="lab-actions">
            <button className="button button-primary" onClick={() => setPhase("LISTEN")}>
              Dinlemeye Geç <ArrowRight />
            </button>
          </div>
        </section>
      ) : null}

      {phase === "LISTEN" ? (
        <section className="lab-stage listening-intro v39-active-listen">
          <div className="audio-orb">
            <Volume2 size={38} />
          </div>
          <span className="eyebrow">1 · AKTİF DİNLEME · TRANSKRİPT KAPALI</span>
          <h2>{task.title}</h2>
          <p>{task.situation}</p>
          <small>Konuşmacı: {task.speakerHint}</small>

          <div className="v39-speed-controls" aria-label="Dinleme hızı">
            <button
              className={`button ${lastPlaybackMode === "NORMAL" ? "button-primary" : "button-secondary"}`}
              onClick={() => speakTask("NORMAL")}
            >
              <Play size={17} /> Normal hız
            </button>
            <button
              className={`button ${lastPlaybackMode === "SLOW_75" ? "button-primary" : "button-secondary"}`}
              onClick={() => speakTask("SLOW_75")}
            >
              <Gauge size={17} /> %75 hız
            </button>
            <button
              className="button button-secondary"
              disabled={!playCount}
              onClick={() => speakTask("REPEAT")}
            >
              <RotateCcw size={17} /> Tekrar dinle
            </button>
            {speaking ? (
              <button className="button button-secondary" onClick={stop}>
                <Pause size={17} /> Durdur
              </button>
            ) : null}
          </div>

          <p className="lab-note">
            {task.level === "A1" || task.level === "A2"
              ? "A1–A2 normal hızı anlaşılabilirlik için kontrollüdür; %75 seçeneği ek destek sağlar."
              : "B1–B2 normal hızı doğal konuşma temposuna yakındır; %75 seçeneğini yalnız gerektiğinde kullan."}
          </p>

          <details
            className="v45-accessible-transcript"
            onToggle={(event) => {
              if (event.currentTarget.open) setAccessibleTranscriptOpened(true);
            }}
          >
            <summary>Erişilebilir transkript / metin alternatifi</summary>
            <p className="lab-note">
              İşitsel içeriğe metin alternatifi gerekiyorsa transkripti açabilirsin.
              Sistem bu kullanım sinyalini çalışma kanıtına ekler.
            </p>
            <p className="lab-long-text" lang="de">{task.transcript}</p>
            <details>
              <summary>Türkçe çeviriyi göster</summary>
              <p className="lab-long-text" lang="tr">{task.translation}</p>
            </details>
          </details>

          <div className="lab-actions">
            <button
              className="button button-primary"
              disabled={!playCount}
              onClick={() => setPhase("QUESTIONS")}
            >
              Anlama Sorularına Geç <ArrowRight />
            </button>
          </div>
          {saveState ? <p className="lab-note" role="status" aria-live="polite">{saveState}</p> : null}
        </section>
      ) : null}

      {phase === "QUESTIONS" && question ? (
        <section className="lab-stage">
          <div className="lab-step-meta">
            <span>
              Soru {questionIndex + 1}/{task.questions.length}
            </span>
            <small>Toplam dinleme: {playCount} kez</small>
          </div>

          <QuestionStep
            question={question}
            selected={selected}
            checked={checked}
            onSelect={(value) =>
              setAnswers((current) => ({ ...current, [question.id]: value }))
            }
          />

          <div className="lab-actions split">
            <div className="v39-question-audio">
              <button className="button button-secondary" onClick={() => speakTask("NORMAL")}>
                <Play size={17} /> Normal
              </button>
              <button className="button button-secondary" onClick={() => speakTask("SLOW_75")}>
                <Gauge size={17} /> %75
              </button>
              <button className="button button-secondary" onClick={() => speakTask("REPEAT")}>
                <RotateCcw size={17} /> Tekrar
              </button>
            </div>

            {checked ? (
              <button className="button button-primary" onClick={nextQuestion}>
                {questionIndex === task.questions.length - 1
                  ? "Dikte Moduna Geç"
                  : "Sonraki Soru"}
                <ArrowRight />
              </button>
            ) : (
              <button
                className="button button-primary"
                disabled={!selected}
                onClick={checkQuestion}
              >
                Kontrol Et
              </button>
            )}
          </div>
        </section>
      ) : null}

      {phase === "DICTATION" ? (
        <section className="lab-stage v39-dictation">
          <span className="eyebrow">3 · DİKTE MODU</span>
          <h2>Duyduğunu yaz.</h2>
          <p>
            Cümle ekranda görünmeden dinle. Yazdıktan sonra sistem yazım
            benzerliğini kontrol eder.
          </p>

          <div className="v39-dictation-card">
            <div className="lab-step-meta">
              <span>
                Dikte {dictationIndex + 1}/{Math.max(1, dictationSegments.length)}
              </span>
              <small>
                {lastPlaybackMode === "SLOW_75" ? "%75 tempo" : "Normal tempo"}
              </small>
            </div>

            <button
              className="button button-primary"
              onClick={() =>
                speakText(
                  currentDictation,
                  lastPlaybackMode === "SLOW_75" ? "SLOW_75" : "NORMAL",
                )
              }
            >
              <Headphones size={18} /> Cümleyi Dinle
            </button>

            <label className="v39-dictation-input">
              <span>Almanca olarak yaz</span>
              <textarea
                rows={3}
                spellCheck={false}
                value={dictationResults[dictationIndex]?.answer ?? ""}
                disabled={dictationResults[dictationIndex]?.checked}
                onChange={(event) => updateDictationAnswer(event.target.value)}
                placeholder="Duyduğun cümleyi buraya yaz..."
              />
            </label>

            {dictationResults[dictationIndex]?.checked ? (
              <div
                className={`lab-feedback ${
                  (dictationResults[dictationIndex]?.similarity ?? 0) >= 0.85
                    ? "correct"
                    : "wrong"
                }`}
              >
                {(dictationResults[dictationIndex]?.similarity ?? 0) >= 0.85 ? (
                  <CheckCircle2 />
                ) : (
                  <XCircle />
                )}
                <div>
                  <strong>
                    Yazım benzerliği %
                    {Math.round((dictationResults[dictationIndex]?.similarity ?? 0) * 100)}
                  </strong>
                  <p>
                    Doğru cümle: <b>{currentDictation}</b>
                  </p>
                </div>
              </div>
            ) : null}
          </div>

          <div className="lab-actions end">
            {!dictationResults[dictationIndex]?.checked ? (
              <button
                className="button button-primary"
                disabled={!dictationResults[dictationIndex]?.answer?.trim()}
                onClick={checkDictation}
              >
                Dikteyi Kontrol Et
              </button>
            ) : (
              <button className="button button-primary" onClick={nextDictation}>
                {dictationIndex === dictationSegments.length - 1
                  ? "Shadowing Moduna Geç"
                  : "Sonraki Dikte"}
                <ArrowRight />
              </button>
            )}
          </div>
        </section>
      ) : null}

      {phase === "SHADOWING" ? (
        <section className="lab-stage v39-shadowing">
          <span className="eyebrow">4 · SHADOWING MODU</span>
          <h2>Dinle → tekrar et → yeniden dinle.</h2>
          <p>
            Amaç hız yarışı değil; ritim, kelime grupları ve cümle akışını
            Almanca ses örneğiyle eşleştirmek.
          </p>

          <div className="v39-shadow-card">
            <div className="lab-step-meta">
              <span>
                Shadowing {shadowIndex + 1}/{Math.max(1, shadowingSegments.length)}
              </span>
              <small>
                Bu sürüm telaffuza otomatik puan vermez; tekrar döngüsünü ölçer.
              </small>
            </div>

            {shadowStep === "LISTEN" ? (
              <>
                <div className="v39-shadow-hidden">
                  <Headphones size={32} />
                  <strong>Önce metne bakmadan dinle.</strong>
                </div>
                <button className="button button-primary" onClick={playShadow}>
                  <Play size={17} /> 1. Dinle
                </button>
              </>
            ) : null}

            {shadowStep === "REPEAT" ? (
              <>
                <blockquote>{currentShadow}</blockquote>
                <p>Şimdi cümleyi sesli olarak konuşmacının ritmini taklit ederek tekrar et.</p>
                <button className="button button-primary" onClick={markShadowRepeated}>
                  <Volume2 size={17} /> 2. Sesli Tekrar Ettim
                </button>
              </>
            ) : null}

            {shadowStep === "RELISTEN" ? (
              <>
                <blockquote>{currentShadow}</blockquote>
                <p>
                  Kendi üretiminle ses örneğini karşılaştırmak için aynı bölümü
                  yeniden dinle.
                </p>
                <button className="button button-primary" onClick={replayShadowAndAdvance}>
                  <RotateCcw size={17} /> 3. Yeniden Dinle ve Devam Et
                </button>
              </>
            ) : null}
          </div>
        </section>
      ) : null}

      {phase === "REVIEW" ? (
        <section className="lab-review v39-review">
          <article className="panel">
            <span className="eyebrow">ALMANCA TRANSKRİPT</span>
            <h2>{task.title}</h2>
            <p className="lab-long-text" lang="de">{task.transcript}</p>
            <div className="v39-speed-controls">
              <button className="button button-secondary" onClick={() => speakTask("NORMAL")}>
                <Volume2 size={17} /> Normal hız
              </button>
              <button className="button button-secondary" onClick={() => speakTask("SLOW_75")}>
                <Gauge size={17} /> %75 hız
              </button>
              <button className="button button-secondary" onClick={() => speakTask("REPEAT")}>
                <RotateCcw size={17} /> Tekrar dinle
              </button>
            </div>
          </article>

          <article className="panel translation-panel">
            <span className="eyebrow">TÜRKÇE ÇEVİRİ</span>
            <p className="lab-long-text" lang="tr">{task.translation}</p>
          </article>

          <section className="panel">
            <div className="section-head">
              <div>
                <span className="eyebrow">ANAHTAR KELİMELER</span>
                <h2>Dinleme kelimelerini kişisel defterine ekle</h2>
              </div>
            </div>

            <div className="lab-vocabulary">
              {task.vocabulary.map((item) => (
                <article key={`${item.word}-${item.translation}`}>
                  <div>
                    <strong>
                      {item.article ? `${item.article} ` : ""}
                      {item.word}
                    </strong>
                    <span>{item.translation}</span>
                  </div>
                  <button
                    className="button button-secondary"
                    disabled={savedWords.includes(item.word)}
                    onClick={() => saveWord(item)}
                  >
                    {savedWords.includes(item.word) ? (
                      <>
                        <Check /> Eklendi
                      </>
                    ) : (
                      <>
                        <Save /> Kelimeye Ekle
                      </>
                    )}
                  </button>
                </article>
              ))}
            </div>

            <div className="lab-actions end">
              <button className="button button-primary" onClick={complete}>
                Çalışmayı Tamamla <ArrowRight />
              </button>
            </div>
          </section>
        </section>
      ) : null}

      {phase === "RESULT" ? (
        <section className="lab-result v39-result">
          <div className="result-score">
            <strong>%{scores.overall}</strong>
            <span>Dinleme yeterliği</span>
          </div>

          <div>
            <span className="eyebrow">V39 ÇALIŞMASI TAMAMLANDI</span>
            <h2>
              {correctCount}/{task.questions.length} anlama sorusu doğru
            </h2>

            <div className="v39-score-grid">
              <article>
                <strong>%{scores.comprehension}</strong>
                <span>Anlama</span>
              </article>
              <article>
                <strong>%{scores.dictation}</strong>
                <span>Dikte</span>
              </article>
              <article>
                <strong>%{scores.shadowing}</strong>
                <span>Shadowing döngüsü</span>
              </article>
            </div>

            <p>
              Sonuç yalnız “kaç soruyu doğru yaptın?” üzerinden değil; anlama ve
              dikte performansın ile shadowing çalışma tamamlama oranını birlikte
              gösterir.
            </p>
            <p className="lab-note" role="status" aria-live="polite">{saveState}</p>

            <div className="lab-actions">
              <button className="button button-primary" onClick={() => reset(task)}>
                <RotateCcw /> Aynı Görevi Tekrarla
              </button>
              <button
                className="button button-secondary"
                onClick={() => {
                  const index = levelTasks.findIndex((item) => item.id === task.id);
                  reset(levelTasks[(index + 1) % levelTasks.length]);
                }}
              >
                Sonraki Görev <ArrowRight />
              </button>
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
}
