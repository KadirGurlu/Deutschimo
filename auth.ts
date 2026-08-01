import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/db";
import { verifyPassword } from "@/lib/auth/password";
import authConfig from "@/auth.config";
import type { NextAuthConfig } from "next-auth";
import { Level, UserRole, UserStatus } from "@prisma/client";
import { checkLoginLimit, recordLoginAttempt } from "@/lib/security/rate-limit";
import { getClientIp } from "@/lib/security/request";

function toUserRole(value: unknown): UserRole {
  return typeof value === "string" && Object.values(UserRole).includes(value as UserRole)
    ? (value as UserRole)
    : UserRole.STUDENT;
}

function toUserStatus(value: unknown): UserStatus {
  return typeof value === "string" && Object.values(UserStatus).includes(value as UserStatus)
    ? (value as UserStatus)
    : UserStatus.ACTIVE;
}

function toLevel(value: unknown, fallback: Level): Level {
  return typeof value === "string" && Object.values(Level).includes(value as Level)
    ? (value as Level)
    : fallback;
}

const providers: NextAuthConfig["providers"] = [
  Credentials({
    name: "E-posta ve şifre",
    credentials: {
      email: { label: "E-posta", type: "email" },
      password: { label: "Şifre", type: "password" },
    },
    async authorize(credentials, request) {
      const email = typeof credentials.email === "string" ? credentials.email.trim().toLowerCase() : "";
      const password = typeof credentials.password === "string" ? credentials.password : "";
      if (!email || !password) return null;
      const ip = getClientIp(request);
      const limit = await checkLoginLimit(email, ip);
      if (!limit.allowed) { await recordLoginAttempt({ emailHash: limit.emailHash, ipHash: limit.ipHash, success: false, reason: "RATE_LIMITED" }); return null; }

      const user = await prisma.user.findUnique({ where: { email } });
      if (!user?.passwordHash || user.status === "SUSPENDED") { await recordLoginAttempt({ emailHash: limit.emailHash, ipHash: limit.ipHash, success: false, reason: user?.status === "SUSPENDED" ? "SUSPENDED" : "UNKNOWN_ACCOUNT" }); return null; }
      if (process.env.REQUIRE_EMAIL_VERIFICATION === "true" && !user.emailVerified) { await recordLoginAttempt({ emailHash: limit.emailHash, ipHash: limit.ipHash, success: false, reason: "UNVERIFIED" }); return null; }
      const valid = await verifyPassword(password, user.passwordHash);
      if (!valid) { await recordLoginAttempt({ emailHash: limit.emailHash, ipHash: limit.ipHash, success: false, reason: "INVALID_PASSWORD" }); return null; }

      await Promise.all([prisma.user.update({ where: { id: user.id }, data: { lastSeenAt: new Date() } }), recordLoginAttempt({ emailHash: limit.emailHash, ipHash: limit.ipHash, success: true, reason: "SUCCESS" })]);
      return {
        id: user.id,
        name: user.name ?? [user.firstName, user.lastName].filter(Boolean).join(" "),
        email: user.email,
        image: user.image,
        role: user.role,
        status: user.status,
        firstName: user.firstName,
        lastName: user.lastName,
        currentLevel: user.currentLevel,
        targetLevel: user.targetLevel,
        dailyGoalMinutes: user.dailyGoalMinutes,
      };
    },
  }),
];

if (process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET) providers.push(Google);

// Keep the adapter type aligned with the NextAuth package used by this app.
// Runtime behavior is unchanged; this only prevents duplicate @auth/core type identities.
const adapter = PrismaAdapter(prisma) as NonNullable<NextAuthConfig["adapter"]>;

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter,
  session: { strategy: "jwt" },
  providers,
  callbacks: {
    ...authConfig.callbacks,
    async signIn({ user, account }) {
      if (account?.provider === "credentials") {
        if (!user.id) return false;
        const databaseUser = await prisma.user.findUnique({ where: { id: user.id }, select: { status: true } });
        return databaseUser?.status !== "SUSPENDED";
      }
      if (!user.email) return true;
      const existing = await prisma.user.findUnique({ where: { email: user.email.toLowerCase() }, select: { status: true } });
      return existing?.status !== "SUSPENDED";
    },
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.status = user.status;
        token.firstName = user.firstName;
        token.lastName = user.lastName;
        token.currentLevel = user.currentLevel;
        token.targetLevel = user.targetLevel;
        token.dailyGoalMinutes = user.dailyGoalMinutes;
      }
      if (!user && token.sub && !token.role) {
        const databaseUser = await prisma.user.findUnique({ where: { id: token.sub }, select: { role:true,status:true,firstName:true,lastName:true,currentLevel:true,targetLevel:true,dailyGoalMinutes:true } });
        if (databaseUser) Object.assign(token, { id: token.sub, ...databaseUser });
      }
      if (trigger === "update" && session?.user) Object.assign(token, session.user);
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = String(token.id ?? token.sub ?? "");
        session.user.role = toUserRole(token.role);
        session.user.status = toUserStatus(token.status);
        session.user.firstName = typeof token.firstName === "string" ? token.firstName : null;
        session.user.lastName = typeof token.lastName === "string" ? token.lastName : null;
        session.user.currentLevel = toLevel(token.currentLevel, Level.A1);
        session.user.targetLevel = toLevel(token.targetLevel, Level.B2);
        session.user.dailyGoalMinutes = Number.isFinite(Number(token.dailyGoalMinutes))
          ? Number(token.dailyGoalMinutes)
          : 30;
      }
      return session;
    },
  },
});
