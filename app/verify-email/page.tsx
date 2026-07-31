"use client";
import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AlertCircle, CheckCircle2, LoaderCircle } from "lucide-react";

function VerifyEmailContent(){const token=useSearchParams().get("token")??"";const [state,setState]=useState<"loading"|"success"|"error">("loading");useEffect(()=>{fetch("/api/auth/verify-email",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({token})}).then((r)=>{if(!r.ok)throw new Error();setState("success")}).catch(()=>setState("error"));},[token]);return <section className="standalone-form"><div className="form-card">{state==="loading"?<><LoaderCircle className="spin"/><h1>E-posta doğrulanıyor</h1></>:state==="success"?<><CheckCircle2 color="var(--success)"/><h1>Hesabın etkinleştirildi</h1><Link className="button button-primary" href="/auth">Giriş Yap</Link></>:<><AlertCircle color="var(--error)"/><h1>Bağlantı geçersiz</h1><p>Bağlantının süresi dolmuş olabilir.</p></>}</div></section>}

export default function VerifyEmailPage(){return <Suspense fallback={<section className="standalone-form"><div className="form-card">Doğrulama hazırlanıyor…</div></section>}><VerifyEmailContent/></Suspense>}
