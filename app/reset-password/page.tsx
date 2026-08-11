"use client";

import { FormEvent, Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AlertCircle, CheckCircle2 } from "lucide-react";

function ResetPasswordContent() {
  const token = useSearchParams().get("token") ?? "";
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setMessage("");

    const response = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });
    const payload = (await response.json()) as { error?: string };

    if (!response.ok) {
      setError(payload.error ?? "Şifre değiştirilemedi.");
      return;
    }

    setMessage("Şifren başarıyla değiştirildi.");
  }

  return (
    <section className="standalone-form">
      <div className="form-card">
        <span className="eyebrow">YENİ ŞİFRE</span>
        <h1>Yeni şifreni belirle</h1>

        <form className="form-grid" onSubmit={submit}>
          <label className="field" htmlFor="reset-password">
            <span>Yeni şifre</span>
          </label>
          <input
            id="reset-password"
            name="new-password"
            required
            minLength={8}
            type="password"
            autoComplete="new-password"
            aria-describedby="reset-password-help"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          <p id="reset-password-help" className="v46-10-field-help">
            En az 8 karakter kullan.
          </p>
          <button className="button button-primary">Şifreyi Güncelle</button>
        </form>

        {error ? (
          <div
            className="auth-message auth-error"
            role="alert"
            aria-live="assertive"
            aria-atomic="true"
          >
            <AlertCircle size={18} aria-hidden="true" />
            {error}
          </div>
        ) : null}

        {message ? (
          <div
            className="auth-message auth-success"
            role="status"
            aria-live="polite"
            aria-atomic="true"
          >
            <CheckCircle2 size={18} aria-hidden="true" />
            {message}
            <Link href="/auth">Giriş yap →</Link>
          </div>
        ) : null}
      </div>
    </section>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <section className="standalone-form">
          <div className="form-card" role="status" aria-live="polite">
            Yükleniyor…
          </div>
        </section>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}
