"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Archive, CheckCircle2, Database, LockKeyhole, TestTube2 } from "lucide-react";

type Data = {
  version: string;
  errors: number;
  failures: number;
  blocked: number;
  testUsers: number;
  databaseLatency: number;
  backupConfigured: boolean;
  configuration: Record<string, boolean>;
  backups: Array<{ id: string; status: string; startedAt: string; byteSize: number | null; errorMessage: string | null }>;
};

const labels: Record<string, string> = {
  authSecret: "Auth.js anahtarı",
  securityHashKey: "Güvenlik hash anahtarı",
  cronSecret: "Zamanlanmış görev anahtarı",
  googleAuth: "Google giriş yapılandırması",
  emailVerification: "E-posta doğrulama yapılandırması",
};

export function SecurityOverview() {
  const [data, setData] = useState<Data | null>(null);
  useEffect(() => {
    fetch("/api/admin/security", { cache: "no-store" }).then((response) => response.json()).then(setData).catch(() => setData(null));
  }, []);
  if (!data) return <div className="learning-loading">Güvenlik verileri yükleniyor…</div>;

  return <>
    <div className="stats-grid">
      <S icon={<AlertTriangle />} label="Sistem hatası · 24 saat" value={data.errors} />
      <S icon={<LockKeyhole />} label="Başarısız API · 24 saat" value={data.failures} />
      <S icon={<LockKeyhole />} label="Başarısız giriş · 24 saat" value={data.blocked} />
      <S icon={<TestTube2 />} label="Test kullanıcısı" value={data.testUsers} />
    </div>

    <section className="panel" style={{ marginTop: 22 }}>
      <h2><Database size={20} /> V24 altyapı durumu</h2>
      <p>Uygulama sürümü {data.version} · Veritabanı yanıtı yaklaşık {data.databaseLatency} ms.</p>
      <div className="audit-list">
        {Object.entries(data.configuration).map(([key, ready]) => <article key={key}>
          <div><strong>{labels[key] ?? key}</strong><span>{ready ? "Yapılandırıldı" : "Eksik veya devre dışı"}</span></div>
          <CheckCircle2 size={19} color={ready ? "var(--success)" : "var(--error)"} />
        </article>)}
      </div>
    </section>

    <section className="panel" style={{ marginTop: 22 }}>
      <h2><Archive size={20} /> Günlük yedekler</h2>
      <p>{data.backupConfigured ? "Özel Blob yedekleme yapılandırıldı; V24 yedekleri sıkıştırılmış ve şifrelenmiş olarak saklanır." : "Yedekleme için projeye bağlı Private Blob ve BACKUP_ENCRYPTION_KEY ayarlanmalı."}</p>
      <div className="audit-list">{data.backups.map((backup) => <article key={backup.id}>
        <div><strong>{backup.status}</strong><span>{backup.byteSize ? `${Math.round(backup.byteSize / 1024)} KB` : backup.errorMessage || "Henüz tamamlanmadı"}</span></div>
        <time>{new Intl.DateTimeFormat("tr-TR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(backup.startedAt))}</time>
      </article>)}</div>
    </section>
  </>;
}

function S({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return <article className="stat-card"><div>{label}{icon}</div><strong>{value}</strong><span>Son 24 saat</span></article>;
}
