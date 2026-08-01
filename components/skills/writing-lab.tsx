"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, ArrowRight, CheckCircle2, FileText, RotateCcw, Save, Send, Sparkles } from "lucide-react";
import { writingTasks } from "@/data/skill-labs";
import { evaluateWriting } from "@/lib/skills/evaluation";
import { useSession } from "next-auth/react";
import type { LabLevel, WritingEvaluation, WritingTask } from "@/types/skills";
import { LevelTabs, TaskCards } from "@/components/skills/task-picker";
import { Progress } from "@/components/ui/progress";

export function WritingLab() {
  const { data: session } = useSession();
  const initialLevel=(session?.user.currentLevel??"A1") as LabLevel;
  const [level,setLevel]=useState<LabLevel>(initialLevel);
  const levelTasks=useMemo(()=>writingTasks.filter((task)=>task.level===level),[level]);
  const [task,setTask]=useState<WritingTask>(levelTasks[0]??writingTasks[0]);
  const [text,setText]=useState("");
  const [evaluation,setEvaluation]=useState<WritingEvaluation|null>(null);
  const [status,setStatus]=useState("");
  const startedAt=useRef(Date.now());
  const wordCount=text.trim()?text.trim().split(/\s+/).length:0;
  const rangePercent=Math.min(100,Math.round((wordCount/task.minWords)*100));

  useEffect(()=>{const draft=window.localStorage.getItem(`deutschimo-writing-${task.id}`);setText(draft??"");setEvaluation(null);setStatus("");startedAt.current=Date.now();},[task.id]);
  function reset(nextTask=task){setTask(nextTask);setText(window.localStorage.getItem(`deutschimo-writing-${nextTask.id}`)??"");setEvaluation(null);setStatus("");startedAt.current=Date.now();}
  function chooseLevel(next:LabLevel){setLevel(next);reset(writingTasks.find((item)=>item.level===next)??writingTasks[0]);}
  function saveDraft(){window.localStorage.setItem(`deutschimo-writing-${task.id}`,text);setStatus("Taslak bu cihazda kaydedildi.");}
  async function evaluate(){const result=evaluateWriting(task,text);setEvaluation(result);setStatus("Değerlendirme kaydediliyor...");const response=await fetch("/api/skills/attempts",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({skill:"WRITING",taskId:task.id,level:task.level,score:result.overall,durationSeconds:Math.round((Date.now()-startedAt.current)/1000),transcript:text,answerPayload:{wordCount:result.wordCount},feedback:result})});setStatus(response.ok?"Yazma çalışması hesabına kaydedildi.":"Değerlendirme gösterildi ancak sunucuya kaydedilemedi.");}

  return <div className="lab-page">
    <div className="lab-page-head"><div><span className="eyebrow">YAZMA LABORATUVARI</span><h1>Görevi tamamla, metnini geliştir.</h1><p>A1'den B2'ye gerçek iletişim görevleri yaz. Metnin görev başarısı, dil bilgisi, kelime kullanımı ve düzen açısından ayrı ayrı değerlendirilir.</p></div><FileText size={42}/></div>
    <LevelTabs value={level} onChange={chooseLevel}/><TaskCards tasks={levelTasks} selectedId={task.id} onSelect={reset}/>
    <section className="writing-lab-layout">
      <article className="panel writing-brief"><span className="eyebrow">{task.level} · YAZMA GÖREVİ</span><h2>{task.title}</h2><p className="speaking-situation">{task.situation}</p><div className="speaking-prompt"><strong>Görev</strong><p>{task.prompt}</p></div><h3>Metinde bulunması gerekenler</h3><ul className="speaking-preparation">{task.requiredPoints.map((item)=><li key={item}><CheckCircle2 size={17}/>{item}</li>)}</ul><h3>Kullanışlı ifadeler</h3><div className="phrase-chips">{task.usefulPhrases.map((item)=><button key={item} onClick={()=>setText((current)=>`${current}${current?"\n":""}${item}`)}>{item}</button>)}</div></article>
      <article className="panel writing-editor-panel"><div className="writing-editor-head"><div><strong>Metin editörü</strong><span>{task.minWords}-{task.maxWords} kelime hedefi</span></div><b className={wordCount>task.maxWords?"over":""}>{wordCount} kelime</b></div><Progress value={rangePercent} label={wordCount<task.minWords?`${task.minWords-wordCount} kelime daha gerekli`:wordCount<=task.maxWords?"Hedef aralığına ulaştın":`${wordCount-task.maxWords} kelime fazla`}/><textarea className="editor writing-lab-editor" value={text} onChange={(event)=>{setText(event.target.value);setEvaluation(null);}} placeholder="Metnini Almanca olarak buraya yaz..."/><div className="lab-actions split"><button className="button button-secondary" onClick={saveDraft}><Save/>Taslağı Kaydet</button><button className="button button-primary" disabled={!text.trim()} onClick={evaluate}><Send/>Değerlendirmeye Gönder</button></div>{status?<p className="lab-note">{status}</p>:null}</article>
    </section>
    {evaluation?<section className="writing-result"><div className="result-score"><strong>%{evaluation.overall}</strong><span>Genel yazma puanı</span></div><div className="skill-rubric-grid"><Rubric label="Görev başarısı" value={evaluation.taskSuccess}/><Rubric label="Dil bilgisi" value={evaluation.grammar}/><Rubric label="Kelime kullanımı" value={evaluation.vocabulary}/><Rubric label="Metin düzeni" value={evaluation.structure}/></div><div className="writing-feedback-grid"><article className="panel"><h2>Görev kontrolü</h2><div className="task-check-results">{task.requiredPoints.map((point)=><span className={evaluation.matchedPoints.includes(point)?"done":"missing"} key={point}>{evaluation.matchedPoints.includes(point)?<CheckCircle2/>:<AlertTriangle/>}{point}</span>)}</div><h3>Öneriler</h3><ul className="feedback-list">{evaluation.feedback.map((item)=><li key={item}>{item}</li>)}</ul></article><article className="panel"><h2>Düzeltme noktaları</h2>{evaluation.corrections.length?evaluation.corrections.map((item)=><div className="correction-card" key={`${item.original}-${item.suggestion}`}><span>{item.original}</span><strong>{item.suggestion}</strong><p>{item.reason}</p></div>):<div className="empty-corrections"><Sparkles/><strong>Temel örüntü taramasında belirgin hata bulunmadı.</strong><p>Bu otomatik ön değerlendirme, eğitmen kontrolünün yerini tutmaz.</p></div>}</article></div><article className="panel model-answer"><div className="section-head"><div><span className="eyebrow">MODEL METİN</span><h2>Karşılaştırmalı öğrenme</h2></div></div><p>{task.modelAnswer}</p><small>Model metni ezberlemek yerine yapı, bağlaç ve görev noktalarını kendi metninle karşılaştır.</small><div className="lab-actions"><button className="button button-primary" onClick={()=>{setEvaluation(null);window.scrollTo({top:0,behavior:"smooth"});}}><RotateCcw/>Metnimi Düzenle</button><button className="button button-secondary" onClick={()=>{const i=levelTasks.findIndex((item)=>item.id===task.id);reset(levelTasks[(i+1)%levelTasks.length]);}}>Sonraki Görev<ArrowRight/></button></div></article></section>:null}
  </div>;
}

function Rubric({label,value}:{label:string;value:number}){return <article><div><strong>{label}</strong><span>%{value}</span></div><Progress value={value} label={value>=80?"Güçlü":value>=60?"Gelişiyor":"Tekrar gerekli"}/></article>;}
