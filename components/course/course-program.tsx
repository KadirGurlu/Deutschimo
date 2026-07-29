"use client";

import Link from "next/link";
import { ArrowRight, BookOpenCheck, Clock3, RefreshCcw } from "lucide-react";
import { CourseProgressHeader } from "@/components/course/course-progress-header";
import { UnitLearningPath } from "@/components/course/unit-learning-path";
import { useLearningProgress } from "@/hooks/use-learning-progress";
import type { Course } from "@/types/course";
import { Footer } from "@/components/layout/footer";
const courseOutcomes: Record<string, string[]> = {
  a1: [
    "Günlük ve tanıdık durumlarda temel iletişim kurmak",
    "Kendini, aileni, evini, eğitimini ve günlük programını anlatmak",
    "Basit sipariş, alışveriş, yön tarifi ve seyahat işlemlerini yönetmek",
    "Temel Präsens, modal fiiller, Akkusativ/Dativ ve Perfekt yapılarını kullanmak",
  ],
  a2: [
    "Geçmiş deneyimleri ve gelecek planlarını bağlantılı biçimde anlatmak",
    "weil, dass, wenn, obwohl, damit ve relatif cümleleri kullanmak",
    "Başvuru, resmî işlem, sağlık, seyahat ve kültür konularında iletişim kurmak",
    "Kısa e-posta, davet, değerlendirme ve plan metinleri yazmak",
  ],
  b1: [
    "Bağımsız ve bağlantılı biçimde deneyim, görüş ve plan anlatmak",
    "Pasif, Konjunktiv II, geçmiş zamanlar ve gelişmiş bağlaçları kullanmak",
    "Resmî yazışma, sunum, başvuru ve argümantasyon metni oluşturmak",
    "Kaynakları değerlendirmek ve gündelik-toplumsal konuları tartışmak",
  ],
  b2: [
    "Akademik ve profesyonel metinleri analiz edip yapılandırılmış biçimde üretmek",
    "Nominal stil, dolaylı anlatım, pasif alternatifleri ve karmaşık bağlaçları kullanmak",
    "Grafik, araştırma, politika, ekonomi ve medya içeriklerini eleştirel değerlendirmek",
    "Temkinli iddia, karşı görüş ve kanıta dayalı sonuç geliştirmek",
  ],
};


export function CourseProgram({ course }: { course: Course }) {
  const store = useLearningProgress(course);
  const position = store.state.learningPositions[course.id];
  const firstAvailable = store.units.find((unit) => store.getStatus(unit.id) !== "LOCKED");
  const continueUnit = position ? store.units.find((unit) => unit.id === position.unitId) : firstAvailable;
  const continueHref = position?.stage === "EXERCISES" ? `/learn/${course.id}/${position.unitId}/exercises` : position?.stage === "QUIZ" ? `/learn/${course.id}/${position.unitId}/quiz` : continueUnit ? `/learn/${course.id}/${continueUnit.id}` : `/courses/${course.slug}`;

  return <>
    <section className="page-hero compact-page-hero"><div className="container"><CourseProgressHeader course={course} percent={store.coursePercent} completed={store.completedCount} total={store.units.length}/></div></section>
    <main className="container program-page">
      <section className="continue-learning-banner">
        <div><span className="eyebrow">KALDIĞIN YERDEN DEVAM ET</span><h2>{continueUnit ? continueUnit.title : "Programa başlamaya hazırsın"}</h2><p>{position ? `${position.stage === "LESSONS" ? "Ders Notları" : position.stage === "EXERCISES" ? "Alıştırmalar" : position.stage === "QUIZ" ? "Ünite sonu testi" : "Tamamlandı"} aşamasındasın.` : "İlk üniteyi açarak öğrenme yoluna başlayabilirsin."}</p></div>
        <Link className="button button-primary" href={continueHref}>Devam Et <ArrowRight size={18}/></Link>
      </section>

      <div className="program-layout">
        <section><div className="section-head"><div><span className="eyebrow">ÖĞRENME YOLU</span><h2 className="section-title">{store.units.length} yapılandırılmış ünite</h2><p className="section-copy">Her ünitede 6 ders slaytı, 8 adım alıştırma ve bir ünite sonu değerlendirmesi bulunur.</p></div></div>
          <UnitLearningPath units={store.units} progressMap={store.unitProgressMap} getStatus={store.getStatus} content={store.content}/>
        </section>
        <aside className="program-side">
          <section className="panel"><BookOpenCheck size={23}/><h3>Kurs kazanımları</h3><ul className="check-list compact-check-list">{courseOutcomes[course.id].map((outcome) => <li key={outcome}>{outcome}</li>)}</ul></section>
          <section className="panel"><Clock3 size={23}/><h3>Son aktivite</h3><p>{store.state.activities[0] ? new Intl.DateTimeFormat("tr-TR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(store.state.activities[0].createdAt)) : "Henüz öğrenme aktivitesi yok."}</p></section>
          <button className="button button-secondary subtle-reset" onClick={store.reset}><RefreshCcw size={17}/> Demo ilerlemesini sıfırla</button>
        </aside>
      </div>
    </main><Footer/>
  </>;
}
