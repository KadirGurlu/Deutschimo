import { getCurriculumContent } from "@/data/curriculum-content";
import type { Unit } from "@/types/course";

const createdAt = "2026-07-29T00:00:00.000Z";
const weights = { lessons: 40, exercises: 40, quiz: 20 } as const;
const rules = { requireAllSlides: true, requireAllExercises: true, requireUnitQuiz: true, minimumQuizScore: 70, requireWritingAssignment: false, requireTeacherApproval: false } as const;

const titles: Record<string, string[]> = {
  "A1": [
    "Tanışma ve Selamlaşma",
    "Kişisel Bilgiler ve Meslekler",
    "Şehirde Yön Bulma",
    "Yeme İçme ve Sipariş",
    "Günlük Hayat ve Aile",
    "Boş Zaman ve Davetler",
    "İş Günü ve Randevular",
    "Sağlık ve Günlük İhtiyaçlar",
    "Ev ve Yaşam Alanı",
    "Eğitim ve Meslek",
    "Giyim ve Alışveriş",
    "Seyahat ve Tatil"
  ],
  "A2": [
    "Geçmiş ve Biyografiler",
    "Ev, Taşınma ve Komşuluk",
    "Seyahat Planları ve Ulaşım",
    "İletişim ve Dijital Medya",
    "Öğrenme ve Eğitim",
    "İş, Başvuru ve Görüşme",
    "Sağlık ve Tavsiye",
    "Alışveriş ve Tüketim",
    "Kutlamalar ve Davetler",
    "Doğa ve Günlük Seçimler",
    "Resmî İşlemler ve Hizmetler",
    "Planlar ve Gelecek",
    "Kültür ve Etkinlikler",
    "Şehir Yaşamı ve Ulaşım",
    "Hobiler ve Kişisel Projeler",
    "A2 Genel Tekrar ve Değerlendirme"
  ],
  "B1": [
    "Deneyimler ve Yaşam Öyküleri",
    "Öğrenme, Eğitim ve Başarı",
    "Çalışma Hayatı ve Süreçler",
    "Medya, Bilgi ve Güvenilirlik",
    "Çevre, İklim ve Sorumluluk",
    "Sağlık, Alışkanlıklar ve Denge",
    "İlişkiler ve Çatışma Çözümü",
    "Seyahat, Kültür ve Karşılaştırma",
    "Şehir, Konut ve Yaşam Kalitesi",
    "Tüketim, Para ve Ekonomi",
    "Toplum, Katılım ve Gönüllülük",
    "B1 Projesi ve Sınav Hazırlığı",
    "Bilim ve Günlük Teknoloji",
    "Haberler ve Toplumsal Tartışmalar",
    "İş Arama ve Kariyer Planı",
    "Resmî Yazışmalar ve Başvurular",
    "Sunum ve Görüş Bildirme",
    "B1 Genel Tekrar ve Değerlendirme"
  ],
  "B2": [
    "Bilim, Araştırma ve Akademik Çalışma",
    "Profesyonel İletişim ve Karar Süreçleri",
    "Dijitalleşme ve Teknolojik Dönüşüm",
    "Toplumsal Değişim ve Aktarılan Görüş",
    "İklim Politikası ve Karmaşık Bağlantılar",
    "Sağlık Araştırmaları ve Kanıta Dayalı Bilgi",
    "Kültür, Kimlik ve Dilsel Nüans",
    "Ekonomi, Tüketim ve Belirsizlik",
    "Hukuk, Politika ve Kamusal Dil",
    "Şehir, Mobilite ve Planlama",
    "Argümantasyon ve Akademik Üslup",
    "Metin Bağdaşıklığı ve Portfolyo",
    "Bilimsel Metin Okuma",
    "Grafik ve Veri Yorumlama",
    "Akademik Sunum Hazırlama",
    "İş Dünyasında Müzakere",
    "Eleştirel Medya Okuryazarlığı",
    "Tartışma ve Karşı Görüş Geliştirme",
    "B2 Sınav Stratejileri",
    "B2 Genel Tekrar ve Değerlendirme"
  ]
};

export const units: Unit[] = Object.entries(titles).flatMap(([level, levelTitles]) =>
  levelTitles.map((title, index) => {
    const order = index + 1;
    const unitId = `${level.toLowerCase()}-u${String(order).padStart(2, "0")}`;
    return {
      id: unitId,
      courseId: level.toLowerCase(),
      order,
      slug: `unit-${String(order).padStart(2, "0")}`,
      title,
      description: getCurriculumContent(unitId).intro,
      estimatedMinutes: level === "A1" ? 55 : level === "A2" ? 65 : level === "B1" ? 75 : 85,
      status: "PUBLISHED",
      prerequisiteUnitId: order > 1 ? `${level.toLowerCase()}-u${String(order - 1).padStart(2, "0")}` : undefined,
      progressWeights: { ...weights },
      completionRules: { ...rules, requireWritingAssignment: (level === "B1" || level === "B2") && order % 4 === 0 },
      createdAt,
      updatedAt: createdAt,
    } satisfies Unit;
  }),
);

export const unitCounts = { A1: 12, A2: 16, B1: 18, B2: 20 } as const;
