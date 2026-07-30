import Link from "next/link";

export function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-grid">
        <div>
          <div className="brand" style={{ color: "white" }}><span className="brand-mark">D</span><span>Deutschimo</span></div>
          <p>Almancanı sistemli, ölçülebilir ve akademik bir programla geliştir.</p>
          <small>© 2026 Deutschimo. Demo platform arayüzü.</small>
        </div>
        <div><h4>Öğren</h4><Link href="/courses">Tüm Kurslar</Link><Link href="/vocabulary">Kelime</Link><Link href="/writing">Yazma</Link><Link href="/exams">Sınav Hazırlık</Link></div>
        <div><h4>Deutschimo</h4><Link href="/">Hakkımızda</Link><Link href="/">Eğitmenler</Link><Link href="/">Kurumsal</Link><Link href="/">Kariyer</Link></div>
        <div><h4>Destek</h4><Link href="/">Yardım Merkezi</Link><Link href="/">Gizlilik</Link><Link href="/">Kullanım Şartları</Link><Link href="/profile">Hesap Ayarları</Link></div>
      </div>
    </footer>
  );
}
