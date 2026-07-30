import type { Course, CourseLevel } from "@/types/course";

const now = "2026-07-29T00:00:00.000Z";
const defaultRules = {
  requireAllSlides: true,
  requireAllExercises: true,
  requireUnitQuiz: true,
  minimumQuizScore: 70,
  requireWritingAssignment: false,
  requireTeacherApproval: false,
} as const;

export const courses: Course[] = [
  {
    id: "a1",
    slug: "a1",
    title: "A1 · Almancaya Başlangıç",
    description: "Temel iletişim becerileri için yapılandırılmış, slayt tabanlı başlangıç programı.",
    level: "A1",
    status: "PUBLISHED",
    estimatedHours: 48,
    unitCount: 12,
    completionRules: { ...defaultRules },
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "a2",
    slug: "a2",
    title: "A2 · Temel İletişim",
    description: "Günlük yaşamda daha ayrıntılı iletişim kurmaya hazırlayan yapılandırılmış program.",
    level: "A2",
    status: "PUBLISHED",
    estimatedHours: 72,
    unitCount: 16,
    completionRules: { ...defaultRules },
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "b1",
    slug: "b1",
    title: "B1 · Bağımsız Dil Kullanımı",
    description: "Okuma, yazma ve bağımsız iletişim becerilerini sistemli şekilde geliştiren program.",
    level: "B1",
    status: "PUBLISHED",
    estimatedHours: 96,
    unitCount: 18,
    completionRules: { ...defaultRules, requireWritingAssignment: true },
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "b2",
    slug: "b2",
    title: "B2 · Akademik ve Profesyonel Almanca",
    description: "Karmaşık metinler, akademik anlatım ve profesyonel iletişim için ileri program.",
    level: "B2",
    status: "PUBLISHED",
    estimatedHours: 128,
    unitCount: 20,
    completionRules: { ...defaultRules, requireWritingAssignment: true },
    createdAt: now,
    updatedAt: now,
  },
];

export const courseOrder: CourseLevel[] = ["A1", "A2", "B1", "B2"];

export const courseAliases: Record<string, string> = {
  "a1-temel-almanca": "a1",
  "a2-gunluk-almanca": "a2",
  "b1-bagimsiz-almanca": "b1",
  "b2-akademik-almanca": "b2",
};
