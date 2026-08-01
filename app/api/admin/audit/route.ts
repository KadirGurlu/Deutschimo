import { withApiMonitoring } from "@/lib/security/api-monitor";
import { NextResponse } from "next/server";
import { getApiUser, isAdminRole } from "@/lib/auth/authorization";
import { prisma } from "@/lib/db";
async function GETHandler(request:Request){const user=await getApiUser();if(!user||!isAdminRole(user.role))return NextResponse.json({error:"Yetkisiz işlem."},{status:403});const url=new URL(request.url);const q=url.searchParams.get("q")?.trim()||"";const logs=await prisma.auditLog.findMany({where:q?{OR:[{summary:{contains:q,mode:"insensitive"}},{action:{contains:q,mode:"insensitive"}},{actorEmail:{contains:q,mode:"insensitive"}}]}:{},orderBy:{createdAt:"desc"},take:200});return NextResponse.json({logs});}

export const GET = withApiMonitoring("/api/admin/audit", GETHandler);
