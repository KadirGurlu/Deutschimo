import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  BookOpenCheck,
  CheckCircle2,
  Clock3,
  GraduationCap,
  Layers3,
  PlayCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Footer } from "@/components/layout/footer";

const levelCards = [
  {
    level: "A1",
    title: "Başlangıç",
    description: "Temel ifadeler, günlük iletişim ve Almancanın yapı taşları.",
    units: "12 ünite",
    exercises: "168 alıştırma",
    href: "/courses/a1",
  },
  {
    level: "A2",
    title: "Temel iletişim",
    description: "Günlük yaşamda daha rahat konuşma, okuma ve yazma.",
    units: "16 ünite",
    exercises: "224 alıştırma",
    href: "/courses/a2",
  },
  {
    level: "B1",
    title: "Bağımsız kullanım",
    description: "Daha uzun metinler, akıcı iletişim ve işlevsel dil kullanımı.",
    units: "18 ünite",
    exercises: "252 alıştırma",
    href: "/courses/b1",
  },
  {
    level: "B2",
    title: "İleri seviye",
    description: "Akademik ve profesyonel ortamlarda güçlü ifade becerisi.",
    units: "20 ünite",
    exercises: "280 alıştırma",
    href: "/courses/b2",
  },
] as const;

const platformValues = [
  {
    icon: BookOpenCheck,
    title: "Ders ve alıştırma bir arada",
    copy: "Konuyu öğren, hemen ardından uygulayarak pekiştir.",
  },
  {
    icon: Clock3,
    title: "Kendi hızında ilerle",
    copy: "Kaldığın yerden devam et ve günlük hedefini kendin belirle.",
  },
  {
    icon: BarChart3,
    title: "İlerlemeni gör",
    copy: "Tamamladığın üniteleri ve gelişimini tek ekrandan takip et.",
  },
] as const;

export default function HomePage() {
  return (
    <>
      <section className="v19-hero">
        <div className="container v19-hero-grid">
          <div className="v19-hero-copy">
            <span className="eyebrow">A1'DEN B2'YE ALMANCA</span>
            <h1>Almanca öğrenmenin sade ve düzenli yolu.</h1>
            <p>
              Yapılandırılmış dersler, özgün alıştırmalar ve ilerleme takibiyle
              Almancanı adım adım geliştir.
            </p>
            <div className="v19-hero-actions">
              <Button href="/auth">
                Kayıt Ol <ArrowRight size={18} />
              </Button>
              <Button href="/courses" variant="secondary">
                Seviyeleri İncele
              </Button>
            </div>
            <div className="v19-hero-proof" aria-label="Platform özeti">
              <span><CheckCircle2 size={17} /> 66 yapılandırılmış ünite</span>
              <span><CheckCircle2 size={17} /> 900'den fazla alıştırma</span>
              <span><CheckCircle2 size={17} /> Video olmadan odaklı öğrenme</span>
            </div>
          </div>

          <div className="v19-platform-preview" aria-label="Deutschimo öğrenme programı ön izlemesi">
            <div className="v19-preview-head">
              <div>
                <span className="eyebrow">ÖĞRENME YOLUN</span>
                <h2>Seviyeni seç ve başla</h2>
              </div>
              <span className="v19-preview-badge">A1–B2</span>
            </div>

            <div className="v19-preview-list">
              {levelCards.map((item, index) => (
                <Link
                  className={`v19-preview-row ${index === 0 ? "active" : ""}`}
                  href={item.href}
                  key={item.level}
                >
                  <span className="v19-preview-level">{item.level}</span>
                  <span className="v19-preview-text">
                    <strong>{item.title}</strong>
                    <small>{item.units} · {item.exercises}</small>
                  </span>
                  {index === 0 ? <PlayCircle size={21} /> : <ArrowRight size={19} />}
                </Link>
              ))}
            </div>

            <div className="v19-preview-foot">
              <GraduationCap size={21} />
              <span>Ders anlatımı → alıştırma → ünite ilerlemesi</span>
            </div>
          </div>
        </div>
      </section>

      <section className="v19-value-strip" aria-label="Deutschimo avantajları">
        <div className="container v19-value-grid">
          {platformValues.map(({ icon: Icon, title, copy }) => (
            <article key={title}>
              <span className="v19-value-icon"><Icon size={23} /></span>
              <div>
                <h2>{title}</h2>
                <p>{copy}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="v19-section v19-levels-section" id="seviyeler">
        <div className="container">
          <div className="v19-section-heading">
            <span className="eyebrow">ÖĞRENME PROGRAMI</span>
            <h2>Seviyeni seç</h2>
            <p>Almancaya yeni başla veya mevcut seviyenden devam et.</p>
          </div>

          <div className="v19-level-grid">
            {levelCards.map((item) => (
              <Link className="v19-level-card" href={item.href} key={item.level}>
                <div className="v19-level-card-top">
                  <span>{item.level}</span>
                  <ArrowRight size={20} />
                </div>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
                <div className="v19-level-meta">
                  <span>{item.units}</span>
                  <span>{item.exercises}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="v19-section v19-how-section">
        <div className="container v19-how-grid">
          <div className="v19-section-heading left">
            <span className="eyebrow">BASİT BİR ÖĞRENME AKIŞI</span>
            <h2>Üç adımda ilerle</h2>
            <p>Her ünitede ne yapacağını bilerek düzenli biçimde çalış.</p>
          </div>

          <div className="v19-steps">
            <article>
              <span>1</span>
              <div><h3>Konuyu öğren</h3><p>Yazılı ve anlaşılır ders anlatımını incele.</p></div>
            </article>
            <article>
              <span>2</span>
              <div><h3>Alıştırma yap</h3><p>Özgün sorularla öğrendiklerini hemen uygula.</p></div>
            </article>
            <article>
              <span>3</span>
              <div><h3>İlerlemeni takip et</h3><p>Tamamladığın üniteleri ve gelişimini gör.</p></div>
            </article>
          </div>
        </div>
      </section>

      <section className="v19-cta-section">
        <div className="container v19-cta-card">
          <div>
            <span className="eyebrow">BAŞLAMAYA HAZIR MISIN?</span>
            <h2>Almanca öğrenmeye bugün başla.</h2>
            <p>Seviyeni seç, ilk dersini tamamla ve öğrenme yolunu oluştur.</p>
          </div>
          <div className="v19-cta-actions">
            <Button href="/auth">Kayıt Ol</Button>
            <Link href="/courses" className="v19-text-link">
              Programları incele <ArrowRight size={18} />
            </Link>
          </div>
          <Layers3 className="v19-cta-decoration" size={150} aria-hidden="true" />
        </div>
      </section>

      <Footer />
    </>
  );
}
