import { notFound } from "next/navigation";
import { UnitQuiz } from "@/components/exercises/unit-quiz";
import { getCourseBySlug, getCourseUnits, getUnitById } from "@/lib/services/course-service";

export default async function QuizPage({ params }: { params: Promise<{ courseId: string; unitId: string }> }) {
  const { courseId, unitId } = await params;
  const course = await getCourseBySlug(courseId);
  const unit = await getUnitById(unitId);
  if (!course || !unit || unit.courseId !== course.id) notFound();
  const courseUnits = await getCourseUnits(course.id);
  const nextUnitId = courseUnits.find((item) => item.order === unit.order + 1)?.id;
  return <UnitQuiz course={course} unit={unit} nextUnitId={nextUnitId}/>;
}
