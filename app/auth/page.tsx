"use client";

import { FormEvent, Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { AlertCircle, CheckCircle2, LoaderCircle } from "lucide-react";
import type { CourseLevel } from "@/types/course";

const courseLevels: CourseLevel[] = ["A1", "A2", "B1", "B2"];

type AuthMode = "login" | "register";

function isCourseLevel(value: string | null): value is CourseLevel {
  return value !== null && courseLevels.includes(value as CourseLevel);
}

function getAuthErrorMessage(code: string | null) {
  switch (code) {
    case "OAuthAccountNotLinked":
    case "AccountNotLinked":
      return "Bu e-posta başka bir giriş yöntemiyle kayıtlı. Mevcut yöntemle giriş yapıp tekrar dene.";
    case "AccessDenied":
      return "Google ile giriş isteği tamamlanamadı veya hesap erişime uygun değil.";
    case "OAuthCallbackError":
    case "OAuthSignInError":
      return "Google ile bağlantı kurulamadı. Birkaç dakika sonra tekrar dene.";
    case "Configuration":
      return "Google girişi henüz tamamlanmamış. Yönetici OAuth ayarlarını kontrol etmelidir.";
    default:
      return "";
  }
}

function GoogleMark() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" width="20" height="20">
      <path fill="#4285F4" d="M21.6 12.23c0-.71-.06-1.39-.18-2.05H12v3.87h5.38a4.6 4.6 0 0 1-2 3.02v2.51h3.24c1.9-1.75 2.98-4.33 2.98-7.35Z" />
      <path fill="#34A853" d="M12 22c2.7 0 4.97-.9 6.62-2.42l-3.24-2.51c-.9.6-2.05.96-3.38.96-2.61 0-4.82-1.76-5.61-4.13H3.04v2.59A10 10 0 0 0 12 22Z" />
      <path fill="#FBBC05" d="M6.39 13.9A6 6 0 0 1 6.08 12c0-.66.11-1.3.31-1.9V7.51H3.04A10 10 0 0 0 2 12c0 1.61.38 3.14 1.04 4.49l3.35-2.59Z" />
      <path fill="#EA4335" d="M12 5.97c1.47 0 2.79.51 3.83 1.5l2.87-2.87A9.63 9.63 0 0 0 12 2a10 10 0 0 0-8.96 5.51l3.35 2.59C7.18 7.73 9.39 5.97 12 5.97Z" />
    </svg>
  );
}

function AuthContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedMode: AuthMode = searchParams.get("mode") === "login" ? "login" : "register";
  const requestedLevel = isCourseLevel(searchParams.get("level")) ? searchParams.get("level") as CourseLevel : "A1";

  const [mode, setMode] = useState<AuthMode>(requestedMode);
  const [message, setMessage] = useState("");
  const [error, setError] = useState(() => getAuthErrorMessage(searchParams.get("error")));
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    level: requestedLevel,
    targetLevel: "B2" as CourseLevel,
  });

  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
  const googleEnabled = process.env.NEXT_PUBLIC_GOOGLE_AUTH_ENABLED === "true";

  function selectMode(nextMode: AuthMode) {
    setMode(nextMode);
    setError("");
    setMessage("");
    const params = new URLSearchParams(searchParams.toString());
    params.set("mode", nextMode);
    params.delete("error");
    router.replace(`/auth?${params.toString()}`, { scroll: false });
  }

  async function continueWithGoogle() {
    setGoogleLoading(true);
    setError("");
    setMessage("");
    try {
      await signIn("google", { callbackUrl });
    } catch {
      setGoogleLoading(false);
      setError("Google ile giriş başlatılamadı. Bağlantını ve OAuth ayarlarını kontrol et.");
    }
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");
    try {
      if (mode === "register") {
        const response = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            firstName: form.firstName,
            lastName: form.lastName,
            email: form.email,
            password: form.password,
            currentLevel: form.level,
            targetLevel: form.targetLevel,
          }),
        });
        const payload = await response.json() as { error?: string; requiresVerification?: boolean };
        if (!response.ok) throw new Error(payload.error || "Hesap oluşturulamadı.");
        if (payload.requiresVerification) {
          setMessage("Hesabın oluşturuldu. E-posta adresine gönderilen bağlantıyla hesabını doğrula.");
          return;
        }
      }

      const result = await signIn("credentials", {
        email: form.email.trim().toLowerCase(),
        password: form.password,
        redirect: false,
        callbackUrl,
      });
      if (result?.error) throw new Error("E-posta veya şifre hatalı. Hesabın askıya alınmış ya da doğrulanmamış da olabilir.");
      router.push(result?.url || callbackUrl);
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "İşlem tamamlanamadı.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-shell">
      <section className="auth-visual">
        <span className="eyebrow" style={{ color: "var(--turquoise)" }}>DEUTSCHIMO V20</span>
        <h1>Almanca öğrenme yolun tek bir hesapta.</h1>
        <p>Derslerin, alıştırmaların ve ilerlemen bütün cihazlarında güvenle seninle kalır.</p>
        <ul className="check-list">
          {["A1–B2 yapılandırılmış kurslar", "Kişiselleştirilmiş öğrenme planı", "Cihazlar arası güvenli ilerleme"].map((item) => (
            <li key={item}><CheckCircle2 size={19} />{item}</li>
          ))}
        </ul>
      </section>

      <section className="auth-panel">
        <div className="form-card">
          <div className="auth-tabs">
            <button type="button" className={mode === "register" ? "active" : ""} onClick={() => selectMode("register")}>Kayıt Ol</button>
            <button type="button" className={mode === "login" ? "active" : ""} onClick={() => selectMode("login")}>Giriş Yap</button>
          </div>

          <span className="eyebrow">{mode === "register" ? "YENİ HESAP" : "GÜVENLİ OTURUM"}</span>
          <h2>{mode === "register" ? "Öğrenme hesabını oluştur" : "Tekrar hoş geldin"}</h2>

          {googleEnabled ? (
            <>
              <button
                className="button google-auth-button"
                type="button"
                disabled={googleLoading || loading}
                onClick={continueWithGoogle}
              >
                {googleLoading ? <LoaderCircle size={19} className="spin" /> : <GoogleMark />}
                Google ile devam et
              </button>
              <div className="auth-divider"><span>veya e-posta ile</span></div>
            </>
          ) : null}

          <form className="form-grid" onSubmit={submit}>
            {mode === "register" ? (
              <div className="form-two">
                <Field label="Ad"><input required autoComplete="given-name" value={form.firstName} onChange={(event) => setForm({ ...form, firstName: event.target.value })} /></Field>
                <Field label="Soyad"><input required autoComplete="family-name" value={form.lastName} onChange={(event) => setForm({ ...form, lastName: event.target.value })} /></Field>
              </div>
            ) : null}

            <Field label="E-posta">
              <input required autoComplete="email" type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="anna@example.com" />
            </Field>
            <Field label="Şifre">
              <input
                required
                autoComplete={mode === "register" ? "new-password" : "current-password"}
                minLength={mode === "register" ? 12 : 1}
                type="password"
                value={form.password}
                onChange={(event) => setForm({ ...form, password: event.target.value })}
                placeholder={mode === "register" ? "En az 12 karakter, büyük-küçük harf, rakam ve sembol" : "Şifreni gir"}
              />
            </Field>

            {mode === "register" ? (
              <div className="form-two">
                <Field label="Mevcut seviye">
                  <select value={form.level} onChange={(event) => setForm({ ...form, level: event.target.value as CourseLevel })}>
                    {courseLevels.map((item) => <option key={item}>{item}</option>)}
                  </select>
                </Field>
                <Field label="Hedef seviye">
                  <select value={form.targetLevel} onChange={(event) => setForm({ ...form, targetLevel: event.target.value as CourseLevel })}>
                    {courseLevels.map((item) => <option key={item}>{item}</option>)}
                  </select>
                </Field>
              </div>
            ) : null}

            {mode === "register" ? (
              <label className="filter-option">
                <input required type="checkbox" />
                <span><Link href="/terms">Kullanım şartlarını</Link> ve <Link href="/privacy">gizlilik politikasını</Link> kabul ediyorum.</span>
              </label>
            ) : (
              <div style={{ textAlign: "right" }}><Link href="/forgot-password">Şifremi unuttum</Link></div>
            )}

            <button className="button button-primary" disabled={loading || googleLoading} type="submit">
              {loading ? <><LoaderCircle size={18} className="spin" /> İşlem yapılıyor</> : mode === "register" ? "Hesap Oluştur" : "Giriş Yap"}
            </button>
          </form>

          {error ? <div className="auth-message auth-error"><AlertCircle size={18} />{error}</div> : null}
          {message ? <div className="auth-message auth-success"><CheckCircle2 size={18} />{message}</div> : null}
        </div>
      </section>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="field"><span>{label}</span>{children}</label>;
}

export default function AuthPage() {
  return (
    <Suspense fallback={<div className="standalone-form"><div className="form-card">Oturum ekranı yükleniyor…</div></div>}>
      <AuthContent />
    </Suspense>
  );
}
