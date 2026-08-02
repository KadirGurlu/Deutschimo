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
import { isSessionRevoked } from "@/lib/auth/session-revocation";

const TRUSTED_USER_REFRESH_MS = 5 * 60 * 1000;
const REVOCATION_REFRESH_MS = 60 * 1000;
const trustedUserSelect = {
  role: true,
  status: true,
  firstName: true,
  lastName: true,
  currentLevel: true,
  targetLevel: true,
  dailyGoalMinutes: true,
} as const;

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

async function trustedUser(userId: string) {
  return prisma.user.findUnique({ where: { id: userId }, select: trustedUserSelect });
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
      if (!limit.allowed) {
        await recordLoginAttempt({ emailHash: limit.emailHash, ipHash: limit.ipHash, success: false, reason: "RATE_LIMITED" });
        return null;
      }

      const user = await prisma.user.findUnique({
        where: { email },
        select: {
          id: true,
          name: true,
          firstName: true,
          lastName: true,
          email: true,
          image: true,
          passwordHash: true,
          role: true,
          status: true,
          emailVerified: true,
          currentLevel: true,
          targetLevel: true,
          dailyGoalMinutes: true,
        },
      });

      if (!user?.passwordHash || user.status === UserStatus.SUSPENDED) {
        await recordLoginAttempt({
          emailHash: limit.emailHash,
          ipHash: limit.ipHash,
          success: false,
          reason: user?.status === UserStatus.SUSPENDED ? "SUSPENDED" : "UNKNOWN_ACCOUNT",
        });
        return null;
      }
      if (process.env.REQUIRE_EMAIL_VERIFICATION === "true" && !user.emailVerified) {
        await recordLoginAttempt({ emailHash: limit.emailHash, ipHash: limit.ipHash, success: false, reason: "UNVERIFIED" });
        return null;
      }
      if (!await verifyPassword(password, user.passwordHash)) {
        await recordLoginAttempt({ emailHash: limit.emailHash, ipHash: limit.ipHash, success: false, reason: "INVALID_PASSWORD" });
        return null;
      }

      await Promise.all([
        prisma.user.update({ where: { id: user.id }, data: { lastSeenAt: new Date() } }),
        recordLoginAttempt({ emailHash: limit.emailHash, ipHash: limit.ipHash, success: true, reason: "SUCCESS" }),
      ]);

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

const googleClientId = process.env.AUTH_GOOGLE_ID;
const googleClientSecret = process.env.AUTH_GOOGLE_SECRET;

if (googleClientId && googleClientSecret) {
  providers.push(Google({
    clientId: googleClientId,
    clientSecret: googleClientSecret,
    // Google accounts are linked only after the verified-email check in signIn.
    allowDangerousEmailAccountLinking: true,
  }));
}

// Keeps the adapter type aligned with the NextAuth package used by this app.
const adapter = PrismaAdapter(prisma) as NonNullable<NextAuthConfig["adapter"]>;

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter,
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60, updateAge: 24 * 60 * 60 },
  providers,
  callbacks: {
    ...authConfig.callbacks,
    async signIn({ user, account, profile }) {
      if (account?.provider === "credentials") {
        if (!user.id) return false;
        const databaseUser = await prisma.user.findUnique({ where: { id: user.id }, select: { status: true } });
        return databaseUser?.status !== UserStatus.SUSPENDED;
      }

      if (account?.provider === "google") {
        const emailVerified = Boolean(
          profile &&
          typeof profile === "object" &&
          "email_verified" in profile &&
          profile.email_verified === true,
        );
        if (!emailVerified) return false;
      }

      if (!user.email) return true;
      const existing = await prisma.user.findUnique({
        where: { email: user.email.toLowerCase() },
        select: { status: true },
      });
      return existing?.status !== UserStatus.SUSPENDED;
    },
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id;
        token.role = toUserRole(user.role);
        token.status = toUserStatus(user.status);
        token.firstName = user.firstName ?? null;
        token.lastName = user.lastName ?? null;
        token.currentLevel = toLevel(user.currentLevel, Level.A1);
        token.targetLevel = toLevel(user.targetLevel, Level.B2);
        token.dailyGoalMinutes = Number(user.dailyGoalMinutes ?? 30);
        token.userRefreshedAt = Date.now();
        token.authenticatedAt = Date.now();
        token.revocationCheckedAt = Date.now();
        token.sessionRevoked = false;
      }

      if (!token.authenticatedAt && token.iat) token.authenticatedAt = Number(token.iat) * 1000;
      const userId = String(token.id ?? token.sub ?? "");
      const lastRefresh = Number(token.userRefreshedAt ?? 0);
      const shouldRefresh = Boolean(
        userId &&
        (trigger === "update" || !token.role || Date.now() - lastRefresh >= TRUSTED_USER_REFRESH_MS),
      );

      if (shouldRefresh) {
        const databaseUser = await trustedUser(userId);
        if (databaseUser) {
          Object.assign(token, { id: userId, ...databaseUser, userRefreshedAt: Date.now() });
        } else {
          token.status = UserStatus.SUSPENDED;
          token.userRefreshedAt = Date.now();
        }
      }

      const authenticatedAt = Number(token.authenticatedAt ?? 0);
      const revocationCheckedAt = Number(token.revocationCheckedAt ?? 0);
      if (userId && authenticatedAt && Date.now() - revocationCheckedAt >= REVOCATION_REFRESH_MS) {
        token.sessionRevoked = await isSessionRevoked(userId, authenticatedAt);
        token.revocationCheckedAt = Date.now();
      }
      if (token.sessionRevoked) token.status = UserStatus.SUSPENDED;

      // Never copy client-provided session.update() fields into the signed token.
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
  events: {
    async signIn({ user }) {
      if (!user.id) return;
      await prisma.user.update({ where: { id: user.id }, data: { lastSeenAt: new Date() } }).catch(() => undefined);
    },
  },
});
