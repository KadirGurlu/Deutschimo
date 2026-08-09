import { NextResponse } from "next/server";
import { getApiUser } from "@/lib/auth/authorization";
import { isContentEditor } from "@/lib/admin/content-cms";
import { prisma } from "@/lib/db";
import { withApiMonitoring } from "@/lib/security/api-monitor";
async function GETHandler(_:Request,context:{params:Promise<{id:string}>}) {
  const user=await getApiUser();
  if(!user||!isContentEditor(user.role)) return NextResponse.json({error:"Yetkisiz işlem."},{status:403});
  const {id}=await context.params;
  const revisions=await prisma.cmsContentRevision.findMany({where:{contentId:id},orderBy:{version:"desc"},take:50});
  return NextResponse.json({revisions});
}
export const GET=withApiMonitoring("/api/admin/content-studio/[id]/versions",GETHandler);
