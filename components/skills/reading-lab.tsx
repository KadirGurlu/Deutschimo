"use client";

import { useMemo, useRef, useState } from "react";
import { ArrowRight, BookOpenText, Check, RotateCcw, Save } from "lucide-react";
import { readingTasks } from "@/data/skill-labs";
import { useSession } from "next-auth/react";
import type { LabLevel, ReadingTask, VocabularyItem } from "@/types/skills";
import { LevelTabs, TaskCards } from "@/components/skills/task-picker";
import { QuestionStep } from "@/components/skills/question-step";
import { Progress } from "@/components/ui/progress";

export function ReadingLab() {
  const { data: session } = useSession();
  const initialLevel = (session?.user.currentLevel ?? "A1") as LabLevel;
  const [level,setLevel] = useState<LabLevel>(initialLevel);
  const levelTasks = useMemo(()=>readingTasks.filter((task)=>task.level===level),[level]);
  const [task,setTask] = useState<ReadingTask>(levelTasks[0] ?? readingTasks[0]);
  const [phase,setPhase] = useState<"READ"|"QUESTION"|"REVIEW"|"RESULT">("READ");
  const [questionIndex,setQuestionIndex] = useState(0);
  const [answers,setAnswers] = useState<Record<string,string>>({});
  const [checked,setChecked] = useState(false);
  const [savedWords,setSavedWords] = useState<string[]>([]);
  const [saveState,setSaveState] = useState("");
  const startedAt=useRef(Date.now());
  const question=task.questions[questionIndex];
  const selected=question?answers[question.id]:undefined;
  const correctCount=task.questions.filter((item)=>answers[item.id]===item.correctAnswer).length;
  const progress=phase==="READ"?20:phase==="QUESTION"?35+Math.round((questionIndex/task.questions.length)*40):phase==="REVIEW"?85:100;

  function reset(nextTask=task){setTask(nextTask);setPhase("READ");setQuestionIndex(0);setAnswers({});setChecked(false);setSavedWords([]);setSaveState("");startedAt.current=Date.now();}
  function chooseLevel(next:LabLevel){setLevel(next);reset(readingTasks.find((item)=>item.level===next)??readingTasks[0]);}
  function nextQuestion(){if(!checked)return;if(questionIndex<task.questions.length-1){setQuestionIndex((value)=>value+1);setChecked(false);}else setPhase("REVIEW");}
  async function saveWord(item:VocabularyItem){const response=await fetch("/api/skills/vocabulary",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({...item,sourceSkill:"READING",sourceTaskId:task.id})});if(response.ok)setSavedWords((current)=>[...new Set([...current,item.word])]);}
  async function complete(){const score=Math.round((correctCount/task.questions.length)*100);setSaveState("Kaydediliyor...");const response=await fetch("/api/skills/attempts",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({skill:"READING",taskId:task.id,level:task.level,score,durationSeconds:Math.round((Date.now()-startedAt.current)/1000),answerPayload:{answers},feedback:{correctCount,questionCount:task.questions.length}})});setSaveState(response.ok?"Okuma çalışması hesabına kaydedildi.":"Sonuç kaydedilemedi.");setPhase("RESULT");}

  return <div className="lab-page">
    <div className="lab-page-head"><div><span className="eyebrow">OKUMA LABORATUVARI</span><h1>Metni oku, bilgiyi ayıkla.</h1><p>Mesaj, ilan, haber, görüş yazısı ve akademik özet gibi gerçek metin türlerinde ana fikir, ayrıntı ve çıkarım becerilerini geliştir.</p></div><BookOpenText size={42}/></div>
    <LevelTabs value={level} onChange={chooseLevel}/><TaskCards tasks={levelTasks} selectedId={task.id} onSelect={reset}/><Progress value={progress} label={`Laboratuvar süreci · %${progress}`}/>
    {phase==="READ"?<section className="lab-stage reading-stage"><div className="lab-step-meta"><span>{task.genre}</span><small>Yaklaşık {task.estimatedMinutes} dk</small></div><span className="eyebrow">ALMANCA OKUMA METNİ</span><h2>{task.title}</h2><p className="lab-long-text reading-text">{task.text}</p><div className="reading-strategy"><strong>Okuma stratejisi</strong><p>İlk okumada genel amacı bul. İkinci okumada kişi, zaman, neden ve sonuç gibi ayrıntıların altını zihninde çiz.</p></div><div className="lab-actions end"><button className="button button-primary" onClick={()=>setPhase("QUESTION")}>Sorulara Geç<ArrowRight/></button></div></section>:null}
    {phase==="QUESTION"&&question?<section className="lab-stage"><div className="lab-step-meta"><span>Soru {questionIndex+1}/{task.questions.length}</span><small>{task.genre}</small></div><QuestionStep question={question} selected={selected} checked={checked} onSelect={(value)=>setAnswers((current)=>({...current,[question.id]:value}))}/><div className="lab-actions split"><button className="button button-secondary" onClick={()=>setPhase("READ")}>Metne Dön</button>{checked?<button className="button button-primary" onClick={nextQuestion}>{questionIndex===task.questions.length-1?"Çeviriyi ve Kelimeleri Aç":"Sonraki Soru"}<ArrowRight/></button>:<button className="button button-primary" disabled={!selected} onClick={()=>setChecked(true)}>Kontrol Et</button>}</div></section>:null}
    {phase==="REVIEW"?<section className="lab-review"><article className="panel translation-panel"><span className="eyebrow">TÜRKÇE ÇEVİRİ</span><h2>{task.title}</h2><p className="lab-long-text">{task.translation}</p></article><section className="panel"><div className="section-head"><div><span className="eyebrow">KELİME ÇALIŞMASI</span><h2>Metinden kişisel kelime defterine</h2></div></div><div className="lab-vocabulary">{task.vocabulary.map((item)=><article key={item.word}><div><strong>{item.article?`${item.article} `:""}{item.word}</strong><span>{item.translation}</span><p>{item.example}<small>{item.exampleTranslation}</small></p></div><button className="button button-secondary" disabled={savedWords.includes(item.word)} onClick={()=>saveWord(item)}>{savedWords.includes(item.word)?<><Check/>Eklendi</>:<><Save/>Kelimeye Ekle</>}</button></article>)}</div><div className="lab-actions end"><button className="button button-primary" onClick={complete}>Çalışmayı Tamamla<ArrowRight/></button></div></section></section>:null}
    {phase==="RESULT"?<section className="lab-result"><div className="result-score"><strong>%{Math.round((correctCount/task.questions.length)*100)}</strong><span>Okuma başarısı</span></div><div><span className="eyebrow">ÇALIŞMA TAMAMLANDI</span><h2>{correctCount}/{task.questions.length} doğru cevap</h2><p>{correctCount===task.questions.length?"Metnin amacı ve ayrıntılarını eksiksiz yakaladın.":"Yanlış yaptığın soruda metindeki kanıt cümlesini yeniden bul ve çeviriyle karşılaştır."}</p><p className="lab-note">{saveState}</p><div className="lab-actions"><button className="button button-primary" onClick={()=>reset(task)}><RotateCcw/>Tekrar Çöz</button><button className="button button-secondary" onClick={()=>{const i=levelTasks.findIndex((item)=>item.id===task.id);reset(levelTasks[(i+1)%levelTasks.length]);}}>Sonraki Metin<ArrowRight/></button></div></div></section>:null}
  </div>;
}
