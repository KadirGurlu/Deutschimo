import Link from "next/link";
import { Award, BarChart3, BookOpen, BriefcaseBusiness, Check, CheckCircle2, GraduationCap, Headphones, Languages, MessageCircle, Mic2, PenLine, School, SearchCheck, ShieldCheck, Sparkles, Target, Timer, TrendingUp, Users, Volume2 } from "lucide-react";
import { courses } from "@/data/mock";
import { CourseCard } from "@/components/course/course-card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Footer } from "@/components/layout/footer";

const goals = [
  [Languages, "Sıfırdan başlamak", "Temel ifadelerden başlayarak A1 öğrenme yoluna katıl."],
  [School, "Üniversite hazırlık", "Hazırlık atlama ve akademik dil becerilerine odaklan."],
  [GraduationCap, "Almanya'da eğitim", "Üniversite yaşamı ve akademik iletişim için hazırlan."],
  [BriefcaseBusiness, "Almanya'da çalışmak", "İş görüşmesi, iş yeri ve profesyonel yazışmaları öğren."],
  [Target, "TestDaF veya TELC", "Sınav formatına uygun plan, deneme ve analizlerle ilerle."]
] as const;

const levels = [
  ["A1", "Almancaya Başlangıç", "12 hafta", "12 ünite", "96 alıştırma"],
  ["A2", "Temel İletişim", "16 hafta", "16 ünite", "128 alıştırma"],
  ["B1", "Bağımsız Dil Kullanımı", "18 hafta", "18 ünite", "144 alıştırma"],
  ["B2", "Akademik ve Profesyonel", "20 hafta", "20 ünite", "160 alıştırma"]
] as const;

const skillItems = [
  [BookOpen, "Gramer", "Kuralları bağlam içinde öğren ve uygulama ile pekiştir."],
  [Sparkles, "Kelime", "Aralıklı tekrar sistemiyle kalıcı kelime dağarcığı oluştur."],
  [SearchCheck, "Okuma", "Ana fikir, detay ve çıkarım becerilerini geliştir."],
  [PenLine, "Yazma", "E-postadan akademik metne yapılandırılmış yazma çalışmaları."],
  [Headphones, "Dinleme", "Doğal konuşma hızına uygun dinleme alıştırmaları."],
  [Mic2, "Konuşma", "Günlük diyaloglar ve sınav görevleriyle akıcılık kazan."],
  [Volume2, "Telaffuz", "Ses kaydı ve örnek telaffuzlarla anlaşılır konuş."],
  [Timer, "Sınav Teknikleri", "Süre, soru türü ve strateji odaklı sınav pratiği."]
] as const;

