"use client";

import type { LabLevel } from "@/types/skills";

export function LevelTabs({ value, onChange }: { value: LabLevel; onChange: (level: LabLevel) => void }) {
  const levels: LabLevel[] = ["A1","A2","B1","B2"];
  return <div className="lab-level-tabs" role="tablist" aria-label="Seviye seçimi">{levels.map((level)=><button role="tab" aria-selected={value===level} className={value===level?"active":""} key={level} onClick={()=>onChange(level)}>{level}</button>)}</div>;
}

export function TaskCards<T extends { id:string; title:string; situation?:string; genre?:string; estimatedMinutes?:number }>({ tasks, selectedId, onSelect }: { tasks:T[]; selectedId:string; onSelect:(task:T)=>void }) {
  return <div className="lab-task-cards">{tasks.map((task)=><button className={selectedId===task.id?"selected":""} onClick={()=>onSelect(task)} key={task.id}><strong>{task.title}</strong><span>{task.situation ?? task.genre}</span>{task.estimatedMinutes ? <small>Yaklaşık {task.estimatedMinutes} dk</small> : null}</button>)}</div>;
}
