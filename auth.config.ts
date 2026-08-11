import type { NextAuthConfig } from "next-auth";

export const protectedPrefixes = [
  "/admin",
  "/competency",
  "/courses",
  "/dashboard",
  "/exams",
  "/learn",
  "/listening",
  "/mistakes",
  "/onboarding",
  "/placement-test",
  "/profile",
  "/progress",
  "/quiz",
  "/reading",
  "/skills",
  "/smart-review",
  "/speaking",
  "/study-plan",
  "/vocabulary",
  "/weak-topics",
  "/writing",
] as const;

export function isProtectedPath(pathname: string) {
  return protectedPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export default {
  pages: { signIn: "/auth?mode=login" },
  providers: [],
  callbacks: {
    session({ session, token }) {
      if (session.user) {
        if (token.id || token.sub) {
          session.user.id = String(token.id ?? token.sub ?? "");
        }
        if (typeof token.role === "string") {
          session.user.role = token.role as typeof session.user.role;
        }
        if (typeof token.status === "string") {
          session.user.status = token.status as typeof session.user.status;
        }
      }
      return session;
    },
    authorized({ auth, request }) {
      if (!isProtectedPath(request.nextUrl.pathname)) return true;
      return Boolean(auth?.user && auth.user.status !== "SUSPENDED");
    },
  },
} satisfies NextAuthConfig;
