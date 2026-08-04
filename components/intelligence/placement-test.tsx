"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import {
  ArrowRight,
  BookOpen,
  BrainCircuit,
  CheckCircle2,
  Clock3,
  Headphones,
  ListChecks,
  MessageCircle,
  Mic,
  MicOff,
  PenLine,
  RotateCcw,
  Sparkles,
  Target,
  Volume2,
} from "lucide-react";

import { Progress } from "@/components/ui/progress";
import type {
  PlacementQuestion,
  PlacementResult,
  PlacementSkill,
  PlacementTestMode,
} from "@/types/intelligence";
import styles from "./placement-test-v28-4.module.css";

type PublicQuestion = Omit<PlacementQuestion, "correctAnswer" | "explanation" | "keywords">;
type TestState = "LOADING" | "INTRO" | "RUNNING" | "SUBMITTING" | "RESULT";

type SpeechRecognitionResultLike = {
  isFinal: boolean;
  0: { transcript: string };
};

type SpeechRecognitionEventLike = {
  resultIndex: number;
  results: { length: number; [index: number]: SpeechRecognitionResultLike };
};

type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

const skillLabels: Record<PlacementSkill, string> = {
  GRAMMAR: "Gramer",
  VOCABULARY: "Kelime",
  READING: "Okuma",
  LISTENING: "Dinleme",
  WRITING: "Yazma",
  SPEAKING: "Konuşma",
};

const skillIcons: Record<PlacementSkill, typeof BrainCircuit> = {
  GRAMMAR: BrainCircuit,
  VOCABULARY: BookOpen,
  READING: ListChecks,
  LISTENING: Headphones,
  WRITING: PenLine,
  SPEAKING: MessageCircle,
};

const quickSkills: PlacementSkill[] = ["GRAMMAR", "VOCABULARY", "READING", "LISTENING"];
const detailedSkills: PlacementSkill[] = ["GRAMMAR", "VOCABULARY", "READING", "LISTENING", "WRITING", "SPEAKING"];

function wordCount(value: string | undefined): number {
  return value?.trim().split(/\s+/).filter(Boolean).length ?? 0;
}

function formatDuration(seconds: number | undefined): string {
  if (!seconds) return "—";
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return `${minutes} dk ${rest} sn`;
}

function recognitionConstructor(): SpeechRecognitionConstructor | null {
  if (typeof window === "undefined") return null;
  const speechWindow = window as unknown as {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  };
  return speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition ?? null;
}

