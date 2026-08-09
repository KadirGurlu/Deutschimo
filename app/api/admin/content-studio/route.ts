import {
  CmsEntityType,
  CmsQualityTier,
  CmsWorkflowStatus,
  Prisma,
  type Level,
} from "@prisma/client";
import { NextResponse } from "next/server";
import { getApiUser } from "@/lib/auth/authorization";
import { defaultPayload, ensureCmsBaseline, isContentEditor, materializeLegacyUnit } from "@/lib/admin/content-cms";
import { prisma } from "@/lib/db";
import { withApiMonitoring } from "@/lib/security/api-monitor";
import { writeAuditLog } from "@/lib/security/audit";
import { requestSecurityContext } from "@/lib/security/request";

const types = new Set(Object.values(CmsEntityType));
const levels = new Set(["A1","A2","B1","B2"]);

async function GETHandler(request: Request) {
  const user = await getApiUser();
  if (!user || !isContentEditor(user.role)) return NextResponse.json({error:"Yetkisiz işlem."},{status:403});
  await ensureCmsBaseline(user.id);
  const url = new URL(request.url);
  if (url.searchParams.get("catalog") === "1") {
    const rows = await prisma.cmsContentRecord.findMany({
      where:{entityType:{in:[CmsEntityType.COURSE,CmsEntityType.UNIT]},status:{not:CmsWorkflowStatus.ARCHIVED}},
      orderBy:[{entityType:"asc"},{level:"asc"},{createdAt:"asc"}],
    });
    return NextResponse.json({
      courses:rows.filter((row)=>row.entityType===CmsEntityType.COURSE),
      units:rows.filter((row)=>row.entityType===CmsEntityType.UNIT),
    });
  }
  const unitKey = url.searchParams.get("unitKey")?.trim() || null;
  if (unitKey && url.searchParams.get("materialize")==="1") await materializeLegacyUnit(unitKey,user.id);
  const rows = await prisma.cmsContentRecord.findMany({
    where:{...(unitKey?{unitKey}:{}),status:{not:CmsWorkflowStatus.ARCHIVED}},
    orderBy:[{entityType:"asc"},{createdAt:"asc"}],
  });
  return NextResponse.json({records:rows});
}

async function POSTHandler(request: Request) {
  const user = await getApiUser();
  if (!user || !isContentEditor(user.role)) return NextResponse.json({error:"Yetkisiz işlem."},{status:403});
  const body = await request.json() as Record<string,unknown>;
  const raw = String(body.entityType ?? "");
  if (!types.has(raw as CmsEntityType)) return NextResponse.json({error:"Geçersiz içerik türü."},{status:400});
  const entityType = raw as CmsEntityType;
  const title = String(body.title ?? "").trim();
  if (!title) return NextResponse.json({error:"Başlık zorunludur."},{status:400});
  const levelRaw=String(body.level ?? "");
  const level=levels.has(levelRaw)?levelRaw as Level:null;
  const courseKey=String(body.courseKey ?? "").trim()||null;
  const unitKey=String(body.unitKey ?? "").trim()||null;
  const payload = body.payload && typeof body.payload==="object"
    ? body.payload as Prisma.InputJsonValue
    : defaultPayload(entityType,{title,courseKey,unitKey,level}) as Prisma.InputJsonValue;
  const p = payload as Record<string,unknown>;
  const stable = String(p.id ?? `${entityType.toLowerCase()}-${Date.now()}`);
  const key=String(body.key ?? "").trim() || `${entityType.toLowerCase()}:${stable}`;
  try {
    const record=await prisma.$transaction(async(tx)=>{
      const created=await tx.cmsContentRecord.create({data:{
        key,entityType,parentKey:String(body.parentKey ?? "").trim()||null,courseKey,unitKey,level,title,
        status:CmsWorkflowStatus.DRAFT,active:true,qualityTier:CmsQualityTier.STANDARD,payload,
        createdById:user.id,updatedById:user.id,
      }});
      await tx.cmsContentRevision.create({data:{
        contentId:created.id,version:1,status:created.status,snapshot:created.payload === null ? Prisma.JsonNull : (created.payload as Prisma.InputJsonValue),
        actorUserId:user.id,changeNote:"İçerik oluşturuldu.",
      }});
      return created;
    });
    await writeAuditLog({
      actorUserId:user.id,actorEmail:user.email,action:"CMS_CONTENT_CREATE",
      entityType:`Cms${entityType}`,entityId:record.id,summary:`${title} oluşturuldu.`,
      after:record,ipHash:requestSecurityContext(request).ipHash,
    });
    return NextResponse.json({record},{status:201});
  } catch(error) {
    console.error("cms_create_failed",error);
    return NextResponse.json({error:"İçerik oluşturulamadı."},{status:409});
  }
}
export const GET=withApiMonitoring("/api/admin/content-studio",GETHandler);
export const POST=withApiMonitoring("/api/admin/content-studio",POSTHandler);
