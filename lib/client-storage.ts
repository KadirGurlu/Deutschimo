import type { CourseLevel } from "@/types/course";

export const USERS_KEY = "deutschimo-users-v3";
export type RegisteredUser = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  level: CourseLevel;
  targetLevel: CourseLevel;
  role: "Öğrenci" | "Eğitmen" | "İçerik Editörü" | "Yönetici";
  status: "Aktif" | "Askıda";
  createdAt: string;
  lastSeenAt: string;
};

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try { const raw = window.localStorage.getItem(key); return raw ? JSON.parse(raw) as T : fallback; } catch { return fallback; }
}
function writeJson<T>(key: string, value: T) { if (typeof window !== "undefined") window.localStorage.setItem(key, JSON.stringify(value)); }

const demoUsers: RegisteredUser[] = [
  { id: "usr-kadir", firstName: "Kadir", lastName: "Gürlü", email: "kadir@example.com", level: "A1", targetLevel: "B2", role: "Yönetici", status: "Aktif", createdAt: "2026-07-27T10:30:00.000Z", lastSeenAt: "2026-07-29T16:20:00.000Z" },
  { id: "usr-elif", firstName: "Elif", lastName: "Aksoy", email: "elif@example.com", level: "A2", targetLevel: "B1", role: "Öğrenci", status: "Aktif", createdAt: "2026-07-25T09:15:00.000Z", lastSeenAt: "2026-07-29T12:10:00.000Z" },
  { id: "usr-mert", firstName: "Mert", lastName: "Kaya", email: "mert@example.com", level: "B1", targetLevel: "B2", role: "Öğrenci", status: "Aktif", createdAt: "2026-07-22T14:00:00.000Z", lastSeenAt: "2026-07-28T18:05:00.000Z" },
];

export function readUsers(): RegisteredUser[] { const users = readJson<RegisteredUser[]>(USERS_KEY, []); if (users.length) return users; writeJson(USERS_KEY, demoUsers); return demoUsers; }
export function writeUsers(users: RegisteredUser[]) { writeJson(USERS_KEY, users); }
export function registerUser(input: Pick<RegisteredUser, "firstName" | "lastName" | "email" | "level" | "targetLevel">) {
  const existing = readUsers(); const now = new Date().toISOString();
  const next: RegisteredUser = { ...input, id: `usr-${Date.now()}`, role: "Öğrenci", status: "Aktif", createdAt: now, lastSeenAt: now };
  writeUsers([...existing.filter((user) => user.email.toLowerCase() !== input.email.toLowerCase()), next]); return next;
}
