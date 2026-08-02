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
    authorized({ auth, request }) {
      if (!isProtectedPath(request.nextUrl.pathname)) return true;
      return Boolean(auth?.user && auth.user.status !== "SUSPENDED");
    },
  },
} satisfies NextAuthConfig;
