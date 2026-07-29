import { courseAliases, courses } from "@/data/courses";
import { exercises, quizzes } from "@/data/exercises";
import { slides } from "@/data/slides";
import { units } from "@/data/units";

export async function getCourses() {
  return courses.filter((course) => course.status === "PUBLISHED");
}

export async function getCourseBySlug(slug: string) {
  const normalized = courseAliases[slug] ?? slug.toLowerCase();
  return courses.find((course) => course.slug === normalized || course.id === normalized);
}

export async function getCourseUnits(courseId: string) {
  return units.filter((unit) => unit.courseId === courseId && unit.status === "PUBLISHED").sort((a, b) => a.order - b.order);
}

export async function getUnitById(unitId: string) {
  return units.find((unit) => unit.id === unitId || unit.slug === unitId);
}

export async function getUnitSlides(unitId: string) {
  return slides.filter((slide) => slide.unitId === unitId && slide.status === "PUBLISHED").sort((a, b) => a.order - b.order);
}

export async function getUnitExercises(unitId: string) {
  return exercises.filter((exercise) => exercise.unitId === unitId).sort((a, b) => a.order - b.order);
}

export async function getUnitQuiz(unitId: string) {
  return quizzes.find((quiz) => quiz.unitId === unitId);
}
