import { courses as learningCourses } from "@/data/courses";
import { totalExerciseCounts } from "@/data/exercises";
import type { CourseLevel } from "@/types/course";

export type CourseCardData = {
  slug: string;
  title: string;
  level: CourseLevel;
  category: string;
  description: string;
  duration: string;
  lessons: number;
  exercises: number;
  students: string;
  rating: number;
  reviews: number;
  access: "Ücretsiz" | "Premium" | "Sertifikalı Program";
  accent: string;
};

const metadata: Record<CourseLevel, Omit<CourseCardData, "slug" | "title" | "level" | "description" | "lessons" | "exercises">> = {
  A1: { category: "Başlangıç Programı", duration: "12 hafta", students: "2.480", rating: 4.8, reviews: 318, access: "Ücretsiz", accent: "linear-gradient(135deg,#12263A,#214b69)" },
  A2: { category: "Temel İletişim", duration: "16 hafta", students: "1.760", rating: 4.8, reviews: 214, access: "Premium", accent: "linear-gradient(135deg,#16A8B0,#5CE1E6)" },
  B1: { category: "Bağımsız Dil Kullanımı", duration: "18 hafta", students: "1.240", rating: 4.9, reviews: 176, access: "Premium", accent: "linear-gradient(135deg,#172B3A,#3e6479)" },
  B2: { category: "Akademik ve Profesyonel", duration: "20 hafta", students: "820", rating: 4.9, reviews: 129, access: "Sertifikalı Program", accent: "linear-gradient(135deg,#12263A,#16A8B0)" },
};

export const courses: CourseCardData[] = learningCourses.map((course) => ({
  slug: course.slug,
  title: course.title,
  level: course.level,
  description: course.description,
  lessons: course.unitCount,
  exercises: totalExerciseCounts[course.level],
  ...metadata[course.level],
}));

export const navItems = [
  ["Ana Sayfa", "/"], ["Kurslar", "/courses"], ["Dashboard", "/dashboard"], ["İlerleme", "/progress"], ["Sınavlar", "/exams"],
] as const;

export const weeklyStudy = [
  { day: "Pzt", minutes: 32 }, { day: "Sal", minutes: 44 }, { day: "Çar", minutes: 28 }, { day: "Per", minutes: 50 }, { day: "Cum", minutes: 36 }, { day: "Cmt", minutes: 41 }, { day: "Paz", minutes: 18 },
];

export const skills = [
  { label: "Gramer", value: 74 }, { label: "Kelime", value: 61 }, { label: "Okuma", value: 70 }, { label: "Yazma", value: 54 }, { label: "Dinleme", value: 66 }, { label: "Konuşma", value: 49 },
];
