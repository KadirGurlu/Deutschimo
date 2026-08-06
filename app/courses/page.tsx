import { BookOpenText, Dumbbell } from "lucide-react";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { CourseCard } from "@/components/course/course-card";
import { courses } from "@/data/mock";
import { requireUser } from "@/lib/auth/authorization";

export default async function CoursesPage() {
  await requireUser();
  const totalUnits = courses.reduce((sum, course) => sum + course.lessons, 0);
  const totalExercises = courses.reduce((sum, course) => sum + course.exercises, 0);

  return <div className="dashboard-shell">
    <AppSidebar active="courses" />
    <section className="dashboard-main v26-courses-page">
      <div className="v26-courses-hero">
        <div>
          <span className="eyebrow">KURSLAR</span>
          <h1 className="section-title">Almanca öğrenme yolunu seç</h1>
          <p className="section-copy">A1'den B2'ye bütün programları görüntüle. Bir kursa tıkladığında ünitelerini, ders içeriğini ve kendi ilerlemeni görebilirsin.</p>
        </div>
        <div className="v26-catalog-summary" aria-label="Kurs kataloğu özeti">
          <span><BookOpenText size={19}/><strong>{totalUnits}</strong> ünite</span>
          <span><Dumbbell size={19}/><strong>{totalExercises}</strong> alıştırma</span>
        </div>
      </div>

      <div className="course-grid v26-course-grid">
        {courses.map((course) => <CourseCard key={course.slug} course={course}/>) }
      </div>
    </section>
  </div>;
}
