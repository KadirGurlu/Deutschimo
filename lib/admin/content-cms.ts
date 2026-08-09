import {
  CmsEntityType,
  CmsQualityTier,
  CmsWorkflowStatus,
  Prisma,
  type Level,
} from "@prisma/client";
import { courses } from "@/data/courses";
import { exercises } from "@/data/exercises";
import { slides } from "@/data/slides";
import { units } from "@/data/units";
import { prisma } from "@/lib/db";

const json = (value: unknown) =>
  JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;

export function isContentEditor(role?: string | null) {
  return Boolean(role && ["EDITOR","MODERATOR","ADMIN","SUPER_ADMIN"].includes(role));
}

export async function ensureCmsBaseline(actorUserId?: string | null) {
  await prisma.cmsContentRecord.createMany({
    data: courses.map((course) => ({
      key: `course:${course.id}`,
      entityType: CmsEntityType.COURSE,
      courseKey: course.id,
      level: course.level as Level,
      title: course.title,
      status: CmsWorkflowStatus.PUBLISHED,
      active: true,
      qualityTier: CmsQualityTier.GOLD,
      payload: json(course),
      createdById: actorUserId ?? null,
      updatedById: actorUserId ?? null,
      publishedAt: new Date(),
    })),
    skipDuplicates: true,
  });

  await prisma.cmsContentRecord.createMany({
    data: units.map((unit) => ({
      key: `unit:${unit.id}`,
      entityType: CmsEntityType.UNIT,
      parentKey: `course:${unit.courseId}`,
      courseKey: unit.courseId,
      unitKey: unit.id,
      level: unit.courseId.toUpperCase() as Level,
      title: unit.title,
      status: CmsWorkflowStatus.PUBLISHED,
      active: true,
      qualityTier: CmsQualityTier.GOLD,
      payload: json(unit),
      createdById: actorUserId ?? null,
      updatedById: actorUserId ?? null,
      publishedAt: new Date(),
    })),
    skipDuplicates: true,
  });
}

export async function materializeLegacyUnit(unitId: string, actorUserId?: string | null) {
  await ensureCmsBaseline(actorUserId);
  const base = units.find((unit) => unit.id === unitId);
  if (!base) return;

  const level = base.courseId.toUpperCase() as Level;
  const lessonRows = slides.filter((slide) => slide.unitId === unitId).map((slide) => ({
    key: `lesson:${slide.id}`,
    entityType: CmsEntityType.LESSON,
    parentKey: `unit:${unitId}`,
    courseKey: base.courseId,
    unitKey: unitId,
    level,
    title: slide.title,
    status: slide.status === "PUBLISHED" ? CmsWorkflowStatus.PUBLISHED : CmsWorkflowStatus.DRAFT,
    active: slide.status !== "ARCHIVED",
    qualityTier: CmsQualityTier.GOLD,
    payload: json(slide),
    createdById: actorUserId ?? null,
    updatedById: actorUserId ?? null,
    publishedAt: slide.status === "PUBLISHED" ? new Date() : null,
  }));
  if (lessonRows.length) await prisma.cmsContentRecord.createMany({ data: lessonRows, skipDuplicates: true });

  const questionRows = exercises.filter((item) => item.unitId === unitId).map((item) => ({
    key: `question:${item.id}`,
    entityType: CmsEntityType.QUESTION,
    parentKey: `unit:${unitId}`,
    courseKey: base.courseId,
    unitKey: unitId,
    level,
    title: item.title,
    status: CmsWorkflowStatus.PUBLISHED,
    active: true,
    qualityTier: CmsQualityTier.GOLD,
    payload: json(item),
    createdById: actorUserId ?? null,
    updatedById: actorUserId ?? null,
    publishedAt: new Date(),
  }));
  if (questionRows.length) await prisma.cmsContentRecord.createMany({ data: questionRows, skipDuplicates: true });

  const vocabularyRows: Prisma.CmsContentRecordCreateManyInput[] = [];
  const listeningRows: Prisma.CmsContentRecordCreateManyInput[] = [];

  for (const slide of slides.filter((item) => item.unitId === unitId)) {
    for (const block of slide.contentBlocks) {
      if (block.type === "vocabulary_list" && block.vocabularyItems?.length) {
        block.vocabularyItems.forEach((item, index) => {
          vocabularyRows.push({
            key: `vocab:${slide.id}:${block.id}:${index}`,
            entityType: CmsEntityType.VOCABULARY,
            parentKey: `lesson:${slide.id}`,
            courseKey: base.courseId,
            unitKey: unitId,
            level,
            title: `${item.article ? `${item.article} ` : ""}${item.word}`,
            status: CmsWorkflowStatus.PUBLISHED,
            active: true,
            qualityTier: CmsQualityTier.GOLD,
            payload: json({ sourceSlideId: slide.id, sourceBlockId: block.id, itemOrder: index, item }),
            createdById: actorUserId ?? null,
            updatedById: actorUserId ?? null,
            publishedAt: new Date(),
          });
        });
      }
      if (block.type === "listening_text") {
        listeningRows.push({
          key: `listening:${slide.id}:${block.id}`,
          entityType: CmsEntityType.LISTENING,
          parentKey: `lesson:${slide.id}`,
          courseKey: base.courseId,
          unitKey: unitId,
          level,
          title: block.title ?? `${slide.title} · Dinleme`,
          status: CmsWorkflowStatus.PUBLISHED,
          active: true,
          qualityTier: CmsQualityTier.GOLD,
          payload: json({ sourceSlideId: slide.id, sourceBlockId: block.id, block }),
          createdById: actorUserId ?? null,
          updatedById: actorUserId ?? null,
          publishedAt: new Date(),
        });
      }
    }
  }

  if (vocabularyRows.length) await prisma.cmsContentRecord.createMany({ data: vocabularyRows, skipDuplicates: true });
  if (listeningRows.length) await prisma.cmsContentRecord.createMany({ data: listeningRows, skipDuplicates: true });
}

