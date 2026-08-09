import { NextResponse } from "next/server";
import { getCourseBySlug, getUnitById, getUnitExercises, getUnitQuiz, getUnitSlides } from "@/lib/services/course-service";
import { withApiMonitoring } from "@/lib/security/api-monitor";

async function GETHandler(_:Request,context:{params:Promise<{unitId:string}>}) {
  const {unitId}=await context.params;
  const unit=await getUnitById(unitId);
  if(!unit||unit.status!=="PUBLISHED") return NextResponse.json({error:"Yayınlanmış ünite bulunamadı."},{status:404});
  const course=await getCourseBySlug(unit.courseId);
  if(!course||course.status!=="PUBLISHED") return NextResponse.json({error:"Yayınlanmış kurs bulunamadı."},{status:404});
  const [slides,exercises,quiz]=await Promise.all([getUnitSlides(unit.id),getUnitExercises(unit.id),getUnitQuiz(unit.id)]);
  return NextResponse.json({unit,slides,exercises,quiz});
}
export const GET=withApiMonitoring("/api/content/unit/[unitId]",GETHandler);
