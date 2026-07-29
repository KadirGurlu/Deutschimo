import { notFound } from "next/navigation";
import { ExerciseShell } from "@/components/exercises/exercise-shell";
import { getCourseBySlug, getUnitById } from "@/lib/services/course-service";

export default async function ExercisesPage({ params }: { params: Promise<{ courseId: string; unitId: string }> }) {
  const { courseId, unitId } = await params;
  const course = await getCourseBySlug(courseId);
  const unit = await getUnitById(unitId);
  if (!course || !unit || unit.courseId !== course.id) notFound();
  return <ExerciseShell course={course} unit={unit}/>;
}
