"use client";
import { useEffect,useState } from "react";
import { Award,CheckCircle2,ShieldCheck } from "lucide-react";
type Row={level:"A1"|"A2"|"B1"|"B2";gold:number;expected:number;complete:boolean};type Flow={status:string;count:number};
const labels:Record<string,string>={DRAFT:"Taslak",REVIEW:"İncelemede",READY:"Yayına hazır",PUBLISHED:"Yayında"};
export function QualityDashboard(){
  const[levels,setLevels]=useState<Row[]>([]);const[workflow,setWorkflow]=useState<Flow[]>([]);
  useEffect(()=>{fetch("/api/admin/content-studio/quality",{cache:"no-store"}).then(r=>r.json()).then(p=>{setLevels(p.levels??[]);setWorkflow(p.workflow??[])}).catch(()=>undefined)},[]);
  return <><section className="v44-quality-hero"><div><span className="eyebrow">V44 · KALİTE MERKEZİ</span><h1>Gold Standard kapsamı</h1><p>A1–B2 kalite ve yayın durumunu tek ekranda izle.</p></div><ShieldCheck size={40}/></section><div className="v44-quality-grid">{levels.map(r=><article key={r.level}><div><span className="level-badge">{r.level}</span><Award/></div><strong>{r.gold}/{r.expected} Gold</strong><p>{r.complete?"Gold Standard tamamlandı.":`${r.expected-r.gold} ünite kontrol bekliyor.`}</p><div><span style={{width:`${Math.min(100,(r.gold/Math.max(1,r.expected))*100)}%`}}/></div></article>)}</div><section className="panel"><div className="section-head"><div><h2>Yayın akışı</h2><p>Taslak → İncelemede → Yayına hazır → Yayında</p></div></div><div className="v44-flow-grid">{["DRAFT","REVIEW","READY","PUBLISHED"].map(s=><article key={s}><CheckCircle2/><span>{labels[s]}</span><strong>{workflow.find(x=>x.status===s)?.count??0}</strong></article>)}</div></section></>
}
