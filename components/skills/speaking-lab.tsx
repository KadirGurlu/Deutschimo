"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, CheckCircle2, Mic2, MicOff, RotateCcw, Sparkles, Volume2 } from "lucide-react";
import { speakingTasks } from "@/data/skill-labs";
import { evaluateSpeaking } from "@/lib/skills/evaluation";
import { useSession } from "next-auth/react";
import type { LabLevel, SpeakingEvaluation, SpeakingTask } from "@/types/skills";
import { LevelTabs, TaskCards } from "@/components/skills/task-picker";
import { Progress } from "@/components/ui/progress";

interface RecognitionAlternativeLike { transcript: string; confidence: number }
interface RecognitionResultLike { isFinal: boolean; length: number; [index: number]: RecognitionAlternativeLike }
interface RecognitionEventLike { resultIndex: number; results: { length: number; [index: number]: RecognitionResultLike } }
interface RecognitionLike {
  lang: string; continuous: boolean; interimResults: boolean;
  onresult: ((event: RecognitionEventLike) => void) | null;
  onstart: (() => void) | null; onend: (() => void) | null; onerror: (() => void) | null;
  start(): void; stop(): void;
}
type RecognitionConstructor = new () => RecognitionLike;

declare global { interface Window { SpeechRecognition?: RecognitionConstructor; webkitSpeechRecognition?: RecognitionConstructor } }

