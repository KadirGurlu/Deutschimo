import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (relative) => fs.readFileSync(path.join(root, relative), "utf8");
const failures = [];
const expect = (condition, message) => { if (!condition) failures.push(message); };

const sidebar = read("components/layout/app-sidebar.tsx");
expect(sidebar.includes('"Öğrenci Paneli"'), "Dashboard etiketi Öğrenci Paneli olarak değiştirilmedi.");
for (const removed of ["Kurslarım", "Zayıf Konular", "Yetkinlik Haritası", "Hata Geçmişi", "Sınavlar"]) {
  expect(!sidebar.includes(`"${removed}"`), `Sol menüde kaldırılması gereken öğe hâlâ var: ${removed}`);
}
for (const kept of ["Seviye Testi", "Akıllı Tekrar", "Günlük Plan", "Beceri Laboratuvarı", "Kelime Setlerim", "İlerleme", "Profil", "Ayarlar"]) {
  expect(sidebar.includes(`"${kept}"`), `Sol menüde korunması gereken öğe eksik: ${kept}`);
}

const engine = read("lib/intelligence/insight-engine.ts");
const server = read("lib/intelligence/server.ts");
const reviewApi = read("app/api/intelligence/review/route.ts");
const reviewUi = read("components/intelligence/smart-review.tsx");
expect(engine.includes("PersonalizedErrorSignal"), "Hata geçmişi sinyalleri akıllı tekrar motoruna eklenmedi.");
expect(engine.includes('sourceType: "ERROR_HISTORY"'), "Hata geçmişi kaynaklı tekrar öğeleri oluşturulmuyor.");
expect(engine.includes("insights.weakTopics"), "Zayıf konu analizi tekrar kuyruğuna bağlanmadı.");
expect(server.includes("learningErrorHistory.findMany"), "Öğrenciye ait açık hata geçmişi veritabanından okunmuyor.");
expect(server.includes("sourceVersion: 23"), "Öğrenme içgörüsü kaynak sürümü V23 değil.");
expect(reviewApi.includes("resolvedAt: new Date()"), "Doğru tamamlanan kişisel hata kaydı çözülmüyor.");
expect(reviewApi.includes("occurrenceCount: { increment: 1 }"), "Akıllı tekrarda yeniden yapılan hata geçmişe işlenmiyor.");
expect(reviewUi.includes("KİŞİSEL AKILLI TEKRAR"), "Akıllı tekrar arayüzü kişisel deneyim olarak güncellenmedi.");
expect(reviewUi.includes("personalization.errorHistory"), "Akıllı tekrar kaynak özeti arayüzde gösterilmiyor.");


const footer = read("components/layout/footer.tsx");
expect(!footer.includes('href="/exams"'), "Sınav hazırlık bağlantısı alt menüde hâlâ görünüyor.");

const dashboard = read("app/dashboard/page.tsx");
expect(!dashboard.includes("CompetencyDashboardCard"), "Kaldırılan yetkinlik kartı öğrenci panelinde hâlâ gösteriliyor.");

for (const route of ["weak-topics", "competency", "mistakes"]) {
  expect(read(`app/${route}/page.tsx`).includes('redirect("/smart-review")'), `${route} eski rotası Akıllı Tekrar'a yönlendirilmiyor.`);
}
expect(read("app/exams/page.tsx").includes('redirect("/dashboard")'), "Sınavlar eski rotası Öğrenci Paneli'ne yönlendirilmiyor.");

if (failures.length) {
  console.error(`V23 doğrulaması başarısız (${failures.length} sorun):`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("V23 doğrulaması başarılı.");
console.log("- Sol menü sadeleştirildi ve Dashboard adı Öğrenci Paneli oldu.");
console.log("- Zayıf konu ve hata geçmişi verileri kişisel Akıllı Tekrar kuyruğunda birleştirildi.");
console.log("- Kaldırılan eski sayfalar güvenli biçimde yönlendiriliyor.");
