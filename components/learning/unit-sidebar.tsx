"use client";

import Link from "next/link";
import { CheckCircle2, ChevronLeft, Lock, Menu, X } from "lucide-react";
import { useState } from "react";
import { Progress } from "@/components/ui/progress";
import type { Course, Unit } from "@/types/course";
import type { LearningStatus } from "@/types/learning";

export function UnitSidebar({ course, units, currentUnitId, coursePercent, getStatus }: { course: Course; units: Unit[]; currentUnitId: string; coursePercent: number; getStatus: (unitId: string) => LearningStatus }) {
  const [open, setOpen] = useState(false);
  return <>
    <button className="unit-drawer-toggle" onClick={() => setOpen(true)} aria-label="Ünite listesini aç"><Menu size={20}/> Üniteler</button>
    <aside className={`unit-sidebar ${open ? "open" : ""}`}>
      <button className="unit-drawer-close" onClick={() => setOpen(false)} aria-label="Ünite listesini kapat"><X size={20}/></button>
      <Link className="back-program" href={`/courses/${course.slug}`}><ChevronLeft size={17}/> Programa dön</Link>
      <div className="unit-sidebar-course"><span className="level-badge">{course.level}</span><h2>{course.title}</h2><Progress value={coursePercent} label={`%${coursePercent} tamamlandı`}/></div>
      <nav aria-label="Kurs üniteleri">{units.map((unit) => {
        const status = getStatus(unit.id);
        return <Link aria-disabled={status === "LOCKED"} onClick={(event) => { if (status === "LOCKED") event.preventDefault(); else setOpen(false); }} className={`unit-sidebar-link ${unit.id === currentUnitId ? "active" : ""} ${status === "LOCKED" ? "locked" : ""}`} href={`/learn/${course.id}/${unit.id}`} key={unit.id}>
          <span>{status === "COMPLETED" ? <CheckCircle2 size={17}/> : status === "LOCKED" ? <Lock size={16}/> : unit.order}</span><div><strong>{unit.title}</strong><small>{status === "COMPLETED" ? "Tamamlandı" : status === "IN_PROGRESS" ? "Devam ediyor" : status === "LOCKED" ? "Kilitli" : "Başlanmadı"}</small></div>
        </Link>;
      })}</nav>
    </aside>
    {open ? <button className="drawer-backdrop" onClick={() => setOpen(false)} aria-label="Menüyü kapat"/> : null}
  </>;
}
