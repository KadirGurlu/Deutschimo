import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import authConfig, { isProtectedPath } from "@/auth.config";

const { auth } = NextAuth(authConfig);
const unsafeMethods = new Set(["POST", "PUT", "PATCH", "DELETE"]);
const csrfExemptPrefixes = ["/api/auth/", "/api/cron/"];

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
  if (!origin) return false;

  try {
    return new URL(origin).host.toLowerCase() !== expectedHost(request);
  } catch {
    return true;
  }
}

export const middleware = auth((request) => {
  const id = requestId(request);
  if (violatesSameOrigin(request)) {
    return NextResponse.json(
      { error: "İstek kaynağı doğrulanamadı.", requestId: id },
      {
        status: 403,
        headers: {
          "x-request-id": id,
          "Cache-Control": "no-store",
          "X-Content-Type-Options": "nosniff",
        },
      },
    );
  }

  const forwardedHeaders = new Headers(request.headers);
  forwardedHeaders.set("x-request-id", id);
  const response = NextResponse.next({ request: { headers: forwardedHeaders } });
  response.headers.set("x-request-id", id);

  if (request.nextUrl.pathname.startsWith("/api/v1/")) {
    response.headers.set("x-deutschimo-api-version", "v1");
  }

  if (isProtectedPath(request.nextUrl.pathname)) {
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