export function PlacementTest() {
  const { update } = useSession();
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const startedAtRef = useRef<number>(0);

  const [questions, setQuestions] = useState<PublicQuestion[]>([]);
  const [latest, setLatest] = useState<PlacementResult | null>(null);
  const [mode, setMode] = useState<PlacementTestMode>("QUICK");
  const [state, setState] = useState<TestState>("LOADING");
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [audioPlays, setAudioPlays] = useState<Record<string, number>>({});
  const [recordingId, setRecordingId] = useState<string | null>(null);
  const [result, setResult] = useState<PlacementResult | null>(null);
  const [error, setError] = useState("");

  const loadMode = useCallback(async (selectedMode: PlacementTestMode) => {
    const response = await fetch(`/api/intelligence/placement?mode=${selectedMode}`, { cache: "no-store" });
    const payload = await response.json() as {
      questions?: PublicQuestion[];
      latest?: PlacementResult | null;
      error?: string;
    };
    if (!response.ok || !payload.questions) throw new Error(payload.error ?? "Seviye testi yüklenemedi.");
    setQuestions(payload.questions);
    setLatest(payload.latest ?? null);
  }, []);

  useEffect(() => {
    loadMode("QUICK")
      .then(() => setState("INTRO"))
      .catch((reason: Error) => {
        setError(reason.message);
        setState("INTRO");
      });

    return () => {
      recognitionRef.current?.stop();
      if (typeof window !== "undefined") window.speechSynthesis?.cancel();
    };
  }, [loadMode]);

  const current = questions[index];
  const selected = current ? answers[current.id] : undefined;
  const progress = questions.length
    ? Math.round(((index + (selected?.trim() ? 1 : 0)) / questions.length) * 100)
    : 0;

  const questionSummary = useMemo(() => {
    const counts = questions.reduce<Record<string, number>>((acc, question) => {
      acc[question.skill] = (acc[question.skill] ?? 0) + 1;
      return acc;
    }, {});
    return Object.entries(counts);
  }, [questions]);

  async function begin(selectedMode: PlacementTestMode) {
    setMode(selectedMode);
    setState("LOADING");
    setAnswers({});
    setAudioPlays({});
    setIndex(0);
    setResult(null);
    setError("");
    try {
      await loadMode(selectedMode);
      startedAtRef.current = Date.now();
      setState("RUNNING");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Test başlatılamadı.");
      setState("INTRO");
    }
  }

  function canContinue(): boolean {
    if (!current || !selected?.trim()) return false;
    if (current.kind === "WRITING" || current.kind === "SPEAKING") {
      return wordCount(selected) >= Math.max(1, current.minWords ?? 1);
    }
    return true;
  }

  async function next() {
    if (!current || !canContinue()) return;
    recognitionRef.current?.stop();
    setRecordingId(null);

    if (index < questions.length - 1) {
      setIndex((value) => value + 1);
      return;
    }

    setState("SUBMITTING");
    try {
      const durationSeconds = Math.max(1, Math.round((Date.now() - startedAtRef.current) / 1000));
      const response = await fetch("/api/intelligence/placement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode, answers, durationSeconds }),
      });
      const payload = await response.json() as { result?: PlacementResult; error?: string };
      if (!response.ok || !payload.result) throw new Error(payload.error ?? "Test sonucu hesaplanamadı.");

      await update({ user: { currentLevel: payload.result.recommendedLevel } });
      setResult(payload.result);
      setLatest(payload.result);
      setState("RESULT");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Beklenmeyen bir hata oluştu.");
      setState("RUNNING");
    }
  }

  function playListening(question: PublicQuestion) {
    if (!question.audioText || typeof window === "undefined" || !window.speechSynthesis) {
      setError("Bu tarayıcı sesli dinleme özelliğini desteklemiyor.");
      return;
    }
    const playCount = audioPlays[question.id] ?? 0;
    if (playCount >= 3) return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(question.audioText);
    utterance.lang = "de-DE";
    utterance.rate = 0.82;
    const germanVoice = window.speechSynthesis.getVoices().find((voice) => voice.lang.toLocaleLowerCase().startsWith("de"));
    if (germanVoice) utterance.voice = germanVoice;
    window.speechSynthesis.speak(utterance);
    setAudioPlays((value) => ({ ...value, [question.id]: playCount + 1 }));
  }

  function toggleRecording(question: PublicQuestion) {
    if (recordingId === question.id) {
      recognitionRef.current?.stop();
      setRecordingId(null);
      return;
    }

    const Recognition = recognitionConstructor();
    if (!Recognition) {
      setError("Tarayıcın konuşmayı yazıya çevirme özelliğini desteklemiyor. Cevabını alttaki alana kendin yazabilirsin.");
      return;
    }

    recognitionRef.current?.stop();
    const recognition = new Recognition();
    recognition.lang = "de-DE";
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.onresult = (event) => {
      let transcript = "";
      for (let itemIndex = 0; itemIndex < event.results.length; itemIndex += 1) {
        transcript += `${event.results[itemIndex][0].transcript} `;
      }
      if (transcript.trim()) {
        setAnswers((value) => ({ ...value, [question.id]: transcript.trim() }));
      }
    };
    recognition.onerror = () => {
      setError("Ses algılanamadı. Mikrofon iznini kontrol et veya cevabını metin alanına yaz.");
      setRecordingId(null);
    };
    recognition.onend = () => setRecordingId(null);
    recognitionRef.current = recognition;

    try {
      recognition.start();
      setError("");
      setRecordingId(question.id);
    } catch {
      setError("Mikrofon başlatılamadı. Tarayıcı iznini kontrol et.");
    }
  }

  if (state === "LOADING") {
    return (
      <section className={styles.loadingCard}>
        <BrainCircuit className="spin-soft" />
        <h2>Seviye testi hazırlanıyor</h2>
        <p>Sorular ve önceki sonuçların hesabın için hazırlanıyor.</p>
      </section>
    );
  }

  if (state === "INTRO") {
    return (
      <section className={styles.introShell}>
        <div className={styles.introHeader}>
          <span className="eyebrow">V28.4 · GERÇEK SEVİYE TESTİ</span>
          <h1>Seviyeni yalnızca gramerle değil, gerçek dil becerilerinle ölç.</h1>
          <p>Önce hızlı bir tahmin alabilir veya altı beceriyi ayrı ayrı ölçen ayrıntılı değerlendirmeye başlayabilirsin.</p>
        </div>

        <div className={styles.modeGrid}>
          <article className={styles.modeCard}>
            <div className={styles.modeIcon}><Sparkles /></div>
            <div>
              <span className={styles.modeLabel}>HIZLI TEST</span>
              <h2>10–15 dakikada yaklaşık seviyeni öğren</h2>
              <p>Gramer, kelime, okuma ve dinleme alanlarında 16 seçici soru.</p>
            </div>
            <ul>
              <li><Clock3 size={17} /> Yaklaşık 10–15 dakika</li>
              <li><Target size={17} /> A1.1–B2.2 arası tahmini sonuç</li>
              <li><ListChecks size={17} /> Ayrıntılı test önerisi</li>
            </ul>
            <button className="button button-primary" onClick={() => begin("QUICK")}>
              Hızlı Testi Başlat <ArrowRight size={18} />
            </button>
          </article>

          <article className={`${styles.modeCard} ${styles.detailedCard}`}>
            <div className={styles.recommendedBadge}>En kapsamlı sonuç</div>
            <div className={styles.modeIcon}><BrainCircuit /></div>
            <div>
              <span className={styles.modeLabel}>AYRINTILI TEST</span>
              <h2>Altı becerinin seviyesini ayrı ayrı gör</h2>
              <p>Gramer, kelime, okuma, dinleme, yazma ve konuşma için ayrıntılı beceri profili.</p>
            </div>
            <div className={styles.skillPills}>
              {detailedSkills.map((skill) => <span key={skill}>{skillLabels[skill]}</span>)}
            </div>
            <ul>
              <li><Clock3 size={17} /> Yaklaşık 35–50 dakika</li>
              <li><Target size={17} /> Her beceri için ayrı A1–B2 profili</li>
              <li><ListChecks size={17} /> Otomatik eksik tamamlama planı</li>
            </ul>
            <button className="button button-primary" onClick={() => begin("DETAILED")}>
              Ayrıntılı Testi Başlat <ArrowRight size={18} />
            </button>
          </article>
        </div>

        {latest ? (
          <aside className={styles.latestCard}>
            <div><CheckCircle2 /><span>Son test sonucun</span></div>
            <strong>{latest.overallBand ?? latest.recommendedLevel}</strong>
            <span>{latest.mode === "DETAILED" ? "Ayrıntılı" : "Hızlı"} test · %{latest.totalScore} · {formatDuration(latest.durationSeconds)}</span>
          </aside>
        ) : null}
        {error ? <div className="auth-message auth-error">{error}</div> : null}
      </section>
    );
  }

  if (state === "RESULT" && result) {
    return <PlacementResultView result={result} onRetry={() => begin(mode)} onDetailed={() => begin("DETAILED")} />;
  }

  if (!current) {
    return <section className="panel"><h2>Soru bulunamadı</h2><p>Sayfayı yenileyip tekrar dene.</p></section>;
  }

  const currentWordCount = wordCount(selected);
  const minWords = current.minWords ?? 0;
  const currentSkillIcon = skillIcons[current.skill];
  const CurrentSkillIcon = currentSkillIcon;

  return (
    <section className={styles.testShell}>
      <div className={styles.testHeader}>
        <div>
          <span className={styles.levelBadge}>{current.level}</span>
          <span className={styles.skillName}><CurrentSkillIcon size={17} />{skillLabels[current.skill]}</span>
          <span className={styles.modeName}>{mode === "DETAILED" ? "Ayrıntılı test" : "Hızlı test"}</span>
        </div>
        <strong>{index + 1} / {questions.length}</strong>
      </div>
      <Progress value={progress} label={`Test ilerlemesi · %${progress}`} />

      <article className={styles.questionCard}>
        <span className="eyebrow">{current.topic}</span>
        <h2>{current.prompt}</h2>
        {current.instruction ? <p className={styles.instruction}>{current.instruction}</p> : null}

        {current.kind === "LISTENING" ? (
          <div className={styles.listeningBox}>
            <button
              type="button"
              className={styles.audioButton}
              onClick={() => playListening(current)}
              disabled={(audioPlays[current.id] ?? 0) >= 3}
            >
              <Volume2 size={21} />
              {(audioPlays[current.id] ?? 0) === 0 ? "Kaydı dinle" : "Tekrar dinle"}
            </button>
            <span>{audioPlays[current.id] ?? 0} / 3 dinleme</span>
          </div>
        ) : null}

        {current.options?.length ? (
          <div className={styles.options}>
            {current.options.map((item, optionIndex) => (
              <button
                type="button"
                key={item.id}
                className={selected === item.value ? styles.selectedOption : ""}
                onClick={() => setAnswers((value) => ({ ...value, [current.id]: item.value }))}
              >
                <span>{String.fromCharCode(65 + optionIndex)}</span>
                {item.label}
              </button>
            ))}
          </div>
        ) : null}

        {current.kind === "WRITING" ? (
          <div className={styles.responseBox}>
            <textarea
              value={selected ?? ""}
              onChange={(event) => setAnswers((value) => ({ ...value, [current.id]: event.target.value }))}
              placeholder="Almanca cevabını buraya yaz..."
              rows={9}
            />
            <div className={currentWordCount >= minWords ? styles.countReady : styles.wordCount}>
              {currentWordCount} kelime · en az {minWords}
            </div>
          </div>
        ) : null}

        {current.kind === "SPEAKING" ? (
          <div className={styles.speakingBox}>
            <button
              type="button"
              className={recordingId === current.id ? styles.recordingButton : styles.microphoneButton}
              onClick={() => toggleRecording(current)}
            >
              {recordingId === current.id ? <MicOff size={21} /> : <Mic size={21} />}
              {recordingId === current.id ? "Kaydı durdur" : "Konuşmaya başla"}
            </button>
            <p>Tarayıcının oluşturduğu transkripti kontrol edebilir ve gerekiyorsa düzeltebilirsin.</p>
            <textarea
              value={selected ?? ""}
              onChange={(event) => setAnswers((value) => ({ ...value, [current.id]: event.target.value }))}
              placeholder="Konuşma transkripti burada görünecek. Tarayıcı desteklemiyorsa söylediğin cevabı yaz."
              rows={6}
            />
            <div className={currentWordCount >= minWords ? styles.countReady : styles.wordCount}>
              {currentWordCount} kelime · en az {minWords}
            </div>
          </div>
        ) : null}

        {error ? <div className="auth-message auth-error">{error}</div> : null}

        <div className={styles.actions}>
          {index > 0 ? (
            <button type="button" className="button button-secondary" onClick={() => setIndex((value) => value - 1)}>Önceki</button>
          ) : <span />}
          <button
            type="button"
            className="button button-primary"
            disabled={!canContinue() || state === "SUBMITTING"}
            onClick={next}
          >
            {state === "SUBMITTING" ? "Sonuç hesaplanıyor..." : index === questions.length - 1 ? "Testi Tamamla" : "Sonraki Görev"}
            <ArrowRight size={18} />
          </button>
        </div>
      </article>

      <aside className={styles.testMeta}>
        {questionSummary.map(([skill, count]) => <span key={skill}>{skillLabels[skill as PlacementSkill]}: {count}</span>)}
      </aside>
    </section>
  );
}

