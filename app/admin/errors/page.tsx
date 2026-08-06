import { AdminSidebar } from "@/components/layout/admin-sidebar";
import { requireAdmin } from "@/lib/auth/authorization";
import { prisma } from "@/lib/db";

function metadataObject(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

type ErrorGroup = {
  count: number;
  last: Date;
  route: string;
  source: string;
  operation: string;
  code: string;
  message: string;
  affectedSessions: Set<string>;
};

export default async function AdminErrorsPage() {
  await requireAdmin();
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const [errors, apiFailures] = await Promise.all([
    prisma.systemErrorLog.findMany({ where: { createdAt: { gte: since } }, orderBy: { createdAt: "desc" }, take: 300 }),
    prisma.apiFailureLog.findMany({ where: { createdAt: { gte: since } }, orderBy: { createdAt: "desc" }, take: 300 }),
  ]);

  const grouped = new Map<string, ErrorGroup>();
  for (const item of errors) {
    const metadata = metadataObject(item.metadata);
    const key = item.fingerprint || item.id;
    const current = grouped.get(key) ?? {
      count: 0,
      last: item.createdAt,
      route: item.route || "—",
      source: item.source,
      operation: String(metadata.operation || item.method || "—"),
      code: String(metadata.errorCode || item.digest || "—"),
      message: item.message,
      affectedSessions: new Set<string>(),
    };
    current.count += 1;
    if (item.createdAt > current.last) current.last = item.createdAt;
    current.affectedSessions.add(item.ipHash || item.requestId || item.id);
    grouped.set(key, current);
  }
  const groups = [...grouped.values()].sort((left, right) => right.last.getTime() - left.last.getTime());

  return (
    <div className="admin-shell">
      <AdminSidebar active="errors" />
      <main className="admin-main">
        <span className="eyebrow">YÖNETİM · V31.2</span>
        <h1 className="section-title">Hata İzleme Merkezi</h1>
        <p className="section-copy">Son 30 gündeki hatalar; kullanıcı kimliği gösterilmeden rota, işlem, tekrar sayısı, etkilenen oturum sayısı ve teknik hata koduyla gruplanır.</p>
        <section className="panel" style={{ overflowX: "auto", marginTop: 24 }}>
          <h2>Sistem hataları ({errors.length})</h2>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr>{["Hata kodu", "Kaynak", "İşlem", "Sayfa", "Tekrar", "Etkilenen oturum", "Son görülme", "Mesaj"].map((label) => <th key={label} style={{ textAlign: "left", padding: 10, borderBottom: "1px solid var(--border)" }}>{label}</th>)}</tr></thead>
            <tbody>{groups.map((item, index) => <tr key={`${item.code}-${index}`}><td style={{ padding: 10 }}><code>{item.code}</code></td><td>{item.source}</td><td>{item.operation}</td><td>{item.route}</td><td>{item.count}</td><td>{item.affectedSessions.size}</td><td>{item.last.toLocaleString("tr-TR")}</td><td>{item.message.slice(0, 160)}</td></tr>)}</tbody>
          </table>
        </section>
        <section className="panel" style={{ overflowX: "auto", marginTop: 24 }}>
          <h2>API başarısızlıkları ({apiFailures.length})</h2>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr>{["Durum", "Metot", "Rota", "Zaman", "İstek kimliği"].map((label) => <th key={label} style={{ textAlign: "left", padding: 10, borderBottom: "1px solid var(--border)" }}>{label}</th>)}</tr></thead>
            <tbody>{apiFailures.map((item) => <tr key={item.id}><td style={{ padding: 10 }}>{item.statusCode}</td><td>{item.method}</td><td>{item.route}</td><td>{item.createdAt.toLocaleString("tr-TR")}</td><td><code>{item.requestId || "—"}</code></td></tr>)}</tbody>
          </table>
        </section>
      </main>
    </div>
  );
}
