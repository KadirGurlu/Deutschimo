import { withApiMonitoring } from "@/lib/security/api-monitor";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hashPassword, validatePassword } from "@/lib/auth/password";
import { createSecureToken, hashToken } from "@/lib/auth/tokens";
import { sendTransactionalEmail } from "@/lib/email/resend";
import { escapeHtml } from "@/lib/email/html";
import type { Level } from "@prisma/client";
import { consumeRateLimit } from "@/lib/security/rate-limit";
import { getClientIp } from "@/lib/security/request";

const levels = new Set(["A1", "A2", "B1", "B2"]);
const emailPattern = /^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,63}$/;

function text(value: unknown, maxLength: number) {
  return String(value ?? "").trim().slice(0, maxLength);
}

async function POSTHandler(request: Request) {
  const ip = getClientIp(request);
  const limited = await consumeRateLimit({ scope: "register", key: ip, limit: 5, windowSeconds: 3600 });
  if (!limited.allowed) return NextResponse.json({ error: "Çok fazla kayıt denemesi. Daha sonra tekrar dene." }, { status: 429, headers: { "Retry-After": String(limited.retryAfterSeconds) } });

  const body = await request.json() as Record<string, unknown>;
  const firstName = text(body.firstName, 80);
  const lastName = text(body.lastName, 80);
  const email = text(body.email, 320).toLowerCase();
  const password = String(body.password ?? "");
  const currentLevel = levels.has(String(body.currentLevel)) ? String(body.currentLevel) as Level : "A1";
  const targetLevel = levels.has(String(body.targetLevel)) ? String(body.targetLevel) as Level : "B2";

  if (firstName.length < 2 || lastName.length < 2) return NextResponse.json({ error: "Ad ve soyad alanlarını eksiksiz doldur." }, { status: 400 });
  if (!emailPattern.test(email)) return NextResponse.json({ error: "Geçerli bir e-posta adresi gir." }, { status: 400 });
  const passwordError = validatePassword(password);
  if (passwordError) return NextResponse.json({ error: passwordError }, { status: 400 });

  const emailLimited = await consumeRateLimit({ scope: "register-email", key: email, limit: 3, windowSeconds: 24 * 3600 });
  if (!emailLimited.allowed) return NextResponse.json({ error: "Bu e-posta adresi için çok fazla kayıt denemesi yapıldı." }, { status: 429, headers: { "Retry-After": String(emailLimited.retryAfterSeconds) } });

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
    const verificationUrl = `${origin}/verify-email?token=${encodeURIComponent(rawToken)}`;
    await sendTransactionalEmail({
      to: user.email,
      subject: "Deutschimo e-posta adresini doğrula",
      html: `<p>Merhaba ${escapeHtml(user.firstName ?? "")},</p><p>Deutschimo hesabını etkinleştirmek için aşağıdaki bağlantıya tıkla:</p><p><a href="${escapeHtml(verificationUrl)}">E-posta adresimi doğrula</a></p><p>Bağlantı 24 saat geçerlidir.</p>`,
    });
  }

  return NextResponse.json({ ok: true, requiresVerification: requireVerification }, { status: 201 });
}

export const POST = withApiMonitoring("/api/auth/register", POSTHandler, { maxBodyBytes: 32 * 1024 });