export function SpeakingLab() {
  const { data: session } = useSession();
  const initialLevel=(session?.user.currentLevel??"A1") as LabLevel;
  const [level,setLevel]=useState<LabLevel>(initialLevel);
  const levelTasks=useMemo(()=>speakingTasks.filter((task)=>task.level===level),[level]);
  const [task,setTask]=useState<SpeakingTask>(levelTasks[0]??speakingTasks[0]);
  const [transcript,setTranscript]=useState("");
  const [interim,setInterim]=useState("");
  const [recording,setRecording]=useState(false);
  const [seconds,setSeconds]=useState(0);
  const [confidence,setConfidence]=useState(0.75);
  const [evaluation,setEvaluation]=useState<SpeakingEvaluation|null>(null);
  const [status,setStatus]=useState("");
  const recognitionRef=useRef<RecognitionLike|null>(null);
  const startedAt=useRef<number|null>(null);

  useEffect(()=>{if(!recording)return;const timer=window.setInterval(()=>setSeconds((value)=>value+1),1000);return()=>window.clearInterval(timer);},[recording]);
  useEffect(()=>()=>recognitionRef.current?.stop(),[]);

  function reset(nextTask=task){recognitionRef.current?.stop();setTask(nextTask);setTranscript("");setInterim("");setRecording(false);setSeconds(0);setConfidence(0.75);setEvaluation(null);setStatus("");startedAt.current=null;}
  function chooseLevel(next:LabLevel){setLevel(next);reset(speakingTasks.find((item)=>item.level===next)??speakingTasks[0]);}
  function speakModel(){if(!("speechSynthesis" in window))return;window.speechSynthesis.cancel();const utterance=new SpeechSynthesisUtterance(task.modelAnswer);utterance.lang="de-DE";utterance.rate=task.level==="A1"?0.82:task.level==="A2"?0.9:0.98;const voice=window.speechSynthesis.getVoices().find((item)=>item.lang.toLowerCase().startsWith("de"));if(voice)utterance.voice=voice;window.speechSynthesis.speak(utterance);}
  function startRecording(){
    const Constructor=window.SpeechRecognition??window.webkitSpeechRecognition;
    if(!Constructor){setStatus("Bu tarayıcı otomatik Almanca ses tanımayı desteklemiyor. Chrome veya Edge kullanabilir, metni elle de yazabilirsin.");return;}
    setEvaluation(null);setStatus("");setInterim("");startedAt.current=Date.now();setSeconds(0);
    const recognition=new Constructor();recognition.lang="de-DE";recognition.continuous=true;recognition.interimResults=true;
    recognition.onstart=()=>setRecording(true);
    recognition.onresult=(event)=>{let finalText="";let interimText="";const confidenceValues:number[]=[];for(let i=event.resultIndex;i<event.results.length;i++){const result=event.results[i];const alternative=result[0];if(!alternative)continue;if(result.isFinal){finalText+=`${alternative.transcript} `;confidenceValues.push(alternative.confidence||0.75);}else interimText+=alternative.transcript;}if(finalText)setTranscript((current)=>`${current} ${finalText}`.trim());setInterim(interimText);if(confidenceValues.length)setConfidence(confidenceValues.reduce((sum,value)=>sum+value,0)/confidenceValues.length);};
    recognition.onerror=()=>{setRecording(false);setStatus("Mikrofon veya ses tanıma sırasında sorun oluştu. İzni kontrol edip yeniden deneyebilirsin.");};
    recognition.onend=()=>setRecording(false);recognitionRef.current=recognition;recognition.start();
  }
  function stopRecording(){recognitionRef.current?.stop();setRecording(false);if(startedAt.current)setSeconds(Math.max(seconds,Math.round((Date.now()-startedAt.current)/1000)));}
  async function evaluate(){
    const result=evaluateSpeaking(task,transcript.trim(),Math.max(seconds,1),confidence);setEvaluation(result);setStatus("Sonuç kaydediliyor...");
    const response=await fetch("/api/skills/attempts",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({skill:"SPEAKING",taskId:task.id,level:task.level,score:result.overall,durationSeconds:Math.max(seconds,1),transcript,answerPayload:{recognitionConfidence:confidence},feedback:result})});
    setStatus(response.ok?"Konuşma çalışması hesabına kaydedildi.":"Değerlendirme gösterildi ancak sunucuya kaydedilemedi.");
  }

  return <div className="lab-page">
    <div className="lab-page-head"><div><span className="eyebrow">KONUŞMA LABORATUVARI</span><h1>Mikrofonu aç, Almancayı üret.</h1><p>Seviyene uygun görevde hazırlık yap, Almanca konuş ve tarayıcı tabanlı konuşma çözümlemesiyle görev başarısı, kelime, akıcılık ve anlaşılırlık puanlarını gör.</p></div><Mic2 size={42}/></div>
    <LevelTabs value={level} onChange={chooseLevel}/><TaskCards tasks={levelTasks} selectedId={task.id} onSelect={reset}/>
    <section className="speaking-layout">
      <article className="panel speaking-task-panel"><span className="eyebrow">{task.level} · KONUŞMA GÖREVİ</span><h2>{task.title}</h2><p className="speaking-situation">{task.situation}</p><div className="speaking-prompt"><strong>Görev</strong><p>{task.prompt}</p></div><h3>Hazırlık iskeleti</h3><ul className="speaking-preparation">{task.preparation.map((item)=><li key={item}><CheckCircle2 size={17}/>{item}</li>)}</ul><div className="lab-actions"><button className="button button-secondary" onClick={speakModel}><Volume2 size={18}/>Model Yanıtı Dinle</button></div></article>
      <article className="panel recorder-panel"><div className={`recording-orb ${recording?"active":""}`}>{recording?<Mic2 size={42}/>:<MicOff size={42}/>}</div><h2>{recording?"Dinliyorum...":"Konuşmaya hazır mısın?"}</h2><p>{recording?"Almanca konuş. Bitirdiğinde kaydı durdur.":`Hedef süre yaklaşık ${task.estimatedSeconds} saniye.`}</p><strong className="recording-time">{String(Math.floor(seconds/60)).padStart(2,"0")}:{String(seconds%60).padStart(2,"0")}</strong><button className={`button ${recording?"button-danger":"button-primary"}`} onClick={recording?stopRecording:startRecording}>{recording?<><MicOff/>Kaydı Durdur</>:<><Mic2/>Mikrofonu Başlat</>}</button><small>Ses dosyası yüklenmez; tarayıcı konuşmayı metne dönüştürür.</small></article>
    </section>
    <section className="panel transcript-panel"><div className="section-head"><div><span className="eyebrow">KONUŞMA METNİ</span><h2>Tarayıcının algıladığı metin</h2></div><span className="level-badge">Güven %{Math.round(confidence*100)}</span></div><textarea className="editor speaking-editor" value={`${transcript}${interim?` ${interim}`:""}`} onChange={(event)=>{setTranscript(event.target.value);setInterim("");}} placeholder="Konuşma burada yazıya dönüşür. İstersen değerlendirmeden önce küçük tanıma hatalarını elle düzeltebilirsin."/><div className="lab-actions end"><button className="button button-primary" disabled={!transcript.trim()||recording} onClick={evaluate}><Sparkles/>Konuşmayı Değerlendir</button></div>{status?<p className="lab-note">{status}</p>:null}</section>
    {evaluation?<section className="speaking-result"><div className="result-score"><strong>%{evaluation.overall}</strong><span>Genel konuşma puanı</span></div><div className="skill-rubric-grid"><Rubric label="Görev başarısı" value={evaluation.taskCompletion}/><Rubric label="Kelime kullanımı" value={evaluation.vocabulary}/><Rubric label="Akıcılık" value={evaluation.fluency}/><Rubric label="Anlaşılırlık" value={evaluation.clarity}/></div><article className="panel"><h2>Kişisel geri bildirim</h2><ul className="feedback-list">{evaluation.feedback.map((item)=><li key={item}>{item}</li>)}</ul>{evaluation.missingKeywords.length?<div className="focus-box"><strong>Eksik hedefler</strong><p>{evaluation.missingKeywords.join(", ")}</p></div>:null}{evaluation.pronunciationFocus.length?<div className="focus-box"><strong>Telaffuz provası için kelimeler</strong><p>{evaluation.pronunciationFocus.join(" · ")}</p><small>Bu liste ses tanıma sonucuna dayanır; fonetik uzman değerlendirmesi değildir.</small></div>:null}<div className="lab-actions"><button className="button button-primary" onClick={()=>reset(task)}><RotateCcw/>Aynı Görevi Yeniden Yap</button><button className="button button-secondary" onClick={()=>{const i=levelTasks.findIndex((item)=>item.id===task.id);reset(levelTasks[(i+1)%levelTasks.length]);}}>Sonraki Görev<ArrowRight/></button></div></article></section>:null}
  </div>;
}

function Rubric({label,value}:{label:string;value:number}){return <article><div><strong>{label}</strong><span>%{value}</span></div><Progress value={value} label={value>=80?"Güçlü":value>=60?"Gelişiyor":"Tekrar gerekli"}/></article>;}
