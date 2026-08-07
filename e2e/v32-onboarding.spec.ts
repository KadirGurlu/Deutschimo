import { expect, test } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
const prisma=new PrismaClient(); const password="V32-Onboarding!2026";
test.describe.configure({mode:"serial"}); test.afterAll(async()=>prisma.$disconnect());
test("V32 yeni kullanici onboarding ve kisisel plan akisi",async({page})=>{
  const email=`e2e.v32.${Date.now()}@preview.deutschimo.test`;
  try{
    await page.goto("/auth?mode=register");
    await page.getByLabel("Ad",{exact:true}).fill("V32"); await page.getByLabel("Soyad",{exact:true}).fill("Onboarding"); await page.getByLabel("E-posta",{exact:true}).fill(email); await page.getByLabel("Şifre",{exact:true}).fill(password); await page.getByRole("checkbox").check(); await page.getByRole("button",{name:"Hesap Oluştur"}).click();
    await expect(page).toHaveURL(/\/onboarding(?:\?|$)/,{timeout:30_000}); await expect(page.getByRole("heading",{name:"Almanca seviyen nedir?"})).toBeVisible();
    await page.getByTestId("level-A1").click(); await page.getByTestId("onboarding-next").click();
    await page.getByTestId("goal-GERMANY_LIFE").click(); await page.getByTestId("onboarding-next").click();
    await page.getByTestId("daily-30").click(); await page.getByTestId("onboarding-next").click();
    await page.getByTestId("days-5").click(); await page.getByTestId("onboarding-next").click();
    await page.getByTestId("skill-VOCABULARY").click(); await page.getByTestId("skill-SPEAKING").click(); await page.getByTestId("onboarding-complete").click();
    await expect(page.getByTestId("onboarding-plan")).toContainText("5 gün × 30 dk"); await expect(page.getByTestId("onboarding-plan")).toContainText("10 hafta");
    await page.getByRole("button",{name:/Öğrenci paneline geç/i}).click(); await expect(page).toHaveURL(/\/dashboard(?:\?|$)/,{timeout:30_000}); await expect(page.getByRole("heading",{name:/Tekrar hoş geldin/i})).toBeVisible();
    const saved=await prisma.user.findUnique({where:{email},include:{onboardingProfile:true}}); expect(saved?.onboardingCompleted).toBe(true); expect(saved?.dailyGoalMinutes).toBe(30); expect(saved?.onboardingProfile?.studyDaysPerWeek).toBe(5);
  } finally { await prisma.user.deleteMany({where:{email}}); }
});