export async function qualitySummary() {
  await ensureCmsBaseline();
  const rows = await prisma.cmsContentRecord.findMany({
    where: { entityType: CmsEntityType.UNIT, active: true },
    select: { level: true, qualityTier: true },
  });
  const expected = { A1: 12, A2: 16, B1: 18, B2: 20 } as const;
  return (["A1","A2","B1","B2"] as const).map((level) => {
    const gold = rows.filter((row) => row.level === level && row.qualityTier === CmsQualityTier.GOLD).length;
    return { level, gold, expected: expected[level], complete: gold >= expected[level] };
  });
}

export function defaultPayload(type: CmsEntityType, args: {
  title: string;
  courseKey?: string | null;
  unitKey?: string | null;
  level?: Level | null;
}) {
  const now = new Date().toISOString();
  const stamp = Date.now();
  if (type === CmsEntityType.COURSE) {
    const id = (args.courseKey || args.title).toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");
    return {
      id, slug:id, title:args.title, description:"Yeni kurs açıklaması",
      level:args.level ?? "A1", status:"DRAFT", estimatedHours:40, unitCount:0,
      completionRules:{requireAllSlides:true,requireAllExercises:true,requireUnitQuiz:true,minimumQuizScore:70,requireWritingAssignment:false,requireTeacherApproval:false},
      createdAt:now, updatedAt:now,
    };
  }
  if (type === CmsEntityType.UNIT) {
    return {
      id:args.unitKey, courseId:args.courseKey, order:999, slug:`unit-${stamp}`,
      title:args.title, description:"Yeni ünite açıklaması", estimatedMinutes:120, status:"DRAFT",
      progressWeights:{lessons:40,exercises:40,quiz:20},
      completionRules:{requireAllSlides:true,requireAllExercises:true,requireUnitQuiz:true,minimumQuizScore:70,requireWritingAssignment:false,requireTeacherApproval:false},
      createdAt:now, updatedAt:now,
    };
  }
  if (type === CmsEntityType.LESSON) return {
    id:`cms-lesson-${stamp}`, unitId:args.unitKey, order:999, title:args.title,
    contentBlocks:[{id:`cms-text-${stamp}`,type:"text",text:"Yeni ders içeriği."}],
    estimatedMinutes:5,isRequired:true,completionRule:"NEXT_CLICK",status:"DRAFT",
  };
  if (type === CmsEntityType.QUESTION) return {
    id:`cms-question-${stamp}`,unitId:args.unitKey,groupId:`${args.unitKey}-practice`,order:999,
    type:"MULTIPLE_CHOICE",title:args.title,prompt:"Soru metni",
    options:[{id:"a",label:"Seçenek A",value:"Seçenek A"},{id:"b",label:"Seçenek B",value:"Seçenek B"}],
    correctAnswer:"Seçenek B",explanation:"Geri bildirim metni",isRequired:true,maxAttempts:2,points:10,
  };
  if (type === CmsEntityType.VOCABULARY) return {
    sourceSlideId:null,sourceBlockId:null,itemOrder:999,
    item:{word:args.title,meaning:"Türkçe anlam",kind:"Nomen",exampleDe:"Beispielsatz.",exampleTr:"Örnek cümle."},
  };
  return {
    sourceSlideId:null,sourceBlockId:null,
    block:{id:`cms-listening-${stamp}`,type:"listening_text",title:args.title,text:"Dinleme transkripti"},
  };
}

export function canTransition(current: CmsWorkflowStatus, next: CmsWorkflowStatus) {
  if (current === next || next === CmsWorkflowStatus.ARCHIVED) return true;
  return (
    (current === CmsWorkflowStatus.DRAFT && next === CmsWorkflowStatus.REVIEW) ||
    (current === CmsWorkflowStatus.REVIEW && [CmsWorkflowStatus.DRAFT,CmsWorkflowStatus.READY].includes(next)) ||
    (current === CmsWorkflowStatus.READY && [CmsWorkflowStatus.REVIEW,CmsWorkflowStatus.PUBLISHED].includes(next)) ||
    (current === CmsWorkflowStatus.PUBLISHED && next === CmsWorkflowStatus.REVIEW)
  );
}
