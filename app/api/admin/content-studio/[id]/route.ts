import { CmsQualityTier, CmsWorkflowStatus, Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { getApiUser } from "@/lib/auth/authorization";
import { canTransition, isContentEditor } from "@/lib/admin/content-cms";
import { prisma } from "@/lib/db";
import { withApiMonitoring } from "@/lib/security/api-monitor";
import { writeAuditLog } from "@/lib/security/audit";
import { requestSecurityContext } from "@/lib/security/request";

const statuses=new Set(Object.values(CmsWorkflowStatus));
const qualities=new Set(Object.values(CmsQualityTier));

async function PATCHHandler(request:Request,context:{params:Promise<{id:string}>}) {
  const user=await getApiUser();
  if(!user||!isContentEditor(user.role)) return NextResponse.json({error:"Yetkisiz işlem."},{status:403});
  const {id}=await context.params;
  const before=await prisma.cmsContentRecord.findUnique({where:{id}});
  if(!before) return NextResponse.json({error:"İçerik bulunamadı."},{status:404});
  const body=await request.json() as Record<string,unknown>;
  const data:Prisma.CmsContentRecordUpdateInput={updatedById:user.id};
  if(typeof body.title==="string"&&body.title.trim()) data.title=body.title.trim();
  if(typeof body.active==="boolean") data.active=body.active;
  if(body.payload&&typeof body.payload==="object") data.payload=body.payload as Prisma.InputJsonValue;
  if(typeof body.qualityTier==="string"&&qualities.has(body.qualityTier as CmsQualityTier)) data.qualityTier=body.qualityTier as CmsQualityTier;
  if(typeof body.status==="string"&&statuses.has(body.status as CmsWorkflowStatus)){
    const next=body.status as CmsWorkflowStatus;
    if(!canTransition(before.status,next)) return NextResponse.json({error:`Geçersiz yayın geçişi: ${before.status} → ${next}`},{status:400});
    if(next===CmsWorkflowStatus.PUBLISHED&&before.qualityTier===CmsQualityTier.REVIEW_REQUIRED) return NextResponse.json({error:"Kalite kontrolü gereken içerik yayınlanamaz."},{status:400});
    data.status=next;
    if(next===CmsWorkflowStatus.PUBLISHED) data.publishedAt=new Date();
  }
  const version=before.version+1;
  const record=await prisma.$transaction(async(tx)=>{
    const updated=await tx.cmsContentRecord.update({where:{id},data:{...data,version}});
    await tx.cmsContentRevision.create({data:{
      contentId:id,version,status:updated.status,snapshot:updated.payload,actorUserId:user.id,
      changeNote:typeof body.changeNote==="string"?body.changeNote.slice(0,300):"İçerik güncellendi.",
    }});
    return updated;
  });
  await writeAuditLog({
    actorUserId:user.id,actorEmail:user.email,action:"CMS_CONTENT_UPDATE",entityType:`Cms${record.entityType}`,
    entityId:record.id,summary:`${record.title} güncellendi · v${record.version}.`,before,after:record,
    ipHash:requestSecurityContext(request).ipHash,
  });
  return NextResponse.json({record});
}
export const PATCH=withApiMonitoring("/api/admin/content-studio/[id]",PATCHHandler);
