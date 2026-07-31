"use client";

import { FormEvent, Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { AlertCircle, CheckCircle2, LoaderCircle } from "lucide-react";
import type { CourseLevel } from "@/types/course";

function AuthContent() {
  const [mode, setMode] = useState<"login" | "register">("register");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", password: "", level: "A1" as CourseLevel, targetLevel: "B2" as CourseLevel });
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
  const googleEnabled = process.env.NEXT_PUBLIC_GOOGLE_AUTH_ENABLED === "true";

  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true); setError(""); setMessage("");
    try {
      if (mode === "register") {
        const response = await fetch("/api/auth/register", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ firstName: form.firstName, lastName: form.lastName, email: form.email, password: form.password, currentLevel: form.level, targetLevel: form.targetLevel }) });
        const payload = await response.json() as { error?: string; requiresVerification?: boolean };
        if (!response.ok) throw new Error(payload.error || "Hesap oluşturulamadı.");
        if (payload.requiresVerification) {
          setMessage("Hesabın oluşturuldu. E-posta adresine gönderilen bağlantıyla hesabını doğrula.");
          return;
        }
      }
      const result = await signIn("credentials", { email: form.email.trim().toLowerCase(), password: form.password, redirect: false, callbackUrl });
      if (result?.error) throw new Error("E-posta veya şifre hatalı. Hesabın askıya alınmış ya da doğrulanmamış da olabilir.");
      router.push(result?.url || callbackUrl);
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "İşlem tamamlanamadı.");
    } finally {
      setLoading(false);
    }
  }

  return <div className="auth-shell"><section className="auth-visual"><span className="eyebrow" style={{color:"var(--turquoise)"}}>DEUTSCHIMO V11</span><h1>İlerlemen artık bütün cihazlarında seninle.</h1><p>Gerçek kullanıcı hesabı, güvenli oturum ve PostgreSQL üzerinde saklanan öğrenme geçmişi.</p><ul className="check-list">{["E-posta ve şifreyle güvenli giriş","Farklı cihazlarda kaldığın yerden devam","Gerçek admin kullanıcı yönetimi"].map((item) => <li key={item}><CheckCircle2 size={19}/>{item}</li>)}</ul></section>
    <section className="auth-panel"><div className="form-card"><div className="auth-tabs"><button type="button" className={mode === "register" ? "active" : ""} onClick={() => { setMode("register"); setError(""); setMessage(""); }}>Kayıt Ol</button><button type="button" className={mode === "login" ? "active" : ""} onClick={() => { setMode("login"); setError(""); setMessage(""); }}>Giriş Yap</button></div><span className="eyebrow">{mode === "register" ? "YENİ HESAP" : "GÜVENLİ OTURUM"}</span><h2>{mode === "register" ? "Öğrenme hesabını oluştur" : "Tekrar hoş geldin"}</h2>
      {googleEnabled ? <button className="button button-secondary" type="button" onClick={() => signIn("google", { callbackUrl })}>Google ile devam et</button> : null}
      <form className="form-grid" onSubmit={submit}>
        {mode === "register" ? <div className="form-two"><Field label="Ad"><input required autoComplete="given-name" value={form.firstName} onChange={(event) => setForm({...form, firstName:event.target.value})}/></Field><Field label="Soyad"><input required autoComplete="family-name" value={form.lastName} onChange={(event) => setForm({...form, lastName:event.target.value})}/></Field></div> : null}
        <Field label="E-posta"><input required autoComplete="email" type="email" value={form.email} onChange={(event) => setForm({...form, email:event.target.value})} placeholder="anna@example.com"/></Field>
        <Field label="Şifre"><input required autoComplete={mode === "register" ? "new-password" : "current-password"} minLength={8} type="password" value={form.password} onChange={(event) => setForm({...form, password:event.target.value})} placeholder="En az 8 karakter, harf ve rakam"/></Field>
        {mode === "register" ? <div className="form-two"><Field label="Mevcut seviye"><select value={form.level} onChange={(event) => setForm({...form, level:event.target.value as CourseLevel})}>{["A1","A2","B1","B2"].map((item)=><option key={item}>{item}</option>)}</select></Field><Field label="Hedef seviye"><select value={form.targetLevel} onChange={(event) => setForm({...form, targetLevel:event.target.value as CourseLevel})}>{["A1","A2","B1","B2"].map((item)=><option key={item}>{item}</option>)}</select></Field></div> : null}
        {mode === "register" ? <label className="filter-option"><input required type="checkbox"/> Kullanım şartlarını ve gizlilik politikasını kabul ediyorum.</label> : <div style={{textAlign:"right"}}><Link href="/forgot-password">Şifremi unuttum</Link></div>}
        <button className="button button-primary" disabled={loading} type="submit">{loading ? <><LoaderCircle size={18} className="spin"/> İşlem yapılıyor</> : mode === "register" ? "Hesap Oluştur" : "Giriş Yap"}</button>
      </form>
      {error ? <div className="auth-message auth-error"><AlertCircle size={18}/>{error}</div> : null}
      {message ? <div className="auth-message auth-success"><CheckCircle2 size={18}/>{message}</div> : null}
    </div></section>
  </div>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="field"><span>{label}</span>{children}</label>; }

export default function AuthPage() { return <Suspense fallback={<div className="standalone-form"><div className="form-card">Oturum ekranı yükleniyor…</div></div>}><AuthContent/></Suspense>; }
