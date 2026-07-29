import { Search, SlidersHorizontal } from "lucide-react";
import { courses } from "@/data/mock";
import { CourseCard } from "@/components/course/course-card";
import { Footer } from "@/components/layout/footer";

export default function CoursesPage() {
  const totalUnits = courses.reduce((sum, course) => sum + course.lessons, 0);
  const totalExercises = courses.reduce((sum, course) => sum + course.exercises, 0);
  return <><section className="page-hero"><div className="container"><span className="eyebrow">KURS KATALOĞU</span><h1>A1'den B2'ye Yapılandırılmış Almanca Programları</h1><p className="section-copy">A1 12, A2 16, B1 18 ve B2 20 ünite. Her ünitede slayt tabanlı ders notları, 8 alıştırma ve ünite sonu testi.</p><div className="search-panel"><div className="header-search"><Search size={19}/><input placeholder="Kurs veya seviye ara"/></div><button className="button button-primary"><Search size={18}/> Ara</button></div></div></section>
    <div className="container catalog-layout"><aside className="filter-panel"><div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}><strong>Filtreler</strong><SlidersHorizontal size={19}/></div><Filter title="Seviye" items={["A1 Başlangıç","A2 Temel","B1 Orta","B2 Orta-İleri"]}/><Filter title="İçerik" items={["Slayt tabanlı ders","Adım adım alıştırma","Ünite testi","İlerleme takibi"]}/><Filter title="Erişim" items={["Ücretsiz","Premium","Sertifikalı"]}/></aside>
      <section><div className="catalog-top"><div><strong>{courses.length} kapsamlı program</strong><div style={{color:"var(--muted)",fontSize:14}}>Toplam {totalUnits} ünite · {totalExercises} alıştırma</div></div><select aria-label="Kurs sıralama"><option>Seviye sırasına göre</option><option>En popüler</option></select></div><div className="course-grid catalog-grid">{courses.map((course) => <CourseCard key={course.slug} course={course}/>)}</div></section></div><Footer/></>;
}
function Filter({ title, items }: { title: string; items: string[] }) { return <div className="filter-group"><strong>{title}</strong>{items.map((item) => <label className="filter-option" key={item}><input type="checkbox"/><span>{item}</span></label>)}</div>; }
