import { auth } from "@/auth";
import { recordMasteryEvidence } from "@/lib/mastery/server";
import { inferMasterySkill, inferMasteryTags, normalizeSkill } from "@/lib/mastery/skill-tags";
import type { MasteryEvidenceSource, MasterySkill } from "@/types/mastery";
type R=Record<string,unknown>;
const rec=(v:unknown):R=>v&&typeof v==="object"&&!Array.isArray(v)?v as R:{};
function deep(v:unknown,keys:string[]):unknown{const q=[v],seen=new Set<unknown>();while(q.length){const c=q.shift();if(!c||typeof c!=="object"||seen.has(c))continue;seen.add(c);const o=rec(c);for(const k of keys)if(o[k]!==undefined&&o[k]!==null)return o[k];for(const x of Object.values(o))if(x&&typeof x==="object")q.push(x);}return undefined;}
const str=(...v:unknown[])=>v.find(x=>typeof x==="string"&&x.trim()) as string|undefined;
const num=(...v:unknown[])=>{for(const x of v){const n=typeof x==="number"?x:typeof x==="string"?Number(x):NaN;if(Number.isFinite(n))return n;}return null;};
const bool=(...v:unknown[])=>{for(const x of v){if(typeof x==="boolean")return x;if(x===1||x==="true")return true;if(x===0||x==="false")return false;}return null;};
function course(v:unknown){const s=str(v);if(!s)return null;const m=s.toLowerCase().match(/\b(a1|a2|b1|b2)\b/);return m?.[1]??s.toLowerCase().slice(0,40);}
function source(s:string):MasteryEvidenceSource{const u=s.toUpperCase();if(/VOCAB/.test(u))return"VOCABULARY_REVIEW";if(/WRITING/.test(u))return"WRITING_COACH";if(/REAL.GERMANY/.test(u))return"REAL_GERMANY";if(/PLACEMENT/.test(u))return"PLACEMENT";if(/SMART|INTELLIGENCE.REVIEW/.test(u))return"SMART_REVIEW";if(/SKILL/.test(u))return"SKILL_LAB";if(/ASSESSMENT/.test(u))return"ASSESSMENT";if(/QUIZ/.test(u))return"UNIT_QUIZ";if(/PROGRESS/.test(u))return"PROGRESS";return"EXERCISE";}
function multi(v:unknown){const out:Array<{skill:MasterySkill;score:number}>=[];const c=deep(v,["skillScores","scores","rubricScores"]);if(Array.isArray(c))for(const x of c){const o=rec(x),skill=normalizeSkill(o.skill??o.name??o.dimension),score=num(o.score,o.value,o.percent);if(skill&&score!==null)out.push({skill,score});}else if(c&&typeof c==="object")for(const[k,val]of Object.entries(rec(c))){const skill=normalizeSkill(k),score=num(val);if(skill&&score!==null)out.push({skill,score});}
  const direct:Array<[string[],MasterySkill]>=[[["vocabularyScore","wortschatzScore"],"VOCABULARY"],[["grammarScore","formScore"],"GRAMMAR"],[["readingScore"],"READING"],[["listeningScore"],"LISTENING"],[["writingScore"],"WRITING"],[["speakingScore"],"SPEAKING"]];
  for(const[k,skill]of direct){const score=num(deep(v,k));if(score!==null&&!out.some(x=>x.skill===skill))out.push({skill,score});}return out;}
export async function captureMasteryExchange(input:{source:string;requestBody:unknown;responseBody?:unknown}):Promise<void>{
  const session=await auth();const userId=(session?.user as {id?:string}|undefined)?.id;if(!userId)return;
  const request=rec(input.requestBody),response=rec(input.responseBody),src=source(input.source);
  const courseId=course(deep(request,["courseId","course","level"])??deep(response,["courseId","course","level"]));if(!courseId)return;
  const unitId=str(deep(request,["unitId","unit"]),deep(response,["unitId","unit"]))??null;
  const externalId=str(deep(response,["attemptId","evidenceId","id"]),deep(request,["attemptId","evidenceId"]))??null;
  const qid=str(deep(request,["questionId","exerciseId","itemId","taskId","scenarioId"]),deep(response,["questionId","exerciseId","itemId","taskId","scenarioId"]),externalId)??`${src}:${unitId??courseId}:${Date.now()}`;
  const scores=multi(response);
  if(scores.length){await Promise.all(scores.map(({skill,score})=>recordMasteryEvidence(userId,{courseId,unitId,questionId:`${qid}:${skill.toLowerCase()}`,skill,tags:inferMasteryTags({skill,courseId,unitId,prompt:qid}),score,correct:null,source:src,externalId:externalId?`${externalId}:${skill}`:null})));return;}
  const score=num(deep(response,["score","overallScore","percent","mastery"]),deep(request,["score","percent"]));
  const correct=bool(deep(response,["correct","isCorrect","passed"]),deep(request,["correct","isCorrect"]));if(score===null&&correct===null)return;
  const skill=inferMasterySkill({explicit:deep(request,["masterySkill","skill"])??deep(response,["masterySkill","skill"]),source:input.source,prompt:deep(request,["prompt","question","title"]),section:deep(request,["section","kind","type"])});
  await recordMasteryEvidence(userId,{courseId,unitId,questionId:qid,skill,tags:inferMasteryTags({skill,courseId,unitId,prompt:deep(request,["prompt","question","title"]),section:deep(request,["section","kind","type"]),existing:deep(request,["masteryTags","tags"])??deep(response,["masteryTags","tags"])}),score:score??undefined,correct,responseMs:num(deep(request,["responseMs","durationMs","elapsedMs"])),hintUsed:bool(deep(request,["hintUsed","usedHint"]))??false,confidence:str(deep(request,["confidence"]))??null,difficulty:num(deep(request,["difficulty"])),source:src,externalId});
}
