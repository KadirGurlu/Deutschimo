import { courses } from "@/data/mock";

export async function getCourses() {
  return Promise.resolve(courses);
}

export async function getCourseBySlug(slug: string) {
  return Promise.resolve(courses.find((course) => course.slug === slug) ?? courses[0]);
}
