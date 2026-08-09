"use client";

// V45_ACCESSIBLE_SPEAKING_STATUS
// V46_SPEAKING_RESILIENCE

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  Mic2,
  MicOff,
  RotateCcw,
  Sparkles,
  Volume2,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { speakingTasks } from "@/data/skill-labs";
import { evaluateSpeaking } from "@/lib/skills/evaluation";
import type { LabLevel, SpeakingEvaluation, SpeakingTask } from "@/types/skills";
import { LevelTabs, TaskCards } from "@/components/skills/task-picker";
import { Progress } from "@/components/ui/progress";

interface RecognitionAlternativeLike {
  transcript: string;
  confidence: number;
}
interface RecognitionResultLike {
  isFinal: boolean;
  length: number;
  [index: number]: RecognitionAlternativeLike;
}
interface RecognitionEventLike {
  resultIndex: number;
  results: { length: number; [index: number]: RecognitionResultLike };
}
interface RecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: RecognitionEventLike) => void) | null;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onerror: ((event: { error?: string; message?: string }) => void) | null;
  start(): void;
  stop(): void;
}
type RecognitionConstructor = new () => RecognitionLike;

declare global {
  interface Window {
    SpeechRecognition?: RecognitionConstructor;
    webkitSpeechRecognition?: RecognitionConstructor;
  }
}

