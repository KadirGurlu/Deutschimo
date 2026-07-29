"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Activity, BookOpenText, CheckCircle2, Dumbbell, Users } from "lucide-react";
import { courses } from "@/data/courses";
import { totalExerciseCounts } from "@/data/exercises";
import { unitCounts } from "@/data/units";
import { readUsers } from "@/lib/client-storage";
import { readLearningState } from "@/lib/storage/learning-storage";

export function AdminOverview() {
  const [userCount, setUserCount] = useState(0);
  const [completed, setCompleted] = useState(0);
  useEffect(() => { setUserCount(readUsers().length); setCompleted(Object.values(readLearningState().unitProgress).filter((progress) => progress.status === "COMPLETED").length); }, []);
  const totalUnits = Object.values(unitCounts).reduce((sum, count) => sum + count, 0);
  const totalExercises = Object.values(totalExerciseCounts).reduce((sum, count) => sum + count, 0);
  return <><div className="stats-grid"><AdminStat icon={<Users/>} label="Kayıtlı kullanıcı" value={String(userCount)} note="Demo + tarayıcı kayıtları"/><AdminStat icon={<BookOpenText/>} label="Yayındaki seviye" value="4" note="A1, A2, B1 ve B2"/><AdminStat icon={<Activity/>} label="Toplam ünite" value={String(totalUnits)} note="12 + 16 + 18 + 20"/><AdminStat icon={<Dumbbell/>} label="Toplam alıştırma" value={String(totalExercises)} note="Her ünitede 8 alıştırma"/><AdminStat icon={<CheckCircle2/>} label="Tamamlanan ünite" value={String(completed)} note="Bu tarayıcıdaki ilerleme"/></div>
    <div className="admin-overview-grid"><section className="panel"><div className="section-head"><div><h2>İçerik sistemi</h2><p>Slaytlar, alıştırmalar, quiz ve ünite tamamlama kuralları bütün seviyelerde aynı altyapıyı kullanır.</p></div><Link className="button button-primary" href="/admin/content">İçerikleri Yönet</Link></div><div className="admin-level-list">{courses.map((course) => <div key={course.id}><span className="level-badge">{course.level}</span><strong>{course.unitCount} ünite</strong><span>{totalExerciseCounts[course.level]} alıştırma · {course.unitCount} ünite testi</span></div>)}</div></section><section className="panel"><h2>Hızlı işlemler</h2><div className="quick-admin-actions"><Link href="/admin/users"><Users/>Kayıtlı kullanıcıları gör</Link><Link href="/admin/content"><BookOpenText/>Ünite ve slaytları düzenle</Link><Link href="/courses"><Activity/>Öğrenci görünümünü aç</Link></div></section></div></>;
}
function AdminStat({ icon, label, value, note }: { icon: React.ReactNode; label: string; value: string; note: string }) { return <article className="stat-card"><div style={{display:"flex",justifyContent:"space-between",color:"var(--turquoise-dark)"}}><span>{label}</span>{icon}</div><strong>{value}</strong><span>{note}</span></article>; }
