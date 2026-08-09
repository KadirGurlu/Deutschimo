import { NextResponse } from "next/server";
import { getApiUser } from "@/lib/auth/authorization";
import { isContentEditor, qualitySummary } from "@/lib/admin/content-cms";
import { prisma } from "@/lib/db";
import { withApiMonitoring } from "@/lib/security/api-monitor";
async function GETHandler() {
  const user=await getApiUser();
  if(!user||!isContentEditor(user.role)) return NextResponse.json({error:"Yetkisiz işlem."},{status:403});
  const [levels,rows]=await Promise.all([
    qualitySummary(),
    prisma.cmsContentRecord.groupBy({by:["status"],where:{status:{not:"ARCHIVED"}},_count:{_all:true}}),
  ]);
  return NextResponse.json({levels,workflow:rows.map((row)=>({status:row.status,count:row._count._all}))});
}
export const GET=withApiMonitoring("/api/admin/content-studio/quality",GETHandler);
