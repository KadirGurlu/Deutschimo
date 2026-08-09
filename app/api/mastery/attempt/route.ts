import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { recordMasteryEvidence } from "@/lib/mastery/server";
import { inferMasterySkill, inferMasteryTags } from "@/lib/mastery/skill-tags";
import type { MasteryEvidenceInput, MasteryEvidenceSource } from "@/types/mastery";
export const runtime="nodejs"; export const dynamic="force-dynamic";
const allowed=new Set<MasteryEvidenceSource>(["EXERCISE","UNIT_QUIZ","SKILL_LAB","SMART_REVIEW","VOCABULARY_REVIEW","PLACEMENT","WRITING_COACH","REAL_GERMANY","ASSESSMENT","PROGRESS","MANUAL"]);
export async function POST(request:Request){
  const session=await auth(); const userId=(session?.user as {id?:string}|undefined)?.id;
  if(!userId)return NextResponse.json({error:"UNAUTHORIZED"},{status:401});
  const body=(await request.json().catch(()=>null)) as Partial<MasteryEvidenceInput>|null;
  if(!body||typeof body.courseId!=="string"||typeof body.questionId!=="string")return NextResponse.json({error:"INVALID_MASTERY_EVIDENCE"},{status:400});
  const source=allowed.has(body.source as MasteryEvidenceSource)?body.source as MasteryEvidenceSource:"EXERCISE";
  const skill=inferMasterySkill({explicit:body.skill,source,prompt:body.questionId});
  const tags=inferMasteryTags({skill,courseId:body.courseId,unitId:body.unitId,existing:body.tags,prompt:body.questionId});
  await recordMasteryEvidence(userId,{courseId:body.courseId,unitId:body.unitId??null,questionId:body.questionId,skill,tags,score:typeof body.score==="number"?body.score:undefined,correct:typeof body.correct==="boolean"?body.correct:null,responseMs:typeof body.responseMs==="number"?body.responseMs:null,hintUsed:Boolean(body.hintUsed),confidence:typeof body.confidence==="string"?body.confidence:null,difficulty:typeof body.difficulty==="number"?body.difficulty:null,source,externalId:typeof body.externalId==="string"?body.externalId:null});
  return NextResponse.json({ok:true,skill,tags});
}
