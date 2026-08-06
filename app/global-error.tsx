"use client";
import { useEffect, useState } from "react";
import { createErrorCode } from "@/lib/monitoring/error-code";
import { reportClientError } from "@/lib/monitoring/client-reporter";
export default function GlobalError({error,reset}:{error:Error&{digest?:string};reset:()=>void}){
  const [code]=useState(()=>createErrorCode("UI","GLOBAL",error.digest));
  useEffect(()=>{void reportClientError({domain:"UI",operation:"GLOBAL",code,message:error.message,stack:error.stack});},[code,error]);
  return <html lang="tr"><body><main style={{fontFamily:"system-ui",padding:40,maxWidth:720,margin:"0 auto"}}><h1>Deutschimo yüklenemedi.</h1><p>Hata kodu: <strong>{code}</strong></p><button onClick={reset}>Tekrar Dene</button></main></body></html>;
}
