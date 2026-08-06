"use client";
import { FormEvent, Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AlertCircle, CheckCircle2 } from "lucide-react";

function ResetPasswordContent() {
  const token = useSearchParams().get("token") ?? ""; const [password,setPassword]=useState(""); const [message,setMessage]=useState(""); const [error,setError]=useState("");
  async function submit(event:FormEvent){event.preventDefault();setError("");const response=await fetch("/api/auth/reset-password",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({token,password})});const payload=await response.json() as {error?:string};if(!response.ok){setError(payload.error??"Şifre değiştirilemedi.");return;}setMessage("Şifren başarıyla değiştirildi.");}
  return <section className="standalone-form"><div className="form-card"><span className="eyebrow">YENİ ŞİFRE</span><h1>Yeni şifreni belirle</h1><form className="form-grid" onSubmit={submit}><label className="field"><span>Yeni şifre</span><input required minLength={8} type="password" value={password} onChange={(e)=>setPassword(e.target.value)}/></label><button className="button button-primary">Şifreyi Güncelle</button></form>{error?<div className="auth-message auth-error"><AlertCircle size={18}/>{error}</div>:null}{message?<div className="auth-message auth-success"><CheckCircle2 size={18}/>{message}<Link href="/auth">Giriş yap →</Link></div>:null}</div></section>;
}

export default function ResetPasswordPage(){return <Suspense fallback={<section className="standalone-form"><div className="form-card">Yükleniyor…</div></section>}><ResetPasswordContent/></Suspense>}
