import Image from "next/image";
import Link from "next/link";

export function Footer() {
  return (
    <footer className="footer v19-footer">
      <div className="container v19-footer-grid">
        <div className="v19-footer-brand">
          <div className="brand" style={{ color: "white" }}><Image src="/deutschimo-logo.png" alt="" width={40} height={40} className="brand-logo brand-logo-footer" /><span>Deutschimo</span></div>
          <p>A1'den B2'ye sade, düzenli ve ölçülebilir Almanca öğrenme platformu.</p>
        </div>

        <nav aria-label="Alt menü">
          <Link href="/courses">Kurslar</Link>
          <Link href="/#seviyeler">Seviyeler</Link>
          <Link href="/exams">Sınav Hazırlık</Link>
          <Link href="/auth?mode=register">Kayıt Ol</Link>
        </nav>

        <nav aria-label="Yasal bağlantılar">
          <Link href="/privacy">Gizlilik</Link>
          <Link href="/kvkk">KVKK</Link>
          <Link href="/cookies">Çerezler</Link>
          <Link href="/terms">Kullanım Şartları</Link>
        </nav>
      </div>
      <div className="container v19-footer-bottom">
        <small>© 2026 Deutschimo. Tüm hakları saklıdır.</small>
      </div>
    </footer>
  );
}
