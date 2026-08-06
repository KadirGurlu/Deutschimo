import { notFound } from "next/navigation";
import { LessonScreen } from "@/components/learning/lesson-screen";
import { getCourseBySlug, getUnitById } from "@/lib/services/course-service";

export default async function LearnPage({ params }: { params: Promise<{ courseId: string; unitId: string }> }) {
  const { courseId, unitId } = await params;
  const course = await getCourseBySlug(courseId);
  const unit = await getUnitById(unitId);
  if (!course || !unit || unit.courseId !== course.id) notFound();
  return <LessonScreen course={course} unit={unit}/>;
}
