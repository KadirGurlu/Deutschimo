"use client";
import { useEffect, useState } from "react";
import { createErrorCode } from "@/lib/monitoring/error-code";
import { reportClientError } from "@/lib/monitoring/client-reporter";
export default function ErrorPage({error,reset}:{error:Error&{digest?:string};reset:()=>void}){
  const [code]=useState(()=>createErrorCode("UI","PAGE",error.digest));
  useEffect(()=>{void reportClientError({domain:"UI",operation:"PAGE",code,message:error.message,stack:error.stack,metadata:{digest:error.digest||""}});},[code,error]);
  return <main className="standalone-form"><section className="form-card"><span className="eyebrow">HATA</span><h1>Sayfa şu anda tamamlanamadı.</h1><p>Tekrar deneyin. Sorun devam ederse hata kodunu destek ekibine iletin.</p><div className="auth-message auth-error">Hata kodu: {code}</div><button className="button button-primary" onClick={reset}>Tekrar Dene</button></section></main>;
}
