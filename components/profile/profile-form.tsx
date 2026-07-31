"use client";

import { FormEvent, useState } from "react";
import { useSession } from "next-auth/react";
import { Award, Bell, CheckCircle2, CreditCard, Flame, Lock, Shield, Target } from "lucide-react";

type ProfileUser = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  image: string | null;
  currentLevel: "A1" | "A2" | "B1" | "B2";
  targetLevel: "A1" | "A2" | "B1" | "B2";
  dailyGoalMinutes: number;
};

export function ProfileForm({ initialUser }: { initialUser: ProfileUser }) {
  const { update } = useSession();
  const [form, setForm] = useState({
    firstName: initialUser.firstName ?? "",
    lastName: initialUser.lastName ?? "",
    currentLevel: initialUser.currentLevel,
    targetLevel: initialUser.targetLevel,
    dailyGoalMinutes: initialUser.dailyGoalMinutes,
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const initials = `${form.firstName[0] ?? "D"}${form.lastName[0] ?? ""}`.toUpperCase();

  async function submit(event: FormEvent) {
    event.preventDefault();
    setMessage(""); setError("");
    const response = await fetch("/api/profile", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    const payload = await response.json() as { user?: ProfileUser; error?: string };
    if (!response.ok || !payload.user) { setError(payload.error ?? "Profil güncellenemedi."); return; }
    await update({ user: { firstName: payload.user.firstName, lastName: payload.user.lastName, currentLevel: payload.user.currentLevel, targetLevel: payload.user.targetLevel, dailyGoalMinutes: payload.user.dailyGoalMinutes } });
    setMessage("Profil bilgilerin kaydedildi.");
  }

  return <div className="profile-grid" style={{marginTop:30}}><aside className="panel profile-card"><div className="profile-avatar">{initials}</div><h2 style={{marginBottom:4}}>{form.firstName} {form.lastName}</h2><span className="level-badge">Mevcut {form.currentLevel} · Hedef {form.targetLevel}</span><div className="activity-list" style={{marginTop:24,textAlign:"left"}}><ProfileStat icon={<Target/>} label="Günlük hedef" value={`${form.dailyGoalMinutes} dakika`}/><ProfileStat icon={<Flame/>} label="İlerleme" value="Bütün cihazlarda senkronize"/><ProfileStat icon={<Award/>} label="Sertifikalar" value="Henüz yok"/></div></aside><section className="panel"><div className="settings-tabs"><button className="active">Genel</button><button>Öğrenme</button><button>Bildirimler</button><button>Gizlilik</button></div><form className="form-grid" onSubmit={submit}><div className="form-two"><label className="field"><span>Ad</span><input value={form.firstName} onChange={(e)=>setForm({...form,firstName:e.target.value})}/></label><label className="field"><span>Soyad</span><input value={form.lastName} onChange={(e)=>setForm({...form,lastName:e.target.value})}/></label></div><label className="field"><span>E-posta</span><input value={initialUser.email ?? ""} disabled type="email"/></label><div className="form-two"><label className="field"><span>Mevcut seviye</span><select value={form.currentLevel} onChange={(e)=>setForm({...form,currentLevel:e.target.value as ProfileUser["currentLevel"]})}>{["A1","A2","B1","B2"].map((x)=><option key={x}>{x}</option>)}</select></label><label className="field"><span>Hedef seviye</span><select value={form.targetLevel} onChange={(e)=>setForm({...form,targetLevel:e.target.value as ProfileUser["targetLevel"]})}>{["A1","A2","B1","B2"].map((x)=><option key={x}>{x}</option>)}</select></label></div><label className="field"><span>Günlük hedef</span><select value={form.dailyGoalMinutes} onChange={(e)=>setForm({...form,dailyGoalMinutes:Number(e.target.value)})}>{[15,30,45,60].map((x)=><option value={x} key={x}>{x} dakika</option>)}</select></label><button className="button button-primary" type="submit" style={{justifySelf:"start"}}>Değişiklikleri Kaydet</button></form>{message?<div className="auth-message auth-success"><CheckCircle2 size={18}/>{message}</div>:null}{error?<div className="auth-message auth-error">{error}</div>:null}<div className="feature-grid" style={{marginTop:30}}><Setting icon={<Bell/>} title="Bildirimler" copy="Ders ve seri hatırlatmaları"/><Setting icon={<Lock/>} title="Şifre" copy="Şifreni yenile"/><Setting icon={<CreditCard/>} title="Abonelik" copy="V14 için hazırlanıyor"/><Setting icon={<Shield/>} title="Gizlilik" copy="Hesap ve veri yönetimi"/></div></section></div>;
}

function ProfileStat({icon,label,value}:{icon:React.ReactNode;label:string;value:string}){return <div className="activity"><div style={{color:"var(--turquoise-dark)"}}>{icon}</div><div><strong>{label}</strong><span style={{display:"block",color:"var(--muted)",fontSize:13}}>{value}</span></div></div>}
function Setting({icon,title,copy}:{icon:React.ReactNode;title:string;copy:string}){return <button className="feature-card" style={{textAlign:"left"}}><div style={{color:"var(--turquoise-dark)"}}>{icon}</div><h3>{title}</h3><p>{copy}</p></button>}
