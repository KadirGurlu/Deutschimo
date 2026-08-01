import { withApiMonitoring } from "@/lib/security/api-monitor";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hashPassword, validatePassword } from "@/lib/auth/password";
import { createSecureToken, hashToken } from "@/lib/auth/tokens";
import { sendTransactionalEmail } from "@/lib/email/resend";
import type { Level } from "@prisma/client";
import { consumeRateLimit } from "@/lib/security/rate-limit";
import { getClientIp } from "@/lib/security/request";

const levels = new Set(["A1", "A2", "B1", "B2"]);

async function POSTHandler(request: Request) {
  try {
    const limited = await consumeRateLimit({ scope: "register", key: getClientIp(request), limit: 5, windowSeconds: 3600 });
    if (!limited.allowed) return NextResponse.json({ error: "Çok fazla kayıt denemesi. Daha sonra tekrar dene." }, { status: 429, headers: { "Retry-After": String(limited.retryAfterSeconds) } });
    const body = await request.json() as Record<string, unknown>;
    const firstName = String(body.firstName ?? "").trim();
    const lastName = String(body.lastName ?? "").trim();
    const email = String(body.email ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");
    const currentLevel = levels.has(String(body.currentLevel)) ? String(body.currentLevel) as Level : "A1";
    const targetLevel = levels.has(String(body.targetLevel)) ? String(body.targetLevel) as Level : "B2";

    if (firstName.length < 2 || lastName.length < 2) return NextResponse.json({ error: "Ad ve soyad alanlarını eksiksiz doldur." }, { status: 400 });
    if (!/^\S+@\S+\.\S+$/.test(email)) return NextResponse.json({ error: "Geçerli bir e-posta adresi gir." }, { status: 400 });
    const passwordError = validatePassword(password);
    if (passwordError) return NextResponse.json({ error: passwordError }, { status: 400 });

    const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (existing) return NextResponse.json({ error: "Bu e-posta adresiyle daha önce hesap oluşturulmuş." }, { status: 409 });

    const requireVerification = process.env.REQUIRE_EMAIL_VERIFICATION === "true";
    if (requireVerification && (!process.env.RESEND_API_KEY || !process.env.EMAIL_FROM)) {
      return NextResponse.json({ error: "E-posta doğrulama servisi henüz yapılandırılmamış." }, { status: 503 });
    }

    const user = await prisma.user.create({
      data: {
        firstName,
        lastName,
        name: `${firstName} ${lastName}`,
        email,
        passwordHash: await hashPassword(password),
        currentLevel,
        targetLevel,
        status: requireVerification ? "PENDING_VERIFICATION" : "ACTIVE",
        emailVerified: requireVerification ? null : new Date(),
        lastSeenAt: new Date(),
        privacyAcceptedAt: new Date(),
        isTestUser: Boolean(body.isTestUser) && process.env.NODE_ENV !== "production",
      },
      select: { id: true, email: true, firstName: true },
    });

    if (requireVerification && user.email) {
      const rawToken = createSecureToken();
      await prisma.emailVerificationToken.create({
        data: { userId: user.id, tokenHash: hashToken(rawToken), expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) },
      });
      const origin = process.env.AUTH_URL ?? new URL(request.url).origin;
      const verificationUrl = `${origin}/verify-email?token=${rawToken}`;
      await sendTransactionalEmail({
        to: user.email,
        subject: "Deutschimo e-posta adresini doğrula",
        html: `<p>Merhaba ${user.firstName ?? ""},</p><p>Deutschimo hesabını etkinleştirmek için aşağıdaki bağlantıya tıkla:</p><p><a href="${verificationUrl}">E-posta adresimi doğrula</a></p><p>Bağlantı 24 saat geçerlidir.</p>`,
      });
    }

    return NextResponse.json({ ok: true, requiresVerification: requireVerification }, { status: 201 });
  } catch (error) {
    console.error("register_error", error);
    return NextResponse.json({ error: "Hesap oluşturulamadı. Veritabanı bağlantısını ve ortam değişkenlerini kontrol et." }, { status: 500 });
  }
}

export const POST = withApiMonitoring("/api/auth/register", POSTHandler);
