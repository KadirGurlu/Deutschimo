import { notFound } from "next/navigation";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { CourseProgram } from "@/components/course/course-program";
import { requireUser } from "@/lib/auth/authorization";
import { getCourseBySlug } from "@/lib/services/course-service";

export default async function CoursePage({ params }: { params: Promise<{ slug: string }> }) {
  await requireUser();
  const { slug } = await params;
  const course = await getCourseBySlug(slug);
  if (!course || course.status !== "PUBLISHED") notFound();

  return <div className="dashboard-shell">
    <AppSidebar active="courses" />
    <section className="dashboard-main v26-course-program-shell">
      <CourseProgram course={course}/>
    </section>
  </div>;
}
