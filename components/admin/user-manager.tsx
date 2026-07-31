"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, ShieldAlert, Trash2, UserCheck } from "lucide-react";
import { readUsers, writeUsers, type RegisteredUser } from "@/lib/client-storage";

export function UserManager() {
  const [users, setUsers] = useState<RegisteredUser[]>([]);
  const [query, setQuery] = useState("");
  useEffect(() => setUsers(readUsers()), []);
  const filtered = useMemo(() => users.filter((user) => `${user.firstName} ${user.lastName} ${user.email}`.toLocaleLowerCase("tr-TR").includes(query.toLocaleLowerCase("tr-TR"))), [query, users]);

  const update = (id: string, changes: Partial<RegisteredUser>) => {
    const next = users.map((user) => user.id === id ? { ...user, ...changes } : user);
    setUsers(next); writeUsers(next);
  };
  const remove = (id: string) => {
    if (!window.confirm("Bu kullanıcıyı listeden silmek istiyor musun?")) return;
    const next = users.filter((user) => user.id !== id); setUsers(next); writeUsers(next);
  };

  return <>
    <div className="admin-user-toolbar"><div className="header-search"><Search size={18}/><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="İsim veya e-posta ile ara"/></div><span className="level-badge">{filtered.length} kullanıcı</span></div>
    <div className="table-wrap"><table className="data-table admin-users-table"><thead><tr><th>Kullanıcı</th><th>Seviye</th><th>Hedef</th><th>Rol</th><th>Durum</th><th>Kayıt tarihi</th><th>İşlem</th></tr></thead><tbody>{filtered.map((user) => <tr key={user.id}><td><strong>{user.firstName} {user.lastName}</strong><span>{user.email}</span></td><td>{user.level}</td><td>{user.targetLevel}</td><td><select value={user.role} onChange={(event) => update(user.id, { role: event.target.value as RegisteredUser["role"] })}><option>Öğrenci</option><option>Eğitmen</option><option>Yönetici</option></select></td><td><span className={`status ${user.status === "Aktif" ? "live" : "draft"}`}>{user.status}</span></td><td>{new Intl.DateTimeFormat("tr-TR", { dateStyle: "medium" }).format(new Date(user.createdAt))}</td><td><div className="row-actions"><button className="icon-button" title={user.status === "Aktif" ? "Hesabı askıya al" : "Hesabı aktifleştir"} onClick={() => update(user.id, { status: user.status === "Aktif" ? "Askıda" : "Aktif" })}>{user.status === "Aktif" ? <ShieldAlert size={17}/> : <UserCheck size={17}/>}</button><button className="icon-button danger-icon" title="Kullanıcıyı sil" onClick={() => remove(user.id)}><Trash2 size={17}/></button></div></td></tr>)}</tbody></table></div>
    <p className="admin-data-note">Bu sürümde kayıtlar tarayıcı depolamasında çalışan demo veri katmanına kaydedilir. Gerçek kullanıcıların farklı cihazlardan ortak admin panelinde görünmesi için PostgreSQL/Auth.js bağlantısı gerekir; proje yapısı buna geçiş için hazırlanmıştır.</p>
  </>;
}
