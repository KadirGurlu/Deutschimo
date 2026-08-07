import { expect, test } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
const prisma=new PrismaClient(); const password="V32-1-Dashboard!2026";
test.describe.configure({mode:"serial"}); test.afterAll(async()=>prisma.$disconnect());
test("V32.1 gun odakli dashboard ve gunluk plan akisi",async({page})=>{
  const email=`e2e.v321.${Date.now()}@preview.deutschimo.test`;
  try {
    await page.goto("/auth?mode=register");
    await page.getByLabel("Ad",{exact:true}).fill("V321"); await page.getByLabel("Soyad",{exact:true}).fill("Dashboard"); await page.getByLabel("E-posta",{exact:true}).fill(email); await page.getByLabel("Şifre",{exact:true}).fill(password); await page.getByRole("checkbox").check(); await page.getByRole("button",{name:"Hesap Oluştur"}).click();
    await expect(page).toHaveURL(/\/onboarding(?:\?|$)/,{timeout:30_000});
    await page.getByTestId("level-A1").click(); await page.getByTestId("onboarding-next").click();
    await page.getByTestId("goal-GERMANY_LIFE").click(); await page.getByTestId("onboarding-next").click();
    await page.getByTestId("daily-30").click(); await page.getByTestId("onboarding-next").click();
    await page.getByTestId("days-5").click(); await page.getByTestId("onboarding-next").click();
    await page.getByTestId("skill-VOCABULARY").click(); await page.getByTestId("skill-SPEAKING").click(); await page.getByTestId("onboarding-complete").click();
    await page.getByRole("button",{name:/Öğrenci paneline geç/i}).click();
    await expect(page).toHaveURL(/\/dashboard(?:\?|$)/,{timeout:30_000});
    await expect(page.getByTestId("v32-1-greeting")).toContainText("Guten Tag, V321");
    await expect(page.getByText("Bugünkü hedefin:")).toBeVisible();
    await expect(page.getByTestId("v32-1-today-plan")).toBeVisible({timeout:30_000});
    await expect(page.getByTestId("v32-1-today-plan")).not.toContainText("Seviye belirleme sınavını tamamla");
    await expect(page.getByTestId("v32-1-plan-minutes")).toContainText("0 / 30 dk");
    await expect(page.getByTestId("v32-1-continue-card")).toContainText("KALDIĞIN YERDEN DEVAM ET");
    await expect(page.getByTestId("v32-1-weekly-rhythm")).toContainText("0/5");
    await expect(page.getByText("Çalışma serisi")).toHaveCount(0);
    await page.getByTestId("v32-1-task-0").locator("button").click();
    await expect(page.getByTestId("v32-1-plan-minutes")).not.toContainText("0 / 30 dk");
    const plan=await prisma.dailyStudyPlan.findFirst({where:{user:{email}}});
    expect(plan?.goalMinutes).toBe(30); expect(plan?.plannedMinutes).toBe(30); expect(plan?.completedMinutes).toBeGreaterThan(0);
  } finally { await prisma.user.deleteMany({where:{email}}); }
});
