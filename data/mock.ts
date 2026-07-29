export type Course = {
  slug: string;
  title: string;
  level: "A1" | "A2" | "B1" | "B2";
  category: string;
  description: string;
  duration: string;
  lessons: number;
  students: string;
  rating: number;
  reviews: number;
  access: "Ücretsiz" | "Premium" | "Sertifikalı Program";
  progress?: number;
  accent: string;
};

export const courses: Course[] = [
  {
    slug: "a1-1-almancaya-ilk-adim",
    title: "A1.1 Almancaya İlk Adım",
    level: "A1",
    category: "Başlangıç Programı",
    description: "Selamlaşma, kendini tanıtma, temel fiiller ve günlük iletişim kalıpları.",
    duration: "8 hafta",
    lessons: 42,
    students: "2.480",
    rating: 4.8,
    reviews: 318,
    access: "Ücretsiz",
    progress: 42,
    accent: "linear-gradient(135deg,#12263A,#214b69)"
  },
  {
    slug: "a1-2-gunluk-iletisim",
    title: "A1.2 Günlük İletişim",
    level: "A1",
    category: "Konuşma",
    description: "Alışveriş, randevu, ulaşım ve gündelik ihtiyaçlar için pratik Almanca.",
    duration: "7 hafta",
    lessons: 36,
    students: "1.760",
    rating: 4.7,
    reviews: 206,
    access: "Premium",
    accent: "linear-gradient(135deg,#16A8B0,#5CE1E6)"
  },
  {
    slug: "a2-gramer-programi",
    title: "A2 Gramer Programı",
    level: "A2",
    category: "Gramer",
    description: "Artikel, hâller, modal fiiller ve bağlaçları sistemli biçimde pekiştir.",
    duration: "10 hafta",
    lessons: 54,
    students: "1.340",
    rating: 4.9,
    reviews: 190,
    access: "Premium",
    accent: "linear-gradient(135deg,#344054,#667085)"
  },
  {
    slug: "b1-okuma-atolyesi",
    title: "B1 Okuma Atölyesi",
    level: "B1",
    category: "Okuma",
    description: "Güncel metinler, ana fikir bulma ve sınav tipi okuma stratejileri.",
    duration: "6 hafta",
    lessons: 28,
    students: "940",
    rating: 4.8,
    reviews: 116,
    access: "Premium",
    accent: "linear-gradient(135deg,#172B3A,#3e6479)"
  },
  {
    slug: "b1-yazma-atolyesi",
    title: "B1 Yazma Atölyesi",
    level: "B1",
    category: "Yazma",
    description: "E-posta, görüş bildirme ve yapılandırılmış kısa metin çalışmaları.",
    duration: "6 hafta",
    lessons: 24,
    students: "805",
    rating: 4.7,
    reviews: 94,
    access: "Sertifikalı Program",
    accent: "linear-gradient(135deg,#175CD3,#53B1FD)"
  },
  {
    slug: "b2-akademik-almanca",
    title: "B2 Akademik Almanca",
    level: "B2",
    category: "Akademik Almanca",
    description: "Akademik kelime bilgisi, sunum, tartışma ve metin üretimi.",
    duration: "12 hafta",
    lessons: 60,
    students: "620",
    rating: 4.9,
    reviews: 87,
    access: "Sertifikalı Program",
    accent: "linear-gradient(135deg,#12263A,#16A8B0)"
  },
  {
    slug: "testdaf-yazili-anlatim",
    title: "TestDaF Yazılı Anlatım",
    level: "B2",
    category: "Sınav Hazırlık",
    description: "Grafik yorumlama, argümantasyon ve zaman yönetimi odaklı hazırlık.",
    duration: "8 hafta",
    lessons: 34,
    students: "710",
    rating: 4.9,
    reviews: 121,
    access: "Premium",
    accent: "linear-gradient(135deg,#7A271A,#F97066)"
  },
  {
    slug: "telc-b2-sinav-hazirligi",
    title: "TELC B2 Sınav Hazırlığı",
    level: "B2",
    category: "Sınav Hazırlık",
    description: "Dört beceri, deneme sınavları ve ayrıntılı performans analizi.",
    duration: "10 hafta",
    lessons: 48,
    students: "585",
    rating: 4.8,
    reviews: 76,
    access: "Premium",
    accent: "linear-gradient(135deg,#93370D,#FDB022)"
  }
];

export const navItems = [
  ["Ana Sayfa", "/"],
  ["Kurslar", "/courses"],
  ["Dashboard", "/dashboard"],
  ["İlerleme", "/progress"],
  ["Sınavlar", "/exams"]
] as const;

export const weeklyStudy = [
  { day: "Pzt", minutes: 32 },
  { day: "Sal", minutes: 44 },
  { day: "Çar", minutes: 28 },
  { day: "Per", minutes: 50 },
  { day: "Cum", minutes: 36 },
  { day: "Cmt", minutes: 41 },
  { day: "Paz", minutes: 18 }
];

export const skills = [
  { label: "Gramer", value: 74 },
  { label: "Kelime", value: 61 },
  { label: "Okuma", value: 70 },
  { label: "Yazma", value: 54 },
  { label: "Dinleme", value: 66 },
  { label: "Konuşma", value: 49 }
];

export const units = [
  {
    title: "Ünite 1 · Tanışma ve Selamlaşma",
    progress: 75,
    lessons: [
      { title: "Selamlaşma ifadeleri", type: "Okuma", done: true },
      { title: "Kendini tanıtmak", type: "Video", done: false, active: true },
      { title: "sein fiili ve kişi zamirleri", type: "Gramer", done: false },
      { title: "Kelime alıştırması", type: "Quiz", done: false }
    ]
  },
  {
    title: "Ünite 2 · Aile ve Meslekler",
    progress: 0,
    lessons: [
      { title: "Aile üyeleri", type: "Kelime", done: false, locked: true },
      { title: "Meslekler ve çalışma", type: "Dinleme", done: false, locked: true }
    ]
  }
];
