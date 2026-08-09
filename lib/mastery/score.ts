import type { MasteryEvidenceInput } from "@/types/mastery";
export interface NormalizedEvidence { evidenceScore:number; evidenceWeight:number; }
function clamp(v:number,min=0,max=100){ return Math.max(min,Math.min(max,v)); }
export function normalizeEvidence(input:MasteryEvidenceInput):NormalizedEvidence {
  let score=typeof input.score==="number"&&Number.isFinite(input.score)?input.score:input.correct===true?100:input.correct===false?0:50;
  if(score<=1) score*=100;
  if(input.hintUsed&&score>50) score-=10;
  if(typeof input.responseMs==="number"&&input.responseMs>0){
    if(input.correct===true&&input.responseMs<5000) score+=3;
    if(input.responseMs>45000) score-=3;
  }
  const confidence=String(input.confidence??"").toLowerCase();
  if(input.correct===false&&/(emin|sure|high)/.test(confidence)) score-=8;
  if(input.correct===true&&/(emin degil|unsure|low)/.test(confidence)) score-=2;
  const difficulty=Math.max(1,Math.min(5,Number(input.difficulty??3)));
  const difficultyWeight=.8+(difficulty-1)*.1;
  const sourceWeights:Record<string,number>={EXERCISE:.9,UNIT_QUIZ:1.2,SKILL_LAB:1,SMART_REVIEW:1.05,VOCABULARY_REVIEW:1,PLACEMENT:1.25,WRITING_COACH:1.15,REAL_GERMANY:1.15,ASSESSMENT:1.2,PROGRESS:.75,MANUAL:1};
  return {evidenceScore:clamp(score),evidenceWeight:Math.max(.5,Math.min(1.6,(sourceWeights[input.source]??1)*difficultyWeight))};
}
export function evolveSnapshot(input:{previousScore:number|null;evidenceCount:number;evidenceScore:number;evidenceWeight:number;correct?:boolean|null}) {
  const next=input.evidenceCount+1;
  if(input.previousScore===null||input.evidenceCount===0) return {score:Math.round(input.evidenceScore*10)/10,evidenceCount:next,confidence:Math.round((1-Math.exp(-next/5))*1000)/1000};
  const alpha=Math.max(.16,Math.min(.46,.18+.07*input.evidenceWeight+(input.correct===false?.08:0)));
  const score=input.previousScore*(1-alpha)+input.evidenceScore*alpha;
  return {score:Math.round(clamp(score)*10)/10,evidenceCount:next,confidence:Math.round((1-Math.exp(-next/5))*1000)/1000};
}
