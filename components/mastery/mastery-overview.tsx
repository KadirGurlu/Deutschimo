"use client";
import { useEffect,useMemo,useState } from "react";
import Link from "next/link";
import styles from "./mastery-overview.module.css";
import type { MasteryOverviewResponse,MasterySkill,MasterySkillSummary } from "@/types/mastery";
const labels:Record<MasterySkill,string>={VOCABULARY:"Kelime",GRAMMAR:"Gramer",READING:"Okuma",LISTENING:"Dinleme",WRITING:"Yazma",SPEAKING:"Konuşma"};
const scoreText=(x:MasterySkillSummary)=>x.score===null?"Veri yok":`%${x.score}`;
export function MasteryOverview({compact=false}:{compact?:boolean}){
  const[data,setData]=useState<MasteryOverviewResponse|null>(null),[error,setError]=useState(false),[selected,setSelected]=useState("");
  useEffect(()=>{let active=true;fetch("/api/mastery/overview",{cache:"no-store"}).then(async r=>{if(!r.ok)throw new Error("mastery");return await r.json() as MasteryOverviewResponse;}).then(v=>{if(active){setData(v);setSelected(c=>c||v.courses[0]?.courseId||"");}}).catch(()=>active&&setError(true));return()=>{active=false};},[]);
  const course=useMemo(()=>data?.courses.find(x=>x.courseId===selected)??data?.courses[0]??null,[data,selected]);
  if(error)return null;
  if(!data)return <section className={styles.shell}><div className={styles.loading}>Ustalık verileri hazırlanıyor…</div></section>;
  if(!course)return <section className={styles.shell}><div className={styles.empty}><strong>Gerçek öğrenme ölçümü hazır.</strong><p>İlk soru, tekrar veya beceri çalışmandan sonra ustalık puanların oluşmaya başlayacak.</p></div></section>;
  return <section className={`${styles.shell} ${compact?styles.compact:""}`}>
    <div className={styles.header}><div><span className={styles.eyebrow}>V37 · MASTERY ENGINE</span><h2>Gerçek öğrenme düzeyin</h2><p>Tamamlama ilerlemesi ile bilgiyi gerçekten ne kadar öğrendiğin ayrı hesaplanır.</p></div>{!compact&&<Link className={styles.detailLink} href="/mastery">Ayrıntılı görünüm →</Link>}</div>
    {data.courses.length>1&&<div className={styles.tabs}>{data.courses.map(x=><button key={x.courseId} type="button" className={x.courseId===course.courseId?styles.activeTab:styles.tab} onClick={()=>setSelected(x.courseId)}>{x.courseId.toUpperCase()}</button>)}</div>}
    <div className={styles.heroGrid}>
      <div className={styles.masteryCard}><span>{course.courseId.toUpperCase()} genel yeterlilik</span><strong>{course.mastery===null?"—":`%${course.mastery}`}</strong><small>Ölçüm kapsamı %{course.coverage}{course.provisional?" · İlk veriler geldikçe kesinleşecek":""}</small></div>
      <div className={styles.completionCard}><span>Kurs tamamlama</span><strong>{course.completion===null?"—":`%${course.completion}`}</strong><small>Bu değer ustalık puanından bağımsızdır.</small></div>
      <div className={styles.insightCard}><span>Güçlü alan</span><strong>{course.strongestSkill?labels[course.strongestSkill.skill]:"Henüz veri yok"}</strong><small>{course.strongestSkill?.score===null||!course.strongestSkill?"Daha fazla çalışma verisi gerekiyor.":`%${course.strongestSkill.score} ustalık`}</small></div>
      <div className={styles.insightCard}><span>Geliştirilmeli</span><strong>{course.weakestSkill?labels[course.weakestSkill.skill]:"Henüz veri yok"}</strong><small>{course.weakTopics[0]?.tag??"Konu etiketi oluşması için soru çöz."}</small></div>
    </div>
    <div className={styles.skills}>{course.skills.map(item=><div className={styles.skill} key={item.skill}><div className={styles.skillTop}><span>{labels[item.skill]}</span><strong>{scoreText(item)}</strong></div><div className={styles.track}><div className={styles.fill} style={{width:`${item.score??0}%`}} /></div><small>{item.evidenceCount?`${item.evidenceCount} öğrenme kanıtı · güven %${Math.round(item.confidence*100)}`:"Henüz ölçülmedi"}</small></div>)}</div>
    {!compact&&course.weakTopics.length>0&&<div className={styles.topics}><h3>Geliştirilmesi gereken konular</h3><div className={styles.topicGrid}>{course.weakTopics.map(t=><div className={styles.topic} key={t.tag}><strong>{t.tag}</strong><span>%{t.score}</span></div>)}</div></div>}
  </section>;
}
