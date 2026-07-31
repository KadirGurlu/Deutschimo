import type { NextAuthConfig } from "next-auth";

const protectedPrefixes = ["/dashboard", "/progress", "/profile", "/vocabulary", "/writing", "/exams", "/learn", "/admin"];

export default {
  pages: { signIn: "/auth" },
  providers: [],
  callbacks: {
    authorized({ auth, request }) {
      const needsAuthentication = protectedPrefixes.some((prefix) => request.nextUrl.pathname.startsWith(prefix));
      return needsAuthentication ? Boolean(auth?.user) : true;
    },
  },
} satisfies NextAuthConfig;
