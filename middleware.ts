import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import authConfig, { isProtectedPath } from "@/auth.config";

const { auth } = NextAuth(authConfig);
const unsafeMethods = new Set(["POST", "PUT", "PATCH", "DELETE"]);
const csrfExemptPrefixes = ["/api/auth/", "/api/cron/"];

// V46.5 AUTHORIZATION & SECURITY BOUNDARIES
// V46.5.2 preserves the V31 middleware API-version contract.
const adminRoles = new Set(["ADMIN", "SUPER_ADMIN"]);
const privateApiPrefixes = [
  "/api/account",
  "/api/assessment",
  "/api/intelligence",
  "/api/profile",
  "/api/progress",
  "/api/skills",
  "/api/vocabulary",
] as const;

function matchesPrefix(pathname: string, prefix: string) {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

function requestId(request: Request) {
  const supplied = request.headers.get("x-request-id")?.trim() ?? "";
  return /^[A-Za-z0-9._:-]{8,128}$/u.test(supplied) ? supplied : crypto.randomUUID();
}

function expectedHost(request: Request) {
  return (
    request.headers.get("x-forwarded-host")?.split(",")[0]?.trim() ||
    request.headers.get("host")?.trim() ||
    new URL(request.url).host
  ).toLowerCase();
}

function violatesSameOrigin(request: Request) {
  const url = new URL(request.url);
  if (!url.pathname.startsWith("/api/") || !unsafeMethods.has(request.method.toUpperCase())) return false;
  if (csrfExemptPrefixes.some((prefix) => url.pathname.startsWith(prefix))) return false;
  if (request.headers.get("sec-fetch-site") === "cross-site") return true;
  const origin = request.headers.get("origin");
  if (!origin) return false; // trusted server-to-server calls may omit Origin

  try {
    return new URL(origin).host.toLowerCase() !== expectedHost(request);
  } catch {
    return true;
  }
}

function apiBoundaryResponse(error: string, status: number, id: string, pathname: string) {
  const response = NextResponse.json(
    { error, requestId: id },
    {
      status,
      headers: {
        "x-request-id": id,
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      },
    },
  );
  if (pathname.startsWith("/api/v1/")) response.headers.set("x-deutschimo-api-version", "v1");
  return response;
}

export const middleware = auth((request) => {
  const id = requestId(request);
  const pathname = request.nextUrl.pathname;
  const sessionUser = request.auth?.user;
  const isSignedIn = Boolean(sessionUser && sessionUser.status !== "SUSPENDED");
  const isAdmin = Boolean(isSignedIn && adminRoles.has(String(sessionUser?.role)));

  if (violatesSameOrigin(request)) {
    return apiBoundaryResponse("İstek kaynağı doğrulanamadı.", 403, id, pathname);
  }

  // Guest -> no private/admin API access.
  if (matchesPrefix(pathname, "/api/admin")) {
    if (!isSignedIn) return apiBoundaryResponse("Oturum gerekli.", 401, id, pathname);
    if (!isAdmin) return apiBoundaryResponse("Bu işlem için yönetici yetkisi gerekli.", 403, id, pathname);
  } else if (privateApiPrefixes.some((prefix) => matchesPrefix(pathname, prefix))) {
    if (!isSignedIn) return apiBoundaryResponse("Oturum gerekli.", 401, id, pathname);
  }

  // Student/non-admin -> no admin UI access. This is server middleware, not UI hiding.
  if (matchesPrefix(pathname, "/admin") && isSignedIn && !isAdmin) {
    const dashboardUrl = new URL("/dashboard", request.url);
    return NextResponse.redirect(dashboardUrl);
  }

  const forwardedHeaders = new Headers(request.headers);
  forwardedHeaders.set("x-request-id", id);
  const response = NextResponse.next({ request: { headers: forwardedHeaders } });
  response.headers.set("x-request-id", id);

  // V31 contract: all /api/v1 responses advertise the platform API version.
  if (pathname.startsWith("/api/v1/")) {
    response.headers.set("x-deutschimo-api-version", "v1");
  }

  if (isProtectedPath(pathname)) {
    response.headers.set("x-robots-tag", "noindex, nofollow, noarchive");
    response.headers.set("Cache-Control", "private, no-store, max-age=0");
  }

  return response;
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
