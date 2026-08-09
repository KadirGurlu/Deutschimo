import { CmsEntityType, CmsWorkflowStatus, type CmsContentRecord } from "@prisma/client";
import { courseAliases, courses } from "@/data/courses";
import { exercises, quizzes } from "@/data/exercises";
import { slides } from "@/data/slides";
import { units } from "@/data/units";
import { prisma } from "@/lib/db";
import type { Course, Unit } from "@/types/course";
import type { Exercise } from "@/types/exercise";
import type { LessonSlide } from "@/types/learning";
import type { RichVocabularyItem } from "@/types/content";

const obj=(value:unknown):Record<string,unknown> =>
  value&&typeof value==="object"&&!Array.isArray(value)?value as Record<string,unknown>:{};

function courseFrom(record:CmsContentRecord):Course|null {
  const p=obj(record.payload); const id=String(p.id??record.courseKey??""); if(!id) return null;
  return {
    id,slug:String(p.slug??id),title:String(p.title??record.title),description:String(p.description??""),
    level:String(p.level??record.level??"A1") as Course["level"],
    status:record.status===CmsWorkflowStatus.PUBLISHED&&record.active?"PUBLISHED":"DRAFT",
    estimatedHours:Number(p.estimatedHours??40),unitCount:Number(p.unitCount??0),
    completionRules:(p.completionRules??{requireAllSlides:true,requireAllExercises:true,requireUnitQuiz:true,minimumQuizScore:70,requireWritingAssignment:false,requireTeacherApproval:false}) as Course["completionRules"],
    createdAt:String(p.createdAt??record.createdAt.toISOString()),updatedAt:record.updatedAt.toISOString(),
  };
}
function unitFrom(record:CmsContentRecord):Unit|null {
  const p=obj(record.payload); const id=String(p.id??record.unitKey??""); const courseId=String(p.courseId??record.courseKey??""); if(!id||!courseId)return null;
  return {
    id,courseId,order:Number(p.order??1),slug:String(p.slug??id),title:String(p.title??record.title),
    description:String(p.description??""),estimatedMinutes:Number(p.estimatedMinutes??120),
    status:record.status===CmsWorkflowStatus.PUBLISHED&&record.active?"PUBLISHED":"DRAFT",
    prerequisiteUnitId:p.prerequisiteUnitId?String(p.prerequisiteUnitId):undefined,
    progressWeights:(p.progressWeights??{lessons:40,exercises:40,quiz:20}) as Unit["progressWeights"],
    completionRules:(p.completionRules??{requireAllSlides:true,requireAllExercises:true,requireUnitQuiz:true,minimumQuizScore:70,requireWritingAssignment:false,requireTeacherApproval:false}) as Unit["completionRules"],
    createdAt:String(p.createdAt??record.createdAt.toISOString()),updatedAt:record.updatedAt.toISOString(),
  };
}

export async function getCourses() {
  const rows=await prisma.cmsContentRecord.findMany({where:{entityType:CmsEntityType.COURSE}});
  if(!rows.length) return courses.filter((c)=>c.status==="PUBLISHED");
  const mapped=rows.map(courseFrom).filter((x):x is Course=>Boolean(x));
  return mapped.filter((c)=>c.status==="PUBLISHED");
}
export async function getCourseBySlug(slug:string) {
  const normalized=courseAliases[slug]??slug.toLowerCase();
  const rows=await prisma.cmsContentRecord.findMany({where:{entityType:CmsEntityType.COURSE}});
  for(const row of rows){const c=courseFrom(row);if(c&&(c.id===normalized||c.slug===normalized))return c;}
  return courses.find((c)=>c.id===normalized||c.slug===normalized);
}
export async function getCourseUnits(courseId:string) {
  const rows=await prisma.cmsContentRecord.findMany({where:{entityType:CmsEntityType.UNIT,courseKey:courseId},orderBy:{createdAt:"asc"}});
  if(!rows.length) return units.filter((u)=>u.courseId===courseId&&u.status==="PUBLISHED").sort((a,b)=>a.order-b.order);
  return rows.map(unitFrom).filter((x):x is Unit=>Boolean(x)).filter((u)=>u.status==="PUBLISHED").sort((a,b)=>a.order-b.order);
}
export async function getUnitById(unitId:string) {
  const rows=await prisma.cmsContentRecord.findMany({where:{entityType:CmsEntityType.UNIT}});
  for(const row of rows){const u=unitFrom(row);if(u&&(u.id===unitId||u.slug===unitId))return u;}
  return units.find((u)=>u.id===unitId||u.slug===unitId);
}
export async function getUnitSlides(unitId:string) {
  const [lessonRows,assets]=await Promise.all([
    prisma.cmsContentRecord.findMany({where:{entityType:CmsEntityType.LESSON,unitKey:unitId},orderBy:{createdAt:"asc"}}),
    prisma.cmsContentRecord.findMany({where:{unitKey:unitId,entityType:{in:[CmsEntityType.VOCABULARY,CmsEntityType.LISTENING]}},orderBy:{createdAt:"asc"}}),
  ]);
  let result:LessonSlide[]=lessonRows.length
    ? lessonRows.filter((r)=>r.status===CmsWorkflowStatus.PUBLISHED&&r.active).map((r)=>r.payload as unknown as LessonSlide).sort((a,b)=>a.order-b.order)
    : slides.filter((s)=>s.unitId===unitId&&s.status==="PUBLISHED").sort((a,b)=>a.order-b.order);
  result=result.map((slide)=>({...slide,contentBlocks:slide.contentBlocks.map((block)=>{
    if(block.type==="vocabulary_list"){
      const all=assets.filter((r)=>r.entityType===CmsEntityType.VOCABULARY&&obj(r.payload).sourceSlideId===slide.id&&obj(r.payload).sourceBlockId===block.id);
      if(!all.length)return block;
      const vocabularyItems=all.filter((r)=>r.status===CmsWorkflowStatus.PUBLISHED&&r.active).map((r)=>obj(r.payload).item as RichVocabularyItem).filter(Boolean);
      return {...block,vocabularyItems};
    }
    if(block.type==="listening_text"){
      const row=assets.find((r)=>r.entityType===CmsEntityType.LISTENING&&r.status===CmsWorkflowStatus.PUBLISHED&&r.active&&obj(r.payload).sourceSlideId===slide.id&&obj(r.payload).sourceBlockId===block.id);
      const next=row?obj(row.payload).block:null;
      return next&&typeof next==="object"?next as typeof block:block;
    }
    return block;
  })}));
  return result;
}
export async function getUnitExercises(unitId:string) {
  const rows=await prisma.cmsContentRecord.findMany({where:{entityType:CmsEntityType.QUESTION,unitKey:unitId},orderBy:{createdAt:"asc"}});
  if(!rows.length)return exercises.filter((e)=>e.unitId===unitId).sort((a,b)=>a.order-b.order);
  return rows.filter((r)=>r.status===CmsWorkflowStatus.PUBLISHED&&r.active).map((r)=>r.payload as unknown as Exercise).sort((a,b)=>a.order-b.order);
}
export async function getUnitQuiz(unitId:string) { return quizzes.find((q)=>q.unitId===unitId); }