function PlacementResultView({
  result,
  onRetry,
  onDetailed,
}: {
  result: PlacementResult;
  onRetry: () => void;
  onDetailed: () => void;
}) {
  const courseHref = `/courses/${result.recommendedLevel.toLocaleLowerCase()}`;
  const displayedSkills = result.mode === "DETAILED" ? detailedSkills : quickSkills;

  return (
    <section className={styles.resultShell}>
      <div className={styles.resultHero}>
        <div className={styles.resultLevel}>
          <CheckCircle2 />
          <small>{result.mode === "DETAILED" ? "Genel seviye" : "Yaklaşık genel seviye"}</small>
          <strong>{result.overallBand ?? result.recommendedLevel}</strong>
          <span>%{result.totalScore} genel başarı · Güven %{result.confidenceScore ?? 0}</span>
        </div>
        <div className={styles.resultSummary}>
          <span className="eyebrow">V28.4 · KİŞİSEL SEVİYE RAPORU</span>
          <h1>{result.mode === "DETAILED" ? "Altı becerilik Almanca profilin hazır." : "Hızlı seviye tahminin hazır."}</h1>
          <p>{result.mode === "DETAILED"
            ? "Her beceri ayrı değerlendirildi ve en çok ihtiyaç duyduğun alanlara göre çalışma planın oluşturuldu."
            : "Bu sonuç yaklaşık bir yönlendirmedir. Yazma ve konuşmayı da ölçmek için ayrıntılı testi tamamla."}</p>
          <div className={styles.resultFacts}>
            <span><Clock3 size={17} />{formatDuration(result.durationSeconds)}</span>
            <span><Target size={17} />Önerilen kurs: {result.recommendedLevel}</span>
            <span><ListChecks size={17} />{result.questionCount} görev</span>
          </div>
        </div>
      </div>

      <div className={styles.skillResultGrid}>
        {displayedSkills.map((skill) => {
          const Icon = skillIcons[skill];
          const score = result.skillScores?.[skill] ?? 0;
          const band = result.skillLevels?.[skill] ?? result.recommendedLevel;
          return (
            <article key={skill} className={styles.skillResultCard}>
              <div><Icon size={20} /><span>{skillLabels[skill]}</span></div>
              <strong>{band}</strong>
              <Progress value={score} label={`%${score}`} />
            </article>
          );
        })}
      </div>

      <section className={styles.planSection}>
        <div className={styles.sectionHeading}>
          <div><Target /><span><strong>Eksik tamamlama planın</strong><small>Ölçülen en zayıf alanlardan başlayacak şekilde otomatik oluşturuldu.</small></span></div>
        </div>
        <div className={styles.planGrid}>
          {(result.studyPlan ?? []).map((item, planIndex) => (
            <Link href={item.href} key={item.id} className={styles.planCard}>
              <span>{planIndex + 1}</span>
              <div><strong>{item.title}</strong><p>{item.description}</p><small>Günde {item.minutesPerDay} dakika · {item.priority === "HIGH" ? "Yüksek öncelik" : item.priority === "MEDIUM" ? "Orta öncelik" : "Destek çalışması"}</small></div>
              <ArrowRight size={18} />
            </Link>
          ))}
        </div>
      </section>

      {result.mode === "QUICK" ? (
        <section className={styles.detailedInvite}>
          <BrainCircuit />
          <div><strong>Yazma ve konuşma seviyeni de görmek ister misin?</strong><p>Ayrıntılı test altı beceriyi ayrı ayrı ölçer ve planını daha güvenilir hâle getirir.</p></div>
          <button className="button button-primary" onClick={onDetailed}>Ayrıntılı Teste Geç</button>
        </section>
      ) : null}

      <div className={styles.insightColumns}>
        <div>
          <h3>Güçlü alanların</h3>
          {result.strengths.length
            ? result.strengths.map((item) => <span className="insight-chip success" key={item}>{item}</span>)
            : <p>Güçlü alan tespiti için daha fazla veri gerekiyor.</p>}
        </div>
        <div>
          <h3>Öncelikli gelişim alanların</h3>
          {result.weakTopics.length
            ? result.weakTopics.map((item) => <span className="insight-chip warning" key={item}>{item}</span>)
            : <p>Belirgin bir zayıf alan görünmüyor.</p>}
        </div>
      </div>

      <div className={styles.resultActions}>
        <Link className="button button-primary" href={courseHref}>Önerilen Kursu Aç <ArrowRight size={18} /></Link>
        <Link className="button button-secondary" href="/study-plan">Günlük Planımı Gör</Link>
        <button className="button button-ghost" onClick={onRetry}><RotateCcw size={17} />Testi Yenile</button>
      </div>

      <p className={styles.assessmentNote}>Yazma ve konuşma sonuçları otomatik bir ön değerlendirmedir; resmî sınav sonucu veya öğretmen değerlendirmesi yerine geçmez.</p>
    </section>
  );
}
