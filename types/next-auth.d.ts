import type { DefaultSession } from "next-auth";
import type { Level, UserRole, UserStatus } from "@prisma/client";

declare module "next-auth" {
  interface User {
    role: UserRole;
    status: UserStatus;
    firstName?: string | null;
    lastName?: string | null;
    currentLevel: Level;
    targetLevel: Level;
    dailyGoalMinutes: number;
  }

  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      role: UserRole;
      status: UserStatus;
      firstName?: string | null;
      lastName?: string | null;
      currentLevel: Level;
      targetLevel: Level;
      dailyGoalMinutes: number;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: UserRole;
    status?: UserStatus;
    firstName?: string | null;
    lastName?: string | null;
    currentLevel?: Level;
    targetLevel?: Level;
    dailyGoalMinutes?: number;
  }
}
