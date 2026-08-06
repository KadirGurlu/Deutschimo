import { expect, test } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
const prisma=new PrismaClient(); const password="V31.2-Test!2026";
test.describe.configure({mode:"serial"}); test.afterAll(async()=>prisma.$disconnect());
test("V31.2 tam kritik akış: yetki, kayıt, hatalı/doğru giriş, kurs, ilerleme, yenileme ve çıkış",async({page,context})=>{
  const email=`e2e.v312.${Date.now()}@preview.deutschimo.test`;
  try{
    await context.clearCookies(); await page.goto("/dashboard"); await expect(page).toHaveURL(/\/auth(?:\?|$)/);
    const home=await page.goto("/"); expect(home?.status()||500).toBeLessThan(400);
    await page.goto("/auth?mode=register");
    await page.getByLabel("Ad",{exact:true}).fill("V31"); await page.getByLabel("Soyad",{exact:true}).fill("Release"); await page.getByLabel("E-posta",{exact:true}).fill(email); await page.getByLabel("Şifre",{exact:true}).fill(password); await page.getByLabel("Mevcut seviye",{exact:true}).selectOption("A1"); await page.getByLabel("Hedef seviye",{exact:true}).selectOption("B2"); await page.getByRole("checkbox").check(); await page.getByRole("button",{name:"Hesap Oluştur"}).click();
    await expect(page).toHaveURL(/\/dashboard(?:\?|$)/,{timeout:30_000}); await expect(page.getByRole("heading",{name:/Tekrar hoş geldin/i})).toBeVisible();
    page.once("dialog",d=>d.accept()); await page.getByRole("button",{name:/Çıkış yap/i}).first().click(); await expect(page).toHaveURL(/\/$/,{timeout:20_000});
    await page.goto("/auth?mode=login"); await page.getByLabel("E-posta").fill(email); await page.getByLabel("Şifre").fill("Yanlis-Sifre!2026"); await page.locator("form").getByRole("button",{name:"Giriş Yap"}).click(); await expect(page.getByText("Hata kodu: AUTH-LOGIN-0042")).toBeVisible();
    await page.getByLabel("Şifre").fill(password); await page.locator("form").getByRole("button",{name:"Giriş Yap"}).click(); await expect(page).toHaveURL(/\/dashboard(?:\?|$)/,{timeout:30_000});
    const courses=await page.goto("/courses"); expect(courses?.status()||500).toBeLessThan(400); await expect(page.locator('a[href="/courses/a1"]').first()).toBeVisible(); const course=await page.goto("/courses/a1"); expect(course?.status()||500).toBeLessThan(400); await expect(page.locator("body")).toContainText(/A1/);
    const now=new Date().toISOString();
    const state={userId:"browser",enrollments:[{id:`enroll-${Date.now()}`,userId:"browser",courseId:"a1",status:"ACTIVE",enrolledAt:now}],unitProgress:{"a1-u01":{id:`progress-${Date.now()}`,userId:"browser",unitId:"a1-u01",status:"COMPLETED",stage:"COMPLETED",lessonProgress:100,exerciseProgress:100,quizProgress:100,totalProgress:100,completedSlideIds:[],completedExerciseIds:[],startedAt:now,completedAt:now,lastVisitedAt:now,bestQuizScore:100}},slideProgress:{},exerciseAttempts:[],quizAttempts:[],learningPositions:{a1:{userId:"browser",courseId:"a1",unitId:"a1-u01",stage:"COMPLETED",updatedAt:now}},activities:[{id:`activity-${Date.now()}`,userId:"browser",eventType:"UNIT_COMPLETED",courseId:"a1",unitId:"a1-u01",createdAt:now}],studySessions:[]};
    const put=await page.evaluate(async(s)=>{const r=await fetch("/api/progress",{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({state:s})});return{status:r.status,body:await r.json()};},state); expect(put.status).toBe(200);
    const first=await page.evaluate(async()=>{const r=await fetch("/api/progress");return{status:r.status,body:await r.json()};}); expect(first.status).toBe(200); expect(first.body.state.unitProgress["a1-u01"].status).toBe("COMPLETED");
    await page.reload(); const afterRefresh=await page.evaluate(async()=>{const r=await fetch("/api/progress");return{status:r.status,body:await r.json()};}); expect(afterRefresh.status).toBe(200); expect(afterRefresh.body.state.unitProgress["a1-u01"].totalProgress).toBe(100);
    page.once("dialog",d=>d.accept()); await page.goto("/dashboard"); await page.getByRole("button",{name:/Çıkış yap/i}).first().click(); await expect(page).toHaveURL(/\/$/,{timeout:20_000}); await page.goto("/dashboard"); await expect(page).toHaveURL(/\/auth(?:\?|$)/);
  } finally { await prisma.user.deleteMany({where:{email}}); }
});
