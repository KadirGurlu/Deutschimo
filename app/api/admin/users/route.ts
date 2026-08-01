import { withApiMonitoring } from "@/lib/security/api-monitor";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getApiUser, isAdminRole } from "@/lib/auth/authorization";

async function GETHandler(request: Request) {
  const currentUser = await getApiUser();
  if (!currentUser || !isAdminRole(currentUser.role)) return NextResponse.json({ error: "Yetkisiz işlem." }, { status: 403 });
  const url = new URL(request.url);
  const query = url.searchParams.get("q")?.trim() ?? "";
  const testFilter = url.searchParams.get("test");
  const page = Math.max(1, Number(url.searchParams.get("page") ?? 1));
  const pageSize = Math.min(100, Math.max(10, Number(url.searchParams.get("pageSize") ?? 25)));
  const searchWhere = query ? {
    OR: [
      { firstName: { contains: query, mode: "insensitive" as const } },
      { lastName: { contains: query, mode: "insensitive" as const } },
      { email: { contains: query, mode: "insensitive" as const } },
    ],
  } : {};
  const where = { AND: [searchWhere, ...(testFilter === "1" ? [{ isTestUser: true }] : testFilter === "0" ? [{ isTestUser: false }] : [])] };
  const [users, total] = await prisma.$transaction([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: { id: true, firstName: true, lastName: true, email: true, role: true, status: true, currentLevel: true, targetLevel: true, createdAt: true, lastSeenAt: true, emailVerified: true, isTestUser:true },
    }),
    prisma.user.count({ where }),
  ]);
  return NextResponse.json({ users, total, page, pageSize });
}

export const GET = withApiMonitoring("/api/admin/users", GETHandler);