export default function HomePage() {
  return (
    <>
      <section className="hero">
        <div className="container hero-grid">
          <div>
            <span className="eyebrow">DİL ÖĞRENİMİNDE YENİ ÇAĞ</span>
            <h1>Almancanı bir sonraki seviyeye taşı.</h1>
            <p>A1'den B2'ye yapılandırılmış dersler, sınav hazırlık programları, interaktif alıştırmalar ve ayrıntılı ilerleme takibiyle Almancanı sistemli biçimde geliştir.</p>
            <div className="hero-actions"><Button href="/onboarding">Ücretsiz Öğrenmeye Başla</Button><Button href="/courses" variant="secondary">Kursları İncele</Button></div>
            <div className="trust-points"><span><CheckCircle2 size={17} /> Başlangıç seviyesi için uygun</span><span><CheckCircle2 size={17} /> Kendi hızında öğren</span><span><CheckCircle2 size={17} /> İlerlemeni takip et</span></div>
          </div>
          <div className="dashboard-mockup" aria-label="Deutschimo kullanıcı paneli ön izlemesi">
            <div className="mock-top"><div><small>Tekrar hoş geldin,</small><strong style={{ display: "block" }}>Kadir</strong></div><span>6 günlük seri</span></div>
            <div className="mock-grid">
              <div className="mock-card wide"><div style={{ display: "flex", justifyContent: "space-between" }}><strong>Haftalık çalışma</strong><span className="level-badge">Hedef %84</span></div><div className="mini-bars">{[38,65,52,86,68,76,42].map((v, i)=><span key={i} style={{ height: `${v}%` }} />)}</div></div>
              <div className="mock-card"><span className="eyebrow">DEVAM EDİLEN KURS</span><h3>A1 · Temel Almanca</h3><Progress value={42} label="%42 tamamlandı" /></div>
              <div className="mock-card"><span className="eyebrow">BUGÜNKÜ HEDEF</span><div className="metric">12/30</div><p>dakika tamamlandı</p><Button href="/learn/a1/a1-u01">Derse Devam Et</Button></div>
            </div>
          </div>
        </div>
      </section>

      <section className="logo-strip"><div className="container logo-strip-inner">
        <div className="trust-item"><ShieldCheck size={24} /><span>CEFR uyumlu seviye yapısı</span></div>
        <div className="trust-item"><BookOpen size={24} /><span>Dört temel beceri odaklı</span></div>
        <div className="trust-item"><GraduationCap size={24} /><span>Uzman içerik yaklaşımı</span></div>
        <div className="trust-item"><BarChart3 size={24} /><span>Ölçülebilir ilerleme</span></div>
        <div className="trust-item"><Languages size={24} /><span>Mobil ve masaüstü erişim</span></div>
      </div></section>

      <section className="section"><div className="container"><span className="eyebrow">KİŞİSEL ÖĞRENME ROTASI</span><h2 className="section-title">Almancayı neden öğreniyorsun?</h2><p className="section-copy">Hedefini seç; Deutschimo seviyene, ayırabildiğin zamana ve geliştirmek istediğin becerilere göre program önersin.</p><div className="goal-grid">{goals.map(([Icon,title,copy])=><Link href="/onboarding" className="goal-card" key={title}><Icon size={28}/><h3>{title}</h3><p>{copy}</p></Link>)}</div></div></section>

      <section className="section" style={{ background: "white" }}><div className="container"><div className="section-head"><div><span className="eyebrow">A1'DEN B2'YE</span><h2 className="section-title">Birbirine bağlı öğrenme yolu</h2><p className="section-copy">Her seviye öncekinin üzerine inşa edilir. Ders, alıştırma ve ölçme adımlarını tamamlayarak düzenli ilerlersin.</p></div><Button href="/courses" variant="secondary">Tüm Programlar</Button></div><div className="level-grid">{levels.map(([level,title,duration,unitsCount,lessonCount])=><article className="level-card" key={level}><div className="level-big">{level}</div><h3>{title}</h3><p>Seviyeye uygun gramer, kelime, okuma, dinleme, yazma ve konuşma programı.</p><div className="level-meta"><span>{duration}</span><span>{unitsCount}</span><span>{lessonCount}</span></div><Link href="/courses"><strong>Programı İncele →</strong></Link></article>)}</div></div></section>

      <section className="section"><div className="container"><div className="section-head"><div><span className="eyebrow">ÖNE ÇIKANLAR</span><h2 className="section-title">Popüler Almanca kursları</h2><p className="section-copy">Hedefine uygun programı seç ve kaldığın yerden devam et.</p></div><Button href="/courses" variant="secondary">Kataloğa Git</Button></div><div className="course-grid">{courses.slice(0,4).map(course=><CourseCard course={course} key={course.slug}/>)}</div></div></section>

      <section className="section" style={{ background: "white" }}><div className="container"><span className="eyebrow">BECERİ ODAKLI ÇALIŞ</span><h2 className="section-title">Almancanın her alanını ayrı ayrı geliştir</h2><div className="skill-grid">{skillItems.map(([Icon,title,copy])=><Link href="/courses" className="skill-card" key={title}><Icon size={28}/><h3>{title}</h3><p>{copy}</p></Link>)}</div></div></section>

      <section className="section dark-band"><div className="container"><span className="eyebrow" style={{color:"var(--turquoise)"}}>SINAV HAZIRLIK</span><h2 className="section-title">Almanca sınavlarına planlı şekilde hazırlan.</h2><p className="section-copy">Sınav formatı, zaman yönetimi, deneme sınavları ve beceri bazlı analiz tek programda.</p><div className="exam-grid">{[["TestDaF Hazırlık","B2-C1 · 12 hafta","8 deneme sınavı"],["TELC B1","B1 · 8 hafta","6 deneme sınavı"],["TELC B2","B2 · 10 hafta","8 deneme sınavı"],["Goethe-Zertifikat","A2-B1 · 8 hafta","5 deneme sınavı"]].map(([title,meta,exam])=><article className="exam-card" key={title}><Award size={26}/><h3>{title}</h3><p>{meta}</p><p>{exam} · Başlangıç testi · İlerleme analizi</p><Link href="/exams"><strong>Programı İncele →</strong></Link></article>)}</div></div></section>

      <section className="section"><div className="container"><span className="eyebrow">NASIL ÇALIŞIR?</span><h2 className="section-title">Dört adımda ölçülebilir ilerleme</h2><div className="steps"><div className="step"><h3>Seviyeni belirle</h3><p>Kısa onboarding veya seviye testiyle başlangıç noktanı bul.</p></div><div className="step"><h3>Programını seç</h3><p>Hedefine ve çalışma sürene uygun öğrenme rotasını başlat.</p></div><div className="step"><h3>Günlük dersleri tamamla</h3><p>Yazılı ders anlatımlarını oku, örnekleri incele ve ünite alıştırmalarını tamamla.</p></div><div className="step"><h3>İlerlemeni ölç</h3><p>Beceri raporlarını incele, eksik konulara geri dön ve sertifika kazan.</p></div></div></div></section>

      <section className="section" style={{background:"white"}}><div className="container"><span className="eyebrow">DEMO KULLANICI DENEYİMLERİ</span><h2 className="section-title">Öğrenme yolculuklarından örnekler</h2><div className="testimonials">{[["Elif A.","Üniversite hazırlık öğrencisi","A1 temel programını tamamladı","Derslerin sırası ve günlük hedef sistemi ne çalışacağımı düşünmeden ilerlememi sağladı."],["Mert K.","Almanya'da çalışma hedefi","İş Almancası programında","Yazma görevlerindeki ölçütler e-posta ve başvuru metinlerimi daha düzenli kurmama yardım etti."],["Selin T.","TestDaF adayı","Yazılı anlatım programı","Deneme sonrası hata analizi sayesinde özellikle grafik yorumlama bölümündeki eksiklerimi gördüm."]].map(([name,goal,program,quote])=><article className="testimonial" key={name}><div className="person"><div className="avatar">{name[0]}</div><div><strong>{name}</strong><small style={{display:"block",color:"var(--muted)"}}>{goal}</small></div></div><p>“{quote}”</p><span className="level-badge">{program}</span></article>)}</div></div></section>

      <section className="section"><div className="container mobile-promo"><div className="phone"><div className="phone-screen"><span className="eyebrow">BUGÜN</span><h3>Merhaba Kadir</h3><div className="card"><strong>A1 · Temel Almanca</strong><Progress value={42} label="Kaldığın yerden devam et"/></div><div className="card" style={{marginTop:12}}><span>Günlük hedef</span><div className="metric">18 dk</div><small>tamamlamak için kaldı</small></div></div></div><div><span className="eyebrow">MOBİL UYGULAMA · YAKINDA</span><h2 className="section-title">Derslerin her zaman yanında.</h2><p className="section-copy">Mobil ders takibi, günlük hatırlatmalar, kelime tekrarları, indirilebilir materyaller ve kaldığın yerden devam etme özelliği.</p><ul className="check-list">{["Mobil ders takibi","Günlük hatırlatmalar","Kelime tekrarları","İndirilebilir kaynaklar","Çevrim dışı çalışmaya hazır altyapı"].map(x=><li key={x}><Check size={18}/>{x}</li>)}</ul><div className="hero-actions"><span className="button button-secondary">App Store · Yakında</span><span className="button button-secondary">Google Play · Yakında</span></div></div></div></section>

      <section className="section" style={{background:"white"}}><div className="container"><span className="eyebrow">ÜYELİK PLANLARI</span><h2 className="section-title">İhtiyacına uygun erişim modeli</h2><div className="pricing-grid"><article className="pricing-card"><h3>Ücretsiz</h3><p>Deutschimo'yu keşfet ve temel günlük rutini oluştur.</p><ul className="check-list"><li><Check size={18}/>Sınırlı ders erişimi</li><li><Check size={18}/>Günlük alıştırmalar</li><li><Check size={18}/>Temel ilerleme takibi</li></ul><Button href="/onboarding" variant="secondary">Ücretsiz Başla</Button></article><article className="pricing-card featured"><h3>Premium</h3><p>Tüm seviyeler, sınırsız pratik ve ayrıntılı beceri analizi.</p><ul className="check-list"><li><Check size={18}/>Tüm seviyelere erişim</li><li><Check size={18}/>Sınav programları</li><li><Check size={18}/>İndirilebilir kaynaklar</li><li><Check size={18}/>Tamamlama sertifikaları</li></ul><Button href="/onboarding">Premium'u İncele</Button></article><article className="pricing-card"><h3>Kurumsal</h3><p>Ekipler için yönetim, atama ve grup performans raporları.</p><ul className="check-list"><li><Check size={18}/>Ekip yönetimi</li><li><Check size={18}/>Öğrenci atama</li><li><Check size={18}/>Yönetici paneli</li><li><Check size={18}/>Özel öğrenme yolları</li></ul><Button href="/auth" variant="secondary">Kurumsal Bilgi Al</Button></article></div></div></section>

      <section className="section"><div className="container"><span className="eyebrow">SIK SORULAN SORULAR</span><h2 className="section-title">Merak edilenler</h2><div className="faq">{[["Hangi seviyeden başlamalıyım?","Seviyeni bilmiyorsan onboarding sonunda kısa seviye belirleme sınavına başlayabilirsin."],["Dersleri ne kadar sürede tamamlayabilirim?","Program süreleri öneridir. Günlük hedefini değiştirerek kendi hızında ilerleyebilirsin."],["İçerikler mobil cihazlarda çalışıyor mu?","Tüm ekranlar telefon ve tablet için responsive tasarlanmıştır. PWA altyapısına uygundur."],["Sertifika veriliyor mu?","Belirlenen ders, alıştırma ve değerlendirme koşullarını tamamlayan kullanıcılar dijital sertifika alabilir."],["Yazma alıştırmalarım nasıl değerlendiriliyor?","Göreve göre gramer, kelime çeşitliliği, yapı ve anlaşılırlık ölçütleri kullanılır. Otomatik geri bildirim açıkça belirtilir."]].map(([q,a])=><details key={q}><summary>{q}</summary><p>{a}</p></details>)}</div></div></section>
      <Footer />
    </>
  );
}