export function SpeakingLab() {
  const { data: session } = useSession();
  const initialLevel = (session?.user.currentLevel ?? "A1") as LabLevel;
  const [level, setLevel] = useState<LabLevel>(initialLevel);
  const levelTasks = useMemo(
    () => speakingTasks.filter((item) => item.level === level),
    [level],
  );
  const [task, setTask] = useState<SpeakingTask>(levelTasks[0] ?? speakingTasks[0]);
  const [transcript, setTranscript] = useState("");
  const [interim, setInterim] = useState("");
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [confidence, setConfidence] = useState(0.68);
  const [evaluation, setEvaluation] = useState<SpeakingEvaluation | null>(null);
  const [status, setStatus] = useState("");
  const [manuallyEdited, setManuallyEdited] = useState(false);
  const recognitionRef = useRef<RecognitionLike | null>(null);
  const startedAt = useRef<number | null>(null);

  useEffect(() => {
    if (!recording) return;
    const timer = window.setInterval(() => setSeconds((value) => value + 1), 1000);
    return () => window.clearInterval(timer);
  }, [recording]);

  useEffect(() => () => recognitionRef.current?.stop(), []);

  function reset(nextTask = task) {
    recognitionRef.current?.stop();
    window.speechSynthesis?.cancel();
    setTask(nextTask);
    setTranscript("");
    setInterim("");
    setRecording(false);
    setSeconds(0);
    setConfidence(0.68);
    setEvaluation(null);
    setStatus("");
    setManuallyEdited(false);
    startedAt.current = null;
  }

  function chooseLevel(next: LabLevel) {
    setLevel(next);
    reset(speakingTasks.find((item) => item.level === next) ?? speakingTasks[0]);
  }

  function speakModel() {
    if (!("speechSynthesis" in window)) {
      setStatus("Tarayıcın model yanıtı sesli okumayı desteklemiyor.");
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(task.modelAnswer);
    utterance.lang = "de-DE";
    utterance.rate =
      task.level === "A1" ? 0.82 :
      task.level === "A2" ? 0.90 :
      task.level === "B1" ? 0.96 : 1.0;
    const voice = window.speechSynthesis
      .getVoices()
      .find((item) => item.lang.toLocaleLowerCase().startsWith("de"));
    if (voice) utterance.voice = voice;
    window.speechSynthesis.speak(utterance);
  }

  function startRecording() {
    const Constructor = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    if (!Constructor) {
      setStatus(
        "Bu tarayıcı otomatik Almanca ses tanımayı desteklemiyor. Chrome veya Edge kullanabilir ya da konuşma metnini elle yazabilirsin.",
      );
      return;
    }

    setEvaluation(null);
    setStatus("");
    setInterim("");
    setManuallyEdited(false);
    startedAt.current = Date.now();
    setSeconds(0);

    const recognition = new Constructor();
    recognition.lang = "de-DE";
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onstart = () => setRecording(true);
    recognition.onresult = (event) => {
      let finalText = "";
      let interimText = "";
      const confidenceValues: number[] = [];

      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i];
        const alternative = result[0];
        if (!alternative) continue;

        if (result.isFinal) {
          finalText += `${alternative.transcript} `;
          if (alternative.confidence > 0) confidenceValues.push(alternative.confidence);
        } else {
          interimText += alternative.transcript;
        }
      }

      if (finalText) {
        setTranscript((current) => `${current} ${finalText}`.trim());
      }
      setInterim(interimText);

      if (confidenceValues.length) {
        setConfidence(
          confidenceValues.reduce((sum, value) => sum + value, 0) /
            confidenceValues.length,
        );
      }
    };
    recognition.onerror = (event) => {
      setRecording(false);
      const code = String(event?.error ?? "").toLowerCase();
      if (code === "not-allowed" || code === "service-not-allowed") {
        setStatus(
          "Mikrofon izni verilmedi. Tarayıcı ayarlarından izin verebilir veya konuşma metnini aşağıdaki alana elle yazıp değerlendirmeye devam edebilirsin.",
        );
      } else if (code === "audio-capture") {
        setStatus(
          "Kullanılabilir bir mikrofon bulunamadı. Cihaz bağlantını kontrol edebilir veya konuşma metnini elle yazabilirsin.",
        );
      } else if (code === "network") {
        setStatus(
          "Ses tanıma servisine bağlanılamadı. İnternet bağlantını kontrol edip yeniden deneyebilir veya metni elle yazabilirsin.",
        );
      } else if (code === "no-speech") {
        setStatus(
          "Herhangi bir konuşma algılanmadı. Mikrofonu yeniden başlatabilir veya metni elle yazabilirsin.",
        );
      } else {
        setStatus(
          "Mikrofon veya ses tanıma sırasında sorun oluştu. Mikrofon iznini ve ortam gürültüsünü kontrol edip yeniden deneyebilir ya da metni elle yazabilirsin.",
        );
      }
    };
    recognition.onend = () => setRecording(false);

    recognitionRef.current = recognition;
    try {
      recognition.start();
    } catch {
      setRecording(false);
      setStatus(
        "Ses tanıma başlatılamadı. Mikrofon iznini kontrol edip yeniden deneyebilir veya konuşma metnini elle yazabilirsin.",
      );
    }
  }

  function stopRecording() {
    recognitionRef.current?.stop();
    setRecording(false);
    if (startedAt.current) {
      setSeconds(
        Math.max(
          seconds,
          Math.round((Date.now() - startedAt.current) / 1000),
        ),
      );
    }
  }

  async function evaluate() {
    const cleanTranscript = transcript.trim();
    const result = evaluateSpeaking(
      task,
      cleanTranscript,
      Math.max(seconds, 1),
      confidence,
      manuallyEdited,
    );
    setEvaluation(result);
    setStatus("Sonuç kaydediliyor...");

    const response = await fetch("/api/skills/attempts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        skill: "SPEAKING",
        taskId: task.id,
        level: task.level,
        score: result.overall,
        durationSeconds: Math.max(seconds, 1),
        transcript: cleanTranscript,
        answerPayload: {
          recognitionConfidence: confidence,
          manuallyEdited,
          wordsPerMinute: result.metrics.wordsPerMinute,
          pronunciationBand: result.pronunciation.band,
          evaluatorVersion: "V40",
        },
        feedback: result,
      }),
    });

    setStatus(
      response.ok
        ? "Konuşma çalışması hesabına kaydedildi."
        : "Değerlendirme gösterildi ancak sunucuya kaydedilemedi.",
    );
  }

  return (
    <div className="lab-page v40-speaking-lab">
      <div className="lab-page-head">
        <div>
          <span className="eyebrow">V40 · KONUŞMA LABORATUVARI</span>
          <h1>Konuş, anlaşıl ve daha doğal hale getir.</h1>
          <p>
            Seviyene uygun gerçek yaşam görevinde hazırlan, mikrofonla Almanca konuş,
            konuşmanı metne dönüştür ve iletişim odaklı geri bildirim al. Tek bir
            yapay telaffuz puanı yerine anlaşılabilirlik, akıcılık, kelime seçimi,
            gramer ve görevi tamamlama birlikte değerlendirilir.
          </p>
        </div>
        <Mic2 size={42} />
      </div>

      <div className="v40-speaking-principles" aria-label="Konuşma değerlendirme alanları">
        {[
          "Anlaşılırlık",
          "Akıcılık",
          "Kelime seçimi",
          "Gramer",
          "Görevi tamamlama",
          "Telaffuz geri bildirimi",
        ].map((item) => <span key={item}>{item}</span>)}
      </div>

      <LevelTabs value={level} onChange={chooseLevel} />
      <TaskCards tasks={levelTasks} selectedId={task.id} onSelect={reset} />

      <section className="speaking-layout">
        <article className="panel speaking-task-panel">
          <span className="eyebrow">{task.level} · KONUŞMA GÖREVİ</span>
          <h2>{task.title}</h2>
          <p className="speaking-situation">{task.situation}</p>

          <div className="speaking-prompt">
            <strong>Görev</strong>
            <p>{task.prompt}</p>
          </div>

          <h3>İletişim hedefleri</h3>
          <div className="v40-goal-grid">
            {task.communicationGoals.map((goal) => (
              <span key={goal.id}><CheckCircle2 size={16} />{goal.label}</span>
            ))}
          </div>

          <h3>Hazırlık iskeleti</h3>
          <ul className="speaking-preparation">
            {task.preparation.map((item) => (
              <li key={item}><CheckCircle2 size={17} />{item}</li>
            ))}
          </ul>

          <div className="v40-speaking-targets">
            <div>
              <strong>Gramer / yapı hedefleri</strong>
              <div className="v40-chip-list">
                {task.grammarTargets.map((item) => <span key={item}>{item}</span>)}
              </div>
            </div>
            <div>
              <strong>Telaffuz provası</strong>
              <div className="v40-chip-list">
                {task.pronunciationTargets.map((item) => <span key={item}>{item}</span>)}
              </div>
            </div>
          </div>

          <div className="lab-actions">
            <button className="button button-secondary" onClick={speakModel}>
              <Volume2 size={18} />Model Yanıtı Dinle
            </button>
          </div>
        </article>

        <article className="panel recorder-panel">
          <div className={`recording-orb ${recording ? "active" : ""}`} aria-hidden="true">
            {recording ? <Mic2 size={42} /> : <MicOff size={42} />}
          </div>
          <h2 aria-live="polite">{recording ? "Dinliyorum..." : "Konuşmaya hazır mısın?"}</h2>
          <p>
            {recording
              ? "Almanca konuş. Bitirdiğinde kaydı durdur."
              : `Hedef süre yaklaşık ${task.estimatedSeconds} saniye.`}
          </p>
          <strong className="recording-time">
            {String(Math.floor(seconds / 60)).padStart(2, "0")}:
            {String(seconds % 60).padStart(2, "0")}
          </strong>
          <button
            className={`button ${recording ? "button-danger" : "button-primary"}`}
            type="button"
            aria-pressed={recording}
            aria-label={recording ? "Mikrofon kaydını durdur" : "Mikrofonla Almanca konuşmayı başlat"}
            onClick={recording ? stopRecording : startRecording}
          >
            {recording
              ? <><MicOff />Kaydı Durdur</>
              : <><Mic2 />Mikrofonu Başlat</>}
          </button>
          <small>
            Ses dosyası yüklenmez; tarayıcı konuşmayı metne dönüştürür.
          </small>
        </article>
      </section>

      <section className="panel transcript-panel">
        <div className="section-head">
          <div>
            <span className="eyebrow">KONUŞMA METNİ</span>
            <h2>Tarayıcının algıladığı metni kontrol et</h2>
          </div>
          <span className="level-badge">
            Tanıma sinyali %{Math.round(confidence * 100)}
          </span>
        </div>

        <textarea
          className="editor speaking-editor"
          aria-label="Konuşma metni"
          value={`${transcript}${interim ? ` ${interim}` : ""}`}
          onChange={(event) => {
            setTranscript(event.target.value);
            setInterim("");
            setManuallyEdited(true);
          }}
          placeholder={"Konuşma burada yazıya dönüşür.\nDeğerlendirmeden önce yalnızca açık ses tanıma hatalarını düzeltebilirsin."}
          spellCheck={false}
        />

        <p className="v40-evidence-note">
          Tanıma güveni bir fonetik telaffuz notu değildir. Metni elle değiştirirsen
          sistem telaffuz geri bildirimini daha temkinli yorumlar.
        </p>

        <div className="lab-actions end">
          <button
            className="button button-primary"
            disabled={!transcript.trim() || recording}
            onClick={evaluate}
          >
            <Sparkles />Konuşmayı Değerlendir
          </button>
        </div>
        {status ? <p className="lab-note" role="status" aria-live="polite">{status}</p> : null}
      </section>

      {evaluation ? (
        <section className="v40-speaking-result">
          <div className="v40-result-top">
            <div className="result-score">
              <strong>%{evaluation.overall}</strong>
              <span>Genel iletişim başarısı</span>
            </div>
            <article className="panel v40-result-summary">
              <span className="eyebrow">GERİ BİLDİRİM</span>
              <h2>Tek puandan fazlasına bak.</h2>
              <p>
                Genel sonuç telaffuz yüzdesine dayanmaz. Görevi tamamlama,
                anlaşılırlık, akıcılık, kelime seçimi ve gramer birlikte hesaplanır.
                Telaffuz bölümü ise nitel bir anlaşılabilirlik sinyalidir.
              </p>
              <div className="v40-metrics">
                <span><strong>{evaluation.metrics.wordCount}</strong> kelime</span>
                <span><strong>{evaluation.metrics.wordsPerMinute}</strong> kelime/dk</span>
                <span><strong>{evaluation.metrics.hesitationCount}</strong> duraksama sinyali</span>
              </div>
            </article>
          </div>

          <div className="v40-rubric-grid">
            <Rubric label="Görevi tamamlama" value={evaluation.taskCompletion} />
            <Rubric label="Anlaşılırlık" value={evaluation.clarity} />
            <Rubric label="Akıcılık" value={evaluation.fluency} />
            <Rubric label="Kelime seçimi" value={evaluation.vocabulary} />
            <Rubric label="Gramer" value={evaluation.grammar} />
          </div>

          <article className={`panel v40-pronunciation-card ${evaluation.pronunciation.band.toLowerCase()}`}>
            <div>
              <span className="eyebrow">TELAFFUZ / ANLAŞILABİLİRLİK</span>
              <h2>{evaluation.pronunciation.label}</h2>
            </div>
            <p>{evaluation.pronunciation.note}</p>
            {evaluation.pronunciation.focusWords.length ? (
              <div className="v40-chip-list">
                {evaluation.pronunciation.focusWords.map((word) => (
                  <span key={word}>{word}</span>
                ))}
              </div>
            ) : null}
            <small>
              Bu bölüm fonetik uzman puanı değildir; tarayıcı tanıma sinyali,
              konuşmanın uzunluğu ve metnin çözülebilirliği üzerinden çalışma önerisi verir.
            </small>
          </article>

          <article className="panel">
            <h2>Görev kontrolü</h2>
            <div className="task-check-results">
              {evaluation.achievedGoals.map((goal) => (
                <span className="done" key={goal}><CheckCircle2 size={17} />{goal}</span>
              ))}
              {evaluation.missingGoals.map((goal) => (
                <span className="missing" key={goal}>○ {goal}</span>
              ))}
            </div>
          </article>

          {evaluation.naturalSuggestions.length ? (
            <article className="panel">
              <span className="eyebrow">DAHA DOĞAL KULLANIM</span>
              <h2>Söylediğini daha doğal hale getir.</h2>
              <div className="v40-natural-grid">
                {evaluation.naturalSuggestions.map((item) => (
                  <div className="v40-natural-card" key={`${item.original}-${item.suggestion}`}>
                    <span>{item.original}</span>
                    <strong>→ {item.suggestion}</strong>
                    <p>{item.reason}</p>
                  </div>
                ))}
              </div>
            </article>
          ) : null}

          <article className="panel">
            <h2>Gramer ve yapı notları</h2>
            {evaluation.grammarNotes.length ? (
              <div className="v40-grammar-notes">
                {evaluation.grammarNotes.map((item) => (
                  <div key={`${item.label}-${item.suggestion}`}>
                    <strong>{item.label}</strong>
                    <p>{item.suggestion}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="lab-note">
                Belirgin bir otomatik gramer uyarısı oluşmadı. Bu kontrol hedef
                yapılara ve açık örüntülere dayanır; insan öğretmen değerlendirmesinin
                yerine geçmez.
              </p>
            )}
          </article>

          <article className="panel">
            <h2>Kişisel geri bildirim</h2>
            <ul className="feedback-list">
              {evaluation.feedback.map((item) => <li key={item}>{item}</li>)}
            </ul>

            {evaluation.missingKeywords.length ? (
              <div className="focus-box">
                <strong>Eksik hedef kelime / ifade</strong>
                <p>{evaluation.missingKeywords.join(" · ")}</p>
              </div>
            ) : null}

            <div className="lab-actions">
              <button className="button button-primary" onClick={() => reset(task)}>
                <RotateCcw />Aynı Görevi Yeniden Yap
              </button>
              <button
                className="button button-secondary"
                onClick={() => {
                  const index = levelTasks.findIndex((item) => item.id === task.id);
                  reset(levelTasks[(index + 1) % levelTasks.length]);
                }}
              >
                Sonraki Görev<ArrowRight />
              </button>
            </div>
          </article>
        </section>
      ) : null}
    </div>
  );
}

function Rubric({ label, value }: { label: string; value: number }) {
  return (
    <article>
      <div><strong>{label}</strong><span>%{value}</span></div>
      <Progress
        value={value}
        label={value >= 80 ? "Güçlü" : value >= 60 ? "Gelişiyor" : "Tekrar gerekli"}
      />
    </article>
  );
}
