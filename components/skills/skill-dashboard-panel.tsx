"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, BookOpenText, Headphones, Mic2, PenLine } from "lucide-react";
import type { SkillOverview, SkillType } from "@/types/skills";

const items: Array<{ skill:SkillType; label:string; href:string; icon:typeof Headphones }> = [
  {skill:"LISTENING",label:"Dinleme",href:"/listening",icon:Headphones},
  {skill:"SPEAKING",label:"Konuşma",href:"/speaking",icon:Mic2},
  {skill:"READING",label:"Okuma",href:"/reading",icon:BookOpenText},
  {skill:"WRITING",label:"Yazma",href:"/writing",icon:PenLine},
];

export function SkillDashboardPanel(){
  const [overview,setOverview]=useState<SkillOverview|null>(null);
  useEffect(()=>{fetch("/api/skills/overview",{cache:"no-store"}).then(async response=>response.ok?(await response.json() as {overview:SkillOverview}).overview:null).then(setOverview).catch(()=>setOverview(null));},[]);
  return <section className="panel"><div className="section-head"><div><span className="eyebrow">V13 · BECERİ GELİŞİMİ</span><h2>Dört temel beceri</h2></div><Link className="button button-secondary" href="/skills">Tüm Laboratuvarlar<ArrowRight size={17}/></Link></div><div className="skill-dashboard-grid">{items.map(({skill,label,href,icon:Icon})=><Link href={href} key={skill}><Icon/><div><strong>{label}</strong><span>{overview?.totals[skill]??0} çalışma</span></div><b>%{overview?.averages[skill]??0}</b></Link>)}</div></section>;
}
