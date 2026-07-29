import { Search, SlidersHorizontal } from "lucide-react";
import { courses } from "@/data/mock";
import { CourseCard } from "@/components/course/course-card";
import { Footer } from "@/components/layout/footer";

export default function CoursesPage() {
  return <>
    <section className="page-hero"><div className="container"><span className="eyebrow">KURS KATALOĞU</span><h1>Almanca Kurslarını Keşfet</h1><p className="section-copy">Seviyene, hedeflediğin beceriye ve hazırladığın sınava göre 48 program arasından seçim yap.</p><div className="search-panel"><div className="header-search"><Search size={19}/><input placeholder="Örn. A1 gramer, TestDaF yazma, iş Almancası"/></div><button className="button button-primary"><Search size={18}/> Ara</button></div></div></section>
    <div className="container catalog-layout">
      <aside className="filter-panel"><div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}><strong>Filtreler</strong><SlidersHorizontal size={19}/></div>
        <Filter title="Seviye" items={["A1 Başlangıç","A2 Temel","B1 Orta","B2 Orta-İleri"]}/>
        <Filter title="Beceri" items={["Gramer","Kelime","Okuma","Yazma","Dinleme","Konuşma"]}/>
        <Filter title="İçerik Türü" items={["Video ders","Etkileşimli alıştırma","Sınav programı","Canlı atölye"]}/>
        <Filter title="Erişim" items={["Ücretsiz","Premium","Sertifikalı"]}/>
      </aside>
      <section><div className="catalog-top"><div><strong>8 sonuç</strong><div style={{color:"var(--muted)",fontSize:14}}>Aktif filtre: Tüm seviyeler</div></div><select aria-label="Kurs sıralama" style={{height:42,border:"1px solid var(--border)",borderRadius:8,padding:"0 12px"}}><option>Önerilen</option><option>En popüler</option><option>En yeni</option><option>En yüksek puan</option></select></div><div className="course-grid catalog-grid">{courses.map(course=><CourseCard key={course.slug} course={course}/>)}</div></section>
    </div><Footer/>
  </>;
}

function Filter({title,items}:{title:string;items:string[]}) { return <div className="filter-group"><strong>{title}</strong>{items.map((item,i)=><label className="filter-option" key={item}><input type="checkbox" defaultChecked={title === "Seviye" && i === 0}/><span>{item}</span></label>)}</div>; }
