import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();
const courses = [
  { id: "a1", slug: "a1", level: "A1", title: "A1 · Almancaya Başlangıç", description: "Temel günlük iletişim ve başlangıç grameri.", estimatedHours: 60, unitCount: 12 },
  { id: "a2", slug: "a2", level: "A2", title: "A2 · Temel İletişim", description: "Günlük hayatta daha bağımsız iletişim.", estimatedHours: 90, unitCount: 16 },
  { id: "b1", slug: "b1", level: "B1", title: "B1 · Bağımsız Dil Kullanımı", description: "Deneyim, görüş ve gerekçeleri ifade etme.", estimatedHours: 130, unitCount: 18 },
  { id: "b2", slug: "b2", level: "B2", title: "B2 · Akademik ve Profesyonel Almanca", description: "Karmaşık metinler ve profesyonel iletişim.", estimatedHours: 180, unitCount: 20 },
];

for (const course of courses) {
  await prisma.course.upsert({ where: { id: course.id }, create: { ...course, status: "PUBLISHED" }, update: course });
}

const email = process.env.ADMIN_EMAIL?.toLowerCase();
const password = process.env.ADMIN_PASSWORD;
if (email && password) {
  const firstName = process.env.ADMIN_FIRST_NAME || "Deutschimo";
  const lastName = process.env.ADMIN_LAST_NAME || "Yönetici";
  await prisma.user.upsert({
    where: { email },
    create: { email, name: `${firstName} ${lastName}`, firstName, lastName, passwordHash: await hash(password, 12), role: "SUPER_ADMIN", status: "ACTIVE", emailVerified: new Date(), currentLevel: "A1", targetLevel: "B2" },
    update: { role: "SUPER_ADMIN", status: "ACTIVE", passwordHash: await hash(password, 12), firstName, lastName, name: `${firstName} ${lastName}`, emailVerified: new Date() },
  });
  console.log(`Admin hazırlandı: ${email}`);
} else {
  console.log("ADMIN_EMAIL ve ADMIN_PASSWORD tanımlanmadığı için yönetici hesabı oluşturulmadı.");
}

await prisma.$disconnect();
