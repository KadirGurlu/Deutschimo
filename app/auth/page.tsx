"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { registerUser } from "@/lib/client-storage";
import type { CourseLevel } from "@/types/course";

export default function AuthPage() {
  const [mode, setMode] = useState<"login" | "register">("register");
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", password: "", level: "A1" as CourseLevel, targetLevel: "B2" as CourseLevel });

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (mode === "register") {
      registerUser({ firstName: form.firstName.trim(), lastName: form.lastName.trim(), email: form.email.trim(), level: form.level, targetLevel: form.targetLevel });
      setMessage("Hesabın oluşturuldu. Bu kayıt admin panelindeki Kullanıcılar sayfasında görünecek.");
    } else {
      setMessage("Demo giriş başarılı. Öğrenci paneline geçebilirsin.");
    }
  };

  return <div className="auth-shell"><section className="auth-visual"><span className="eyebrow" style={{color:"var(--turquoise)"}}>DEUTSCHIMO</span><h1>Almanca öğrenme yolculuğuna bugün başla.</h1><p>A1'den B2'ye yazılı ders anlatımları, özgün alıştırmalar ve ünite bazlı ilerleme takibi.</p><ul className="check-list">{["A1 12, A2 16, B1 18 ve B2 20 ünite","Video olmadan odaklı okuma ve uygulama","Tamamlanan ünitelerde otomatik ilerleme"].map((item) => <li key={item}><CheckCircle2 size={19}/>{item}</li>)}</ul></section>
    <section className="auth-panel"><div className="form-card"><div className="auth-tabs"><button className={mode === "register" ? "active" : ""} onClick={() => { setMode("register"); setMessage(""); }}>Kayıt Ol</button><button className={mode === "login" ? "active" : ""} onClick={() => { setMode("login"); setMessage(""); }}>Giriş Yap</button></div><span className="eyebrow">{mode === "register" ? "YENİ HESAP" : "HESABINA GİRİŞ"}</span><h2>{mode === "register" ? "Öğrenme planını oluştur" : "Tekrar hoş geldin"}</h2>
      <form className="form-grid" onSubmit={submit}>
        {mode === "register" ? <><div className="form-two"><Field label="Ad"><input required value={form.firstName} onChange={(event) => setForm({...form, firstName:event.target.value})}/></Field><Field label="Soyad"><input required value={form.lastName} onChange={(event) => setForm({...form, lastName:event.target.value})}/></Field></div></> : null}
        <Field label="E-posta"><input required type="email" value={form.email} onChange={(event) => setForm({...form, email:event.target.value})} placeholder="kadir@example.com"/></Field>
        <Field label="Şifre"><input required minLength={8} type="password" value={form.password} onChange={(event) => setForm({...form, password:event.target.value})} placeholder="En az 8 karakter"/></Field>
        {mode === "register" ? <div className="form-two"><Field label="Mevcut seviye"><select value={form.level} onChange={(event) => setForm({...form, level:event.target.value as CourseLevel})}>{["A1","A2","B1","B2"].map((item)=><option key={item}>{item}</option>)}</select></Field><Field label="Hedef seviye"><select value={form.targetLevel} onChange={(event) => setForm({...form, targetLevel:event.target.value as CourseLevel})}>{["A1","A2","B1","B2"].map((item)=><option key={item}>{item}</option>)}</select></Field></div> : null}
        {mode === "register" ? <label className="filter-option"><input required type="checkbox"/> Kullanım şartlarını ve gizlilik politikasını kabul ediyorum.</label> : null}
        <button className="button button-primary" type="submit">{mode === "register" ? "Ücretsiz Hesap Oluştur" : "Giriş Yap"}</button>
      </form>
      {message ? <div className="save-message"><CheckCircle2 size={18}/>{message}<Link href={mode === "register" ? "/onboarding" : "/dashboard"}>Devam et →</Link></div> : null}
      {mode === "register" ? <p className="auth-admin-note">Yönetici görünümü: <Link href="/admin/users">Kayıtlı kullanıcıları aç</Link></p> : null}
    </div></section>
  </div>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="field"><span>{label}</span>{children}</label>; }
