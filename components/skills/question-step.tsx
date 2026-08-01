"use client";

import { CheckCircle2, XCircle } from "lucide-react";
import type { ComprehensionQuestion } from "@/types/skills";

export function QuestionStep({ question, selected, checked, onSelect }: { question: ComprehensionQuestion; selected?: string; checked: boolean; onSelect: (value: string) => void }) {
  const correct = selected === question.correctAnswer;
  return <div className="lab-question"><span className="eyebrow">{question.kind === "MAIN_IDEA" ? "ANA FİKİR" : "AYRINTI"}</span><h2>{question.prompt}</h2><div className="lab-options">{question.options.map((option,index)=>{
    const state = checked ? option.id === question.correctAnswer ? "correct" : option.id === selected ? "wrong" : "" : option.id === selected ? "selected" : "";
    return <button key={option.id} className={state} disabled={checked} onClick={()=>onSelect(option.id)}><span>{String.fromCharCode(65+index)}</span>{option.label}</button>;
  })}</div>{checked?<div className={`lab-feedback ${correct?"correct":"wrong"}`}>{correct?<CheckCircle2/>:<XCircle/>}<div><strong>{correct?"Doğru cevap":"Cevabını tekrar incele"}</strong><p>{question.explanation}</p></div></div>:null}</div>;
}
