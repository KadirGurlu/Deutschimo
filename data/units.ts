import { getCurriculumContent } from "@/data/curriculum-content";
import type { Unit } from "@/types/course";

const createdAt = "2026-07-29T00:00:00.000Z";
const weights = { lessons: 40, exercises: 40, quiz: 20 } as const;
const rules = { requireAllSlides: true, requireAllExercises: true, requireUnitQuiz: true, minimumQuizScore: 70, requireWritingAssignment: false, requireTeacherApproval: false } as const;

const titles: Record<string, string[]> = {
  "A1": [
        "Tanışma, Selamlaşma ve Alfabe",
    "Kişisel Bilgiler, Diller ve Meslek",
    "Aile, İnsanlar ve Sahiplik",
    "Eşyalar, Alışveriş ve Fiyatlar",
    "Yeme İçme ve Sipariş",
    "Günlük Rutin, Saat ve Randevular",
    "Boş Zaman, Yetenekler ve Davetler",
    "Şehirde Yön Bulma ve Ulaşım",
    "Ev, Oda ve Yaşam Alanı",
    "Sağlık, Vücut ve Basit Tavsiye",
    "Giyim, Hava Durumu ve Alışveriş",
    "Seyahat, Tatil ve A1 Genel Uygulama"
  ],
  "A2": [
        "Geçmiş, Biyografi ve Anılar",
    "Ev Düzeni ve Yer Değiştirme",
    "Tatil, Doğa ve Tercihler",
    "Alışveriş, Miktarlar ve Ürün Özellikleri",
    "Dijital Yaşam, Medya ve Görüşler",
    "Okul, Eğitim ve Geçmiş Kurallar",
    "İş Hayatı, Rutinler ve Ekip İletişimi",
    "Ulaşım, Yolculuk ve Dolaylı Sorular",
    "Spor, Sağlık ve Alışkanlıklar",
    "Komşuluk ve Birlikte Yaşam",
    "Hizmetler, Tamir ve Nesne Zamirleri",
    "Kutlamalar, Gelenekler ve Zaman",
    "Teknoloji, Karşılaştırma ve Avantajlar",
    "Sorunlar, Şikâyetler ve Tavsiyeler",
    "Başvuru, Randevu ve Resmî İşlemler",
    "A2 Genel Uygulama ve Gerçek Yaşam"
  ],
  "B1": [
        "İlişkiler, Kişilik ve Sosyal İletişim",
    "Konut, WG ve Ortak Yaşam",
    "İş, Başvuru ve Mesleki Hedefler",
    "Öğrenme, Diller ve Çalışma Stratejileri",
    "Medya, Haberler ve Farklı Görüşler",
    "Tüketim, Reklam ve Bilinçli Seçimler",
    "Seyahat, Ulaşım ve Beklenmeyen Durumlar",
    "Sağlık, Stres ve Yaşam Dengesi",
    "Çevre, İklim ve Sürdürülebilir Yaşam",
    "Toplum, Gönüllülük ve Katılım",
    "Kültür, Film ve Eleştiri",
    "Kurallar, Haklar ve Sorumluluklar",
    "Teknoloji, Dijitalleşme ve Gelecek",
    "Para, Bütçe ve Tüketici Kararları",
    "Güncel Olaylar, Haber Aktarma ve Zaman Sırası",
    "Planlar, Hedefler ve Amaç Bildirme",
    "Resmî İletişim, Talep ve Şikâyet",
    "B1 Genel Uygulama ve Bağımsız İletişim"
  ],
  "B2": [
        "Kimlik, Değerler ve Farklı Bakış Açıları",
    "Eğitim, Öğrenme ve Yaşam Boyu Gelişim",
    "İş Dünyası, Sorumluluk ve Kurumsal İletişim",
    "Medya, Haber Dili ve Kaynak Güvenilirliği",
    "Bilim, Araştırma ve Kanıta Dayalı Düşünme",
    "Çevre, İklim ve Sürdürülebilir Dönüşüm",
    "Ekonomi, Tüketim ve Karar Verme",
    "Toplum, Demografi ve Birlikte Yaşam",
    "Ulaşım, Kentleşme ve Kamusal Alan",
    "Sağlık, Yaşam Kalitesi ve Önleyici Yaklaşımlar",
    "Kültür, Sanat ve Eleştirel Değerlendirme",
    "Hukuk, Kurumlar ve Kamusal Sorumluluk",
    "Teknoloji, Yapay Zekâ ve Dijital Etik",
    "Akademik İletişim, Sunum ve Kaynak Aktarımı",
    "Kültürlerarası İletişim ve Uygun Üslup",
    "Argümantasyon, Tartışma ve Uzlaşma",
    "Veri, Grafik ve Eğilimleri Yorumlama",
    "Müzakere, Çatışma Çözümü ve Profesyonel İş Birliği",
    "Aracılık, Çevrim İçi Etkileşim ve Bilgi Aktarımı",
    "B2 Genel Uygulama ve Bağımsız İletişim"
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
      estimatedMinutes: level === "A1" ? 120 : level === "A2" ? 150 : level === "B1" ? 180 : 210,
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
