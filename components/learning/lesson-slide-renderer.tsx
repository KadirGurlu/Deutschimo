"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Check, CheckCircle2, ChevronRight, Headphones, Info, Lightbulb, RotateCcw, Volume2 } from "lucide-react";
import type { ContentBlock } from "@/types/learning";
import type { PracticeQuestion } from "@/types/content";

function speakGerman(text: string) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "de-DE";
  utterance.rate = 0.88;
  window.speechSynthesis.speak(utterance);
}

function normalize(value: string) {
  return value.toLocaleLowerCase("de-DE").trim().replace(/[.,!?;:„“\"']/g, "").replace(/\s+/g, " ");
}

function BilingualLines({ title, lines, className = "" }: { title?: string; lines?: NonNullable<ContentBlock["lines"]>; className?: string }) {
  if (!lines?.length) return null;
  return <section className={`bilingual-block ${className}`}>
    {title ? <h3>{title}</h3> : null}
    <div className="bilingual-list">
      {lines.map((line, index) => <article className="bilingual-pair" key={`${line.de}-${index}`}>
        {line.note ? <span className="example-note">{line.note}</span> : null}
        <p className="german-line" lang="de">{line.de}</p>
        <p className="turkish-line">{line.tr}</p>
        <button type="button" className="listen-inline" onClick={() => speakGerman(line.de)} aria-label={`Almanca cümleyi dinle: ${line.de}`}><Volume2 size={16}/> Dinle</button>
      </article>)}
    </div>
  </section>;
}

function BilingualPassage({ title, passage, listening = false }: { title?: string; passage?: NonNullable<ContentBlock["passage"]>; listening?: boolean }) {
  if (!passage) return null;
  return <section className={`bilingual-passage ${listening ? "listening-passage" : "reading-passage"}`}>
    <div className="passage-heading">
      {title ? <h3>{title}</h3> : <span/>}
      <button type="button" className="button button-secondary" onClick={() => speakGerman(passage.de)} aria-label="Almanca metni dinle">
        {listening ? <Headphones size={17}/> : <Volume2 size={17}/>} {listening ? "Metni Dinle" : "Almanca Metni Dinle"}
      </button>
    </div>
    <article className="passage-language german-passage" lang="de">
      <span className="passage-label">ALMANCA METİN</span>
      <p>{passage.de}</p>
    </article>
    <article className="passage-language turkish-passage">
      <span className="passage-label">TÜRKÇE KARŞILIĞI</span>
      <p>{passage.tr}</p>
    </article>
  </section>;
}

function PracticeQuestionCard({ question, number, onResult, onCorrectChange }: { question: PracticeQuestion; number: number; onResult: (questionId: string, correct: boolean) => void; onCorrectChange: (correct: boolean) => void }) {
  const [answer, setAnswer] = useState("");
  const [checked, setChecked] = useState(false);
  const [ordered, setOrdered] = useState<string[]>([]);

  useEffect(() => {
    setAnswer("");
    setChecked(false);
    setOrdered([]);
    onCorrectChange(false);
  }, [question.id, onCorrectChange]);

  const currentAnswer = question.type === "SENTENCE_ORDERING" ? ordered.join(" ") : answer;
  const accepted = [question.correctAnswer, ...(question.acceptedAnswers ?? [])].map(normalize);
  const isCorrect = checked && accepted.includes(normalize(currentAnswer));
  const canCheck = Boolean(currentAnswer.trim());

  const selectToken = (token: string) => {
    if (checked) return;
    setOrdered((items) => [...items, token]);
  };

  const reset = () => {
    setAnswer("");
    setOrdered([]);
    setChecked(false);
    onCorrectChange(false);
    onResult(question.id, false);
  };

  const checkAnswer = () => {
    const correct = accepted.includes(normalize(currentAnswer));
    setChecked(true);
    onCorrectChange(correct);
    onResult(question.id, correct);
  };

  return <article className="practice-question-card sequential-question-card">
    <div className="practice-question-head"><span>{number}</span><strong>{question.type.replaceAll("_", " ")}</strong></div>
    <p className="practice-prompt">{question.prompt}</p>
    {(question.type === "MULTIPLE_CHOICE" || question.type === "SCENARIO") ? <div className="practice-options">
      {question.options?.map((option, index) => <button key={option} type="button" className={`choice-option-button ${answer === option ? "selected" : ""}`} aria-pressed={answer === option} onClick={() => { setAnswer(option); setChecked(false); onCorrectChange(false); }}>
        <span className="choice-option-marker" aria-hidden="true">{answer === option ? <Check size={16}/> : String.fromCharCode(65 + index)}</span><span>{option}</span>
      </button>)}
    </div> : null}
    {(question.type === "FILL_IN_THE_BLANK" || question.type === "TRANSLATION") ? <input className="practice-input" value={answer} onChange={(event: { target: { value: string } }) => { setAnswer(event.target.value); setChecked(false); onCorrectChange(false); }} placeholder="Cevabını yaz" aria-label={question.prompt}/> : null}
    {question.type === "SENTENCE_ORDERING" ? <div className="ordering-practice">
      <div className="ordered-answer">{ordered.length ? ordered.join(" ") : "Kelimelere sırayla dokun"}</div>
      <div className="ordering-tokens">{question.tokens?.map((token, index) => {
        const usedCount = ordered.filter((item) => item === token).length;
        const availableCount = question.tokens?.slice(0, index + 1).filter((item) => item === token).length ?? 0;
        return <button key={`${token}-${index}`} type="button" onClick={() => selectToken(token)} disabled={usedCount >= availableCount}>{token}</button>;
      })}</div>
    </div> : null}
    <div className="practice-actions"><button type="button" className="button button-secondary" onClick={reset}><RotateCcw size={16}/> Sıfırla</button><button type="button" className="button button-primary" disabled={!canCheck} onClick={checkAnswer}>Kontrol Et</button></div>
    {checked ? <div className={`practice-feedback ${isCorrect ? "correct" : "wrong"}`}>
      {isCorrect ? <CheckCircle2 size={19}/> : <AlertTriangle size={19}/>}<div><strong>{isCorrect ? "Doğru cevap" : "Cevabını tekrar kontrol et"}</strong>
        {!isCorrect ? <p><strong>Seçimin:</strong> {currentAnswer}</p> : null}
        <p><strong>Doğru cevap:</strong> {question.correctAnswer}</p>
        <p>{question.explanation}</p>
      </div>
    </div> : null}
  </article>;
}

function SequentialPracticeSet({ title, questions, onResult }: { title?: string; questions?: PracticeQuestion[]; onResult: (questionId: string, correct: boolean) => void }) {
  const safeQuestions = questions ?? [];
  const questionKey = safeQuestions.map((question) => question.id).join("|");
  const [activeIndex, setActiveIndex] = useState(0);
  const [activeCorrect, setActiveCorrect] = useState(false);

  useEffect(() => {
    setActiveIndex(0);
    setActiveCorrect(false);
  }, [questionKey]);

  if (!safeQuestions.length) return null;
  const question = safeQuestions[activeIndex];
  const isLast = activeIndex === safeQuestions.length - 1;
  const percent = Math.round(((activeIndex + (activeCorrect ? 1 : 0)) / safeQuestions.length) * 100);

  return <section className="practice-set sequential-practice-set">
    {title ? <h3>{title}</h3> : null}
    <div className="checkpoint-progress" aria-label={`Konu sonu kontrolü: ${activeIndex + 1} / ${safeQuestions.length}`}>
      <div><strong>Soru {activeIndex + 1} / {safeQuestions.length}</strong><span>%{percent}</span></div>
      <div className="checkpoint-progress-track"><span style={{ width: `${percent}%` }}/></div>
    </div>
    <PracticeQuestionCard key={question.id} question={question} number={activeIndex + 1} onResult={onResult} onCorrectChange={setActiveCorrect}/>
    {activeCorrect ? <div className="checkpoint-next-row">
      {isLast ? <div className="checkpoint-complete"><CheckCircle2 size={20}/><div><strong>Konu sonu kontrolü tamamlandı</strong><p>Bu slaytı tamamlayarak ana alıştırmalara geçebilirsin.</p></div></div> : <button type="button" className="button button-primary" onClick={() => { setActiveIndex((value) => value + 1); setActiveCorrect(false); }}>Sonraki Soru <ChevronRight size={18}/></button>}
    </div> : null}
  </section>;
}

export function LessonSlideRenderer({ blocks, miniAnswer, onMiniAnswer, onPracticeResult }: { blocks: ContentBlock[]; miniAnswer?: string; onMiniAnswer: (value: string) => void; onPracticeResult: (questionId: string, correct: boolean) => void }) {
  const listeningText = useMemo(() => blocks.flatMap((item) => item.type === "listening_text" ? [item.passage?.de ?? ""] : []).join(" "), [blocks]);
  void listeningText;

  return <div className="slide-blocks">{blocks.map((block) => {
    switch (block.type) {
      case "heading": return <h2 key={block.id}>{block.title}</h2>;
      case "text": return <p key={block.id}>{block.text}</p>;
      case "example": return <div className="content-example" key={block.id}><strong>{block.title}</strong><p lang="de">{block.text}</p></div>;
      case "translation": return <div className="content-translation" key={block.id}><span>{block.title}</span><p>{block.text}</p></div>;
      case "bilingual_examples": return <BilingualLines key={block.id} title={block.title} lines={block.lines}/>;
      case "grammar_table": return <div className="grammar-table-wrap" key={block.id}><h3>{block.title}</h3><div className="responsive-table"><table><thead><tr>{block.columns?.map((column) => <th key={column.header}>{column.header}</th>)}</tr></thead><tbody>{Array.from({ length: Math.max(...(block.columns?.map((column) => column.values.length) ?? [0])) }, (_, index) => <tr key={index}>{block.columns?.map((column) => <td key={`${column.header}-${index}`}>{column.values[index] ?? ""}</td>)}</tr>)}</tbody></table></div></div>;
      case "vocabulary_list": return <section className="vocabulary-list-block rich-vocabulary" key={block.id}><h3>{block.title}</h3><div className="vocabulary-rows">{block.vocabularyItems?.map((item, index) => {
        const fullWord = `${item.article ? `${item.article} ` : ""}${item.word}`;
        return <article className="vocabulary-row-rich" key={`${fullWord}-${index}`}>
          <div className="vocabulary-main"><div><strong lang="de">{fullWord}</strong>{item.plural ? <span className="vocabulary-plural"> – die {item.plural}</span> : null}</div><small>{item.kind}</small></div>
          <div className="vocabulary-meaning-rich">{item.meaning}</div>
          <div className="vocabulary-example-rich"><p lang="de">{item.exampleDe}</p><span>{item.exampleTr}</span></div>
          <button type="button" className="vocab-listen" onClick={() => speakGerman(`${fullWord}. ${item.exampleDe}`)} aria-label={`${fullWord} kelimesini ve örneği dinle`}><Volume2 size={17}/> Dinle</button>
        </article>;
      })}</div></section>;
      case "dialogue": return <section className="dialogue-block" key={block.id}><h3>{block.title}</h3><div className="dialogue-turns">{block.dialogue?.map((turn, index) => <article key={`${turn.speaker}-${index}`} className="dialogue-turn"><span className="dialogue-speaker">{turn.speaker}</span><div><p lang="de">{turn.de}</p><span>{turn.tr}</span></div><button type="button" className="listen-inline" onClick={() => speakGerman(turn.de)}><Volume2 size={15}/> Dinle</button></article>)}</div></section>;
      case "reading_text": return <BilingualPassage key={block.id} title={block.title} passage={block.passage}/>;
      case "listening_text": return <BilingualPassage key={block.id} title={block.title} passage={block.passage} listening/>;
      case "task_card": return <section className={`task-card task-${block.taskKind?.toLowerCase() ?? "note"}`} key={block.id}><div className="task-card-head"><Lightbulb size={21}/><div><span>{block.taskKind === "WRITING" ? "YAZMA" : block.taskKind === "SPEAKING" ? "KONUŞMA" : block.taskKind === "PRONUNCIATION" ? "TELAFFUZ" : "UYGULAMA"}</span><h3>{block.title}</h3></div></div><p>{block.text}</p>{block.checklist?.length ? <ul className="task-checklist">{block.checklist.map((item) => <li key={item}><CheckCircle2 size={17}/>{item}</li>)}</ul> : null}{block.usefulPhrases?.length ? <BilingualLines title="Kullanışlı ifadeler" lines={block.usefulPhrases}/> : null}</section>;
      case "mistake_list": return <section className="mistake-block" key={block.id}><h3>{block.title}</h3><div className="mistake-list">{block.mistakes?.map((item, index) => <article className="mistake-card" key={`${item.correct}-${index}`}><p className="mistake-wrong"><strong>Yanlış:</strong> <span lang="de">{item.wrong}</span></p><p className="mistake-correct"><strong>Doğru:</strong> <span lang="de">{item.correct}</span></p><p className="mistake-translation"><strong>Türkçesi:</strong> {item.tr}</p><p className="mistake-reason">{item.reason}</p></article>)}</div></section>;
      case "practice_set": return <SequentialPracticeSet key={block.id} title={block.title} questions={block.practiceQuestions} onResult={onPracticeResult}/>;
      case "info_box": return <div className="content-box info" key={block.id}><Info size={20}/><div><strong>{block.title}</strong><p>{block.text}</p></div></div>;
      case "warning_box": return <div className="content-box warning" key={block.id}><AlertTriangle size={20}/><div><strong>{block.title}</strong><p>{block.text}</p></div></div>;
      case "tip_box": return <div className="content-box tip" key={block.id}><Lightbulb size={20}/><div><strong>{block.title}</strong><p>{block.text}</p></div></div>;
      case "summary": return <div className="content-summary" key={block.id}><CheckCircle2 size={24}/><div><h3>{block.title}</h3><ul>{block.items?.map((item) => <li key={item}>{item}</li>)}</ul></div></div>;
      case "divider": return <hr key={block.id}/>;
      case "mini_check": {
        const isCorrect = Boolean(miniAnswer && miniAnswer === block.miniCheck?.correctAnswer);
        const isWrong = Boolean(miniAnswer && miniAnswer !== block.miniCheck?.correctAnswer);
        return <fieldset className="mini-check" key={block.id}>
          <legend>{block.miniCheck?.question}</legend><p className="selection-hint">Doğru cevabı seçtiğinde sonraki slayt açılır.</p>
          {block.miniCheck?.options.map((option, optionIndex) => { const selected = miniAnswer === option; return <button key={option} type="button" className={`choice-option-button ${selected ? "selected" : ""}`} aria-pressed={selected} onClick={() => onMiniAnswer(option)}><span className="choice-option-marker" aria-hidden="true">{selected ? <Check size={16}/> : String.fromCharCode(65 + optionIndex)}</span><span className="choice-option-text">{option}</span></button>; })}
          {isCorrect ? <p className="mini-check-feedback correct"><CheckCircle2 size={18}/> {block.miniCheck?.explanation ?? "Doğru. Bu yapıyı bir sonraki adımda kullanabilirsin."}</p> : null}
          {isWrong ? <p className="mini-check-feedback wrong"><AlertTriangle size={18}/> {block.miniCheck?.wrongFeedback?.[miniAnswer ?? ""] ?? "Bu seçenek uygun değil. Bu slayttaki kural ve örnekleri yeniden kontrol et."}</p> : null}
        </fieldset>;
      }
      default: return null;
    }
  })}</div>;
}
