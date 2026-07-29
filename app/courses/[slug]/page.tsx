import { notFound } from "next/navigation";
import { CourseProgram } from "@/components/course/course-program";
import { getCourseBySlug } from "@/lib/services/course-service";

export default async function CoursePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const course = await getCourseBySlug(slug);
  if (!course || course.status !== "PUBLISHED") notFound();
  return <CourseProgram course={course}/>;
}
