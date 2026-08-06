"use client";
import { FormEvent, useState } from "react";
import Link from "next/link";
import { CheckCircle2, LoaderCircle } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState(""); const [message, setMessage] = useState(""); const [loading, setLoading] = useState(false);
  async function submit(event: FormEvent) { event.preventDefault(); setLoading(true); const response = await fetch("/api/auth/request-password-reset", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({email}) }); const payload = await response.json() as {message?:string}; setMessage(payload.message ?? "İstek alındı."); setLoading(false); }
  return <section className="standalone-form"><div className="form-card"><span className="eyebrow">ŞİFRE YENİLEME</span><h1>Şifreni mi unuttun?</h1><p>Kayıtlı e-posta adresini gir. Hesabın varsa sana güvenli bir yenileme bağlantısı gönderilecek.</p><form className="form-grid" onSubmit={submit}><label className="field"><span>E-posta</span><input required type="email" value={email} onChange={(e)=>setEmail(e.target.value)}/></label><button className="button button-primary" disabled={loading}>{loading?<><LoaderCircle className="spin" size={18}/>Gönderiliyor</>:"Bağlantı Gönder"}</button></form>{message?<div className="auth-message auth-success"><CheckCircle2 size={18}/>{message}</div>:null}<Link href="/auth">← Giriş sayfasına dön</Link></div></section>;
}
