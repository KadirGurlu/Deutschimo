"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertCircle, LoaderCircle, Search, ShieldAlert, Trash2, UserCheck } from "lucide-react";

type AdminUser = {
  id: string; firstName: string | null; lastName: string | null; email: string | null;
  role: "STUDENT"|"INSTRUCTOR"|"EDITOR"|"MODERATOR"|"ADMIN"|"SUPER_ADMIN";
  status: "ACTIVE"|"SUSPENDED"|"PENDING_VERIFICATION";
  currentLevel: "A1"|"A2"|"B1"|"B2"; targetLevel: "A1"|"A2"|"B1"|"B2";
  createdAt: string; lastSeenAt: string | null; emailVerified: string | null;
};

const roleLabels: Record<AdminUser["role"], string> = { STUDENT:"Öğrenci", INSTRUCTOR:"Eğitmen", EDITOR:"İçerik Editörü", MODERATOR:"Moderatör", ADMIN:"Yönetici", SUPER_ADMIN:"Süper Yönetici" };
const statusLabels: Record<AdminUser["status"], string> = { ACTIVE:"Aktif", SUSPENDED:"Askıda", PENDING_VERIFICATION:"Doğrulama Bekliyor" };

export function UserManager() {
  const [users,setUsers]=useState<AdminUser[]>([]); const [query,setQuery]=useState(""); const [total,setTotal]=useState(0); const [loading,setLoading]=useState(true); const [error,setError]=useState("");
  const load=useCallback(async()=>{setLoading(true);setError("");try{const response=await fetch(`/api/admin/users?q=${encodeURIComponent(query)}`,{cache:"no-store"});const payload=await response.json() as {users?:AdminUser[];total?:number;error?:string};if(!response.ok)throw new Error(payload.error);setUsers(payload.users??[]);setTotal(payload.total??0);}catch(caught){setError(caught instanceof Error?caught.message:"Kullanıcılar yüklenemedi.");}finally{setLoading(false);}},[query]);
  useEffect(()=>{const timer=setTimeout(load,250);return()=>clearTimeout(timer)},[load]);

  async function update(id:string,changes:Partial<Pick<AdminUser,"role"|"status"|"currentLevel"|"targetLevel">>){const response=await fetch(`/api/admin/users/${id}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify(changes)});const payload=await response.json() as {user?:AdminUser;error?:string};if(!response.ok){setError(payload.error??"Güncelleme başarısız.");return;}if(payload.user)setUsers((current)=>current.map((user)=>user.id===id?payload.user!:user));}
  async function remove(id:string){if(!window.confirm("Bu kullanıcı ve bütün öğrenme verileri kalıcı olarak silinecek. Devam edilsin mi?"))return;const response=await fetch(`/api/admin/users/${id}`,{method:"DELETE"});const payload=await response.json() as {error?:string};if(!response.ok){setError(payload.error??"Kullanıcı silinemedi.");return;}setUsers((current)=>current.filter((user)=>user.id!==id));setTotal((value)=>Math.max(0,value-1));}

  return <>
    <div className="admin-user-toolbar"><div className="header-search"><Search size={18}/><input value={query} onChange={(event)=>setQuery(event.target.value)} placeholder="İsim veya e-posta ile ara"/></div><span className="level-badge">{total} gerçek kullanıcı</span></div>
    {error?<div className="auth-message auth-error"><AlertCircle size={18}/>{error}</div>:null}
    {loading?<div className="learning-loading"><LoaderCircle className="spin"/> Kullanıcılar PostgreSQL'den yükleniyor…</div>:<div className="table-wrap"><table className="data-table admin-users-table"><thead><tr><th>Kullanıcı</th><th>Seviye</th><th>Hedef</th><th>Rol</th><th>Durum</th><th>Son etkinlik</th><th>İşlem</th></tr></thead><tbody>{users.map((user)=><tr key={user.id}><td><strong>{user.firstName} {user.lastName}</strong><span>{user.email}</span>{!user.emailVerified?<small>E-posta doğrulanmadı</small>:null}</td><td><select value={user.currentLevel} onChange={(e)=>update(user.id,{currentLevel:e.target.value as AdminUser["currentLevel"]})}>{["A1","A2","B1","B2"].map((x)=><option key={x}>{x}</option>)}</select></td><td><select value={user.targetLevel} onChange={(e)=>update(user.id,{targetLevel:e.target.value as AdminUser["targetLevel"]})}>{["A1","A2","B1","B2"].map((x)=><option key={x}>{x}</option>)}</select></td><td><select value={user.role} onChange={(e)=>update(user.id,{role:e.target.value as AdminUser["role"]})}>{Object.entries(roleLabels).map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></td><td><span className={`status ${user.status==="ACTIVE"?"live":"draft"}`}>{statusLabels[user.status]}</span></td><td>{user.lastSeenAt?new Intl.DateTimeFormat("tr-TR",{dateStyle:"medium",timeStyle:"short"}).format(new Date(user.lastSeenAt)):"Henüz giriş yapmadı"}</td><td><div className="row-actions"><button className="icon-button" title={user.status==="ACTIVE"?"Hesabı askıya al":"Hesabı aktifleştir"} onClick={()=>update(user.id,{status:user.status==="ACTIVE"?"SUSPENDED":"ACTIVE"})}>{user.status==="ACTIVE"?<ShieldAlert size={17}/>:<UserCheck size={17}/>}</button><button className="icon-button danger-icon" title="Kullanıcıyı sil" onClick={()=>remove(user.id)}><Trash2 size={17}/></button></div></td></tr>)}</tbody></table></div>}
    <p className="admin-data-note">Bu liste tarayıcıdaki demo kayıtlardan değil, PostgreSQL veritabanındaki gerçek hesaplardan gelir. Rol ve hesap durumu değişiklikleri anında sunucuya kaydedilir.</p>
  </>;
}
