"use client";
import React from "react";
import { createErrorCode } from "@/lib/monitoring/error-code";
import { reportClientError } from "@/lib/monitoring/client-reporter";
type State = { error?: Error; code?: string };
export class ErrorBoundary extends React.Component<React.PropsWithChildren, State> {
  state: State = {};
  static getDerivedStateFromError(error: Error): State { return { error, code:createErrorCode("UI","RENDER",error.message) }; }
  componentDidCatch(error: Error, info: React.ErrorInfo) { const code=this.state.code || createErrorCode("UI","RENDER",error.message); void reportClientError({domain:"UI",operation:"RENDER",code,message:error.message,stack:error.stack,metadata:{componentStack:info.componentStack?.slice(0,3000)}}); }
  render() {
    if (!this.state.error) return this.props.children;
    return <main className="standalone-form"><section className="form-card"><span className="eyebrow">TEKNİK HATA</span><h1>Bu ekran yüklenemedi.</h1><p>Sayfayı yenileyip tekrar deneyin. Sorun sürerse aşağıdaki kodu destek ekibiyle paylaşın.</p><div className="auth-message auth-error">Hata kodu: {this.state.code}</div><button className="button button-primary" onClick={()=>window.location.reload()}>Sayfayı Yenile</button></section></main>;
  }
}
