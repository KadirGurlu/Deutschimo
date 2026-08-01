"use client";

import { useMemo, useRef, useState } from "react";
import { ArrowRight, Check, Headphones, Pause, Play, RotateCcw, Save, Volume2 } from "lucide-react";
import { listeningTasks } from "@/data/skill-labs";
import { useSession } from "next-auth/react";
import type { LabLevel, ListeningTask, VocabularyItem } from "@/types/skills";
import { LevelTabs, TaskCards } from "@/components/skills/task-picker";
import { QuestionStep } from "@/components/skills/question-step";
import { Progress } from "@/components/ui/progress";

export function ListeningLab() {
  const { data: session } = useSession();
  const initialLevel = (session?.user.currentLevel ?? "A1") as LabLevel;
  const [level,setLevel] = useState<LabLevel>(initialLevel);
  const levelTasks = useMemo(()=>listeningTasks.filter((task)=>task.level===level),[level]);
  const [task,setTask] = useState<ListeningTask>(levelTasks[0] ?? listeningTasks[0]);
  const [phase,setPhase] = useState<"INTRO"|"QUESTION"|"SECOND"|"REVIEW"|"RESULT">("INTRO");
  const [questionIndex,setQuestionIndex] = useState(0);
  const [answers,setAnswers] = useState<Record<string,string>>({});
  const [checked,setChecked] = useState(false);
  const [playCount,setPlayCount] = useState(0);
  const [speaking,setSpeaking] = useState(false);
  const [savedWords,setSavedWords] = useState<string[]>([]);
  const [saveState,setSaveState] = useState("");
  const startedAt = useRef(Date.now());
  const question = task.questions[questionIndex];
  const selected = question ? answers[question.id] : undefined;
  const correctCount = task.questions.filter((item)=>answers[item.id]===item.correctAnswer).length;
  const progress = phase === "INTRO" ? 8 : phase === "QUESTION" ? 20 + Math.round((questionIndex/task.questions.length)*45) : phase === "SECOND" ? 70 : phase === "REVIEW" ? 85 : 100;

  function chooseLevel(next:LabLevel){
    setLevel(next); const nextTask=listeningTasks.find((item)=>item.level===next) ?? listeningTasks[0]; reset(nextTask);
  }
  function reset(nextTask=task){
    window.speechSynthesis?.cancel(); setTask(nextTask); setPhase("INTRO"); setQuestionIndex(0); setAnswers({}); setChecked(false); setPlayCount(0); setSpeaking(false); setSavedWords([]); setSaveState(""); startedAt.current=Date.now();
  }
  function speak(){
    if (!("speechSynthesis" in window)) { setSaveState("Tarayıcın sesli okuma özelliğini desteklemiyor."); return; }
    window.speechSynthesis.cancel();
    const utterance=new SpeechSynthesisUtterance(task.transcript.replace(/\b[A-ZÄÖÜ][\p{L}-]+:/gu,""));
    utterance.lang="de-DE"; utterance.rate=task.level==="A1"?0.82:task.level==="A2"?0.88:task.level==="B1"?0.94:1;
    const voice=window.speechSynthesis.getVoices().find((item)=>item.lang.toLowerCase().startsWith("de")); if(voice) utterance.voice=voice;
    utterance.onstart=()=>{setSpeaking(true);setPlayCount((value)=>value+1);}; utterance.onend=()=>setSpeaking(false); utterance.onerror=()=>setSpeaking(false);
    window.speechSynthesis.speak(utterance);
  }
  function stop(){ window.speechSynthesis?.cancel(); setSpeaking(false); }
  function check(){ if(selected) setChecked(true); }
  function nextQuestion(){
    if(!checked) return;
    if(questionIndex<task.questions.length-1){setQuestionIndex((value)=>value+1);setChecked(false);}
    else setPhase("SECOND");
  }
  async function saveWord(item:VocabularyItem){
    const response=await fetch("/api/skills/vocabulary",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({...item,sourceSkill:"LISTENING",sourceTaskId:task.id,sourceCourseId:task.level.toLowerCase(),sourceUnitTitle:task.title})});
    if(response.ok)setSavedWords((values)=>[...new Set([...values,item.word])]);
  }
  async function complete(){
    const score=Math.round((correctCount/task.questions.length)*100); setSaveState("Kaydediliyor...");
    const response=await fetch("/api/skills/attempts",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({skill:"LISTENING",taskId:task.id,level:task.level,score,durationSeconds:Math.round((Date.now()-startedAt.current)/1000),answerPayload:{answers,playCount},feedback:{correctCount,questionCount:task.questions.length}})});
    setSaveState(response.ok?"Çalışma hesabına kaydedildi.":"Sonuç kaydedilemedi; tekrar deneyebilirsin."); setPhase("RESULT");
  }

  return <div className="lab-page">
    <div className="lab-page-head"><div><span className="eyebrow">DİNLEME LABORATUVARI</span><h1>Önce dinle, sonra kanıtla.</h1><p>Metin ilk aşamada görünmez. Ana fikir ve ayrıntıları çözdükten sonra transkript ve Türkçe çeviri açılır.</p></div><Headphones size={42}/></div>
    <LevelTabs value={level} onChange={chooseLevel}/><TaskCards tasks={levelTasks} selectedId={task.id} onSelect={reset}/>
    <Progress value={progress} label={`Laboratuvar süreci · %${progress}`}/>

    {phase==="INTRO"?<section className="lab-stage listening-intro"><div className="audio-orb"><Volume2 size={38}/></div><span className="eyebrow">1. DİNLEME · TRANSKRİPT KAPALI</span><h2>{task.title}</h2><p>{task.situation}</p><small>Konuşmacı: {task.speakerHint}</small><div className="lab-actions"><button className="button button-primary" onClick={speaking?stop:speak}>{speaking?<><Pause/>Durdur</>:<><Play/>Metni Dinle</>}</button><button className="button button-secondary" disabled={!playCount} onClick={()=>setPhase("QUESTION")}>Ana Fikir Sorusuna Geç<ArrowRight/></button></div>{saveState?<p className="lab-note">{saveState}</p>:null}</section>:null}

    {phase==="QUESTION"&&question?<section className="lab-stage"><div className="lab-step-meta"><span>Soru {questionIndex+1}/{task.questions.length}</span><small>İlk dinleme: {playCount} kez</small></div><QuestionStep question={question} selected={selected} checked={checked} onSelect={(value)=>setAnswers((current)=>({...current,[question.id]:value}))}/><div className="lab-actions split"><button className="button button-secondary" onClick={speak}><Play size={17}/>Tekrar Dinle</button>{checked?<button className="button button-primary" onClick={nextQuestion}>{questionIndex===task.questions.length-1?"İkinci Dinlemeye Geç":"Sonraki Soru"}<ArrowRight/></button>:<button className="button button-primary" disabled={!selected} onClick={check}>Kontrol Et</button>}</div></section>:null}

    {phase==="SECOND"?<section className="lab-stage listening-intro"><div className="audio-orb secondary"><Headphones size={38}/></div><span className="eyebrow">2. DİNLEME</span><h2>Şimdi ayrıntıları yeniden yakala.</h2><p>Yanıtlarını değiştirmeden metni bir kez daha dinle. Ardından transkript ve çeviriyle kendi kontrolünü yap.</p><div className="lab-actions"><button className="button button-primary" onClick={speaking?stop:speak}>{speaking?<><Pause/>Durdur</>:<><Play/>İkinci Kez Dinle</>}</button><button className="button button-secondary" onClick={()=>setPhase("REVIEW")}>Transkripti Aç<ArrowRight/></button></div></section>:null}

    {phase==="REVIEW"?<section className="lab-review"><article className="panel"><span className="eyebrow">ALMANCA TRANSKRİPT</span><h2>{task.title}</h2><p className="lab-long-text">{task.transcript}</p><button className="button button-secondary" onClick={speak}><Volume2 size={17}/>Metni Yeniden Dinle</button></article><article className="panel translation-panel"><span className="eyebrow">TÜRKÇE ÇEVİRİ</span><p className="lab-long-text">{task.translation}</p></article><section className="panel"><div className="section-head"><div><span className="eyebrow">KELİME ÇALIŞMASI</span><h2>Bilmediğin kelimeleri defterine ekle</h2></div></div><div className="lab-vocabulary">{task.vocabulary.map((item)=><article key={item.word}><div><strong>{item.article?`${item.article} `:""}{item.word}</strong><span>{item.translation}</span><p>{item.example}<small>{item.exampleTranslation}</small></p></div><button className="button button-secondary" disabled={savedWords.includes(item.word)} onClick={()=>saveWord(item)}>{savedWords.includes(item.word)?<><Check/>Eklendi</>:<><Save/>Kelimeye Ekle</>}</button></article>)}</div><div className="lab-actions end"><button className="button button-primary" onClick={complete}>Çalışmayı Tamamla<ArrowRight/></button></div></section></section>:null}

    {phase==="RESULT"?<section className="lab-result"><div className="result-score"><strong>%{Math.round((correctCount/task.questions.length)*100)}</strong><span>Dinleme başarısı</span></div><div><span className="eyebrow">ÇALIŞMA TAMAMLANDI</span><h2>{correctCount}/{task.questions.length} doğru cevap</h2><p>{correctCount===task.questions.length?"Ana fikir ve tüm ayrıntıları doğru yakaladın.":"Transkripti bir kez daha okuyup yanlış yaptığın ayrıntıları ses içinde bulmaya çalış."}</p><p className="lab-note">{saveState}</p><div className="lab-actions"><button className="button button-primary" onClick={()=>reset(task)}><RotateCcw/>Aynı Görevi Tekrarla</button><button className="button button-secondary" onClick={()=>{const i=levelTasks.findIndex((item)=>item.id===task.id);reset(levelTasks[(i+1)%levelTasks.length]);}}>Sonraki Görev<ArrowRight/></button></div></div></section>:null}
  </div>;
}
