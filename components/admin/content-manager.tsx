"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Circle, Copy, Eye, GripVertical, Plus, RotateCcw, Save, ShieldCheck, Trash2 } from "lucide-react";
import { courses } from "@/data/courses";
import { getContentQuality } from "@/data/content-quality";
import { exercisesPerUnit } from "@/data/exercises";
import { units as baseUnits } from "@/data/units";
import { useContentStore } from "@/hooks/use-content-store";
import type { ExerciseType } from "@/types/exercise";


const qualityStatusLabels = {
  TASLAK: "Taslak",
  EDITOR_KONTROLUNDE: "Editör kontrolünde",
  DIL_KONTROLU_TAMAMLANDI: "Dil kontrolü tamamlandı",
  YAYINA_HAZIR: "Yayına hazır",
} as const;

const qualityCheckLabels = {
  grammarAndSpelling: "Dil bilgisi ve yazım",
  levelAppropriateness: "Seviyeye uygunluk",
  translationNaturalness: "Türkçe çeviri doğallığı",
  duplicateAndTemplateScan: "Tekrar ve şablon taraması",
  answerConsistency: "Doğru cevap ve açıklama tutarlılığı",
  vocabularyContextScan: "Kelime ve bağlam kontrolü",
} as const;

export function ContentManager({ initialCourseId = "a1", initialUnitId }: { initialCourseId?: string; initialUnitId?: string }) {
  const content = useContentStore();
  const [courseId, setCourseId] = useState(initialCourseId);
  const courseUnits = useMemo(() => baseUnits.filter((unit) => unit.courseId === courseId), [courseId]);
  const [unitId, setUnitId] = useState(initialUnitId ?? courseUnits[0]?.id ?? "a1-u01");
  const unit = content.getUnit(unitId) ?? courseUnits[0];
  const slides = content.getSlides(unit.id);
  const exercises = content.getExercises(unit.id);
  const [message, setMessage] = useState("");
  const quality = getContentQuality(unit.id);

  const selectCourse = (next: string) => { setCourseId(next); const first = baseUnits.find((item) => item.courseId === next); if (first) setUnitId(first.id); };
  const updateSlideTitle = (slideId: string, title: string) => content.setSlides(unit.id, slides.map((slide) => slide.id === slideId ? { ...slide, title } : slide));
  const addSlide = () => { const order = slides.length + 1; content.setSlides(unit.id, [...slides, { id: `${unit.id}-custom-s${Date.now()}`, unitId: unit.id, order, title: `Yeni slayt ${order}`, contentBlocks: [{ id: `block-${Date.now()}`, type: "text", text: "Bu alana ders açıklaması gelecek." }], estimatedMinutes: 3, isRequired: true, completionRule: "NEXT_CLICK", previousSlideId: slides.at(-1)?.id, status: "DRAFT" }]); };
  const duplicateSlide = (slideId: string) => { const original = slides.find((slide) => slide.id === slideId); if (!original) return; content.setSlides(unit.id, [...slides, { ...original, id: `${unit.id}-copy-${Date.now()}`, title: `${original.title} · Kopya`, order: slides.length + 1, status: "DRAFT" }]); };
  const removeSlide = (slideId: string) => content.setSlides(unit.id, slides.filter((slide) => slide.id !== slideId).map((slide, index) => ({ ...slide, order: index + 1 })));
  const addExercise = () => { const order = exercises.length + 1; content.setExercises(unit.id, [...exercises, { id: `${unit.id}-custom-e${Date.now()}`, unitId: unit.id, groupId: `${unit.id}-practice`, order, type: "MULTIPLE_CHOICE", title: `Yeni alıştırma ${order}`, prompt: "Soru metni", options: [{ id: "a", label: "Seçenek A", value: "Seçenek A" }, { id: "b", label: "Seçenek B", value: "Seçenek B" }], correctAnswer: "Seçenek B", explanation: "Geri bildirim metni", isRequired: true, maxAttempts: 2, points: 10 }]); };
  const updateExerciseType = (exerciseId: string, type: ExerciseType) => content.setExercises(unit.id, exercises.map((exercise) => exercise.id === exerciseId ? { ...exercise, type } : exercise));

  return <><div className="section-head"><div><span className="eyebrow">İÇERİK YÖNETİMİ</span><h1 className="section-title">Kurs içerik editörü</h1><p className="section-copy">A1, A2, B1 ve B2 seviyelerinde ünite, slayt, alıştırma ve tamamlama kurallarını yönet.</p></div><div style={{display:"flex",gap:10}}><Link className="button button-secondary" href={`/learn/${courseId}/${unit.id}`}><Eye size={17}/> Ön İzle</Link><button className="button button-primary" onClick={() => setMessage("Değişiklikler tarayıcı depolamasına kaydedildi.")}><Save size={17}/> Kaydet</button></div></div>
    <div className="admin-course-switcher">{courses.map((course) => <button className={course.id === courseId ? "active" : ""} key={course.id} onClick={() => selectCourse(course.id)}><strong>{course.level}</strong><span>{course.unitCount} ünite</span></button>)}</div>
    {message ? <div className="save-message">{message}</div> : null}
    <section className="content-quality-card" aria-label="İçerik kalite kontrolü">
      <div className="content-quality-card__head">
        <div><span className="eyebrow">V27 · İÇERİK KALİTE GÜVENCESİ</span><h2><ShieldCheck size={22}/> {qualityStatusLabels[quality.status]}</h2></div>
        <span className={`content-quality-status content-quality-status--${quality.status.toLowerCase()}`}>{quality.manualLanguageReview ? "Manuel dil kontrolü" : "Otomatik + editör taraması"}</span>
      </div>
      <p>{quality.note}</p>
      <div className="content-quality-checks">{Object.entries(quality.checks).map(([key, value]) => <div key={key} className={value === true ? "is-complete" : value === false ? "is-warning" : "is-pending"}>{value === true ? <CheckCircle2 size={18}/> : <Circle size={18}/>}<span>{qualityCheckLabels[key as keyof typeof qualityCheckLabels]}</span></div>)}</div>
      <small>Son kontrol: {quality.reviewedAt || "Henüz kontrol edilmedi"}</small>
    </section>
    <div className="builder-layout expanded-builder"><aside className="builder-tree"><strong>{courseUnits.length} ünite</strong>{courseUnits.map((item) => <button className={item.id === unit.id ? "active" : ""} key={item.id} onClick={() => setUnitId(item.id)}><GripVertical size={15}/><span>Ünite {item.order}: {content.getUnit(item.id)?.title ?? item.title}</span></button>)}</aside>
      <section className="builder-canvas"><div className="form-grid"><label className="field"><span>Ünite başlığı</span><input value={unit.title} onChange={(event) => content.updateUnit(unit.id, { title: event.target.value })}/></label><label className="field"><span>Açıklama</span><textarea rows={3} value={unit.description} onChange={(event) => content.updateUnit(unit.id, { description: event.target.value })}/></label><div className="form-two"><label className="field"><span>İçerik durumu</span><select value={unit.status} onChange={(event) => content.updateUnit(unit.id, { status: event.target.value as typeof unit.status })}><option>DRAFT</option><option>PUBLISHED</option><option>ARCHIVED</option></select></label><label className="field"><span>Minimum quiz puanı</span><input type="number" value={unit.completionRules.minimumQuizScore} onChange={(event) => content.updateUnit(unit.id, { completionRules: { ...unit.completionRules, minimumQuizScore: Number(event.target.value) } })}/></label></div></div>
        <div className="admin-editor-section"><div className="section-head"><div><h2>Ders slaytları</h2><p>{slides.length} slayt · sürümde varsayılan 15 slayt</p></div><button className="button button-secondary" onClick={addSlide}><Plus size={17}/> Slayt Ekle</button></div><div className="admin-item-list">{slides.map((slide) => <article key={slide.id}><GripVertical size={17}/><input value={slide.title} onChange={(event) => updateSlideTitle(slide.id, event.target.value)}/><select value={slide.status} onChange={(event) => content.setSlides(unit.id, slides.map((item) => item.id === slide.id ? { ...item, status: event.target.value as typeof slide.status } : item))}><option>DRAFT</option><option>REVIEW</option><option>PUBLISHED</option><option>ARCHIVED</option></select><button onClick={() => duplicateSlide(slide.id)} aria-label="Slaytı çoğalt"><Copy size={17}/></button><button onClick={() => removeSlide(slide.id)} aria-label="Slaytı sil"><Trash2 size={17}/></button></article>)}</div></div>
        <div className="admin-editor-section"><div className="section-head"><div><h2>Alıştırmalar</h2><p>{exercises.length} alıştırma · varsayılan {exercisesPerUnit}</p></div><button className="button button-secondary" onClick={addExercise}><Plus size={17}/> Alıştırma Ekle</button></div><div className="admin-item-list">{exercises.map((exercise) => <article key={exercise.id}><GripVertical size={17}/><input value={exercise.title} onChange={(event) => content.setExercises(unit.id, exercises.map((item) => item.id === exercise.id ? { ...item, title: event.target.value } : item))}/><select value={exercise.type} onChange={(event) => updateExerciseType(exercise.id, event.target.value as ExerciseType)}>{["MULTIPLE_CHOICE","MULTIPLE_SELECT","TRUE_FALSE","FILL_IN_THE_BLANK","MATCHING","SENTENCE_ORDERING","TRANSLATION","DIALOGUE_COMPLETION","SHORT_ANSWER","WRITING_ASSIGNMENT"].map((type) => <option key={type}>{type}</option>)}</select><button onClick={() => content.setExercises(unit.id, exercises.filter((item) => item.id !== exercise.id))} aria-label="Alıştırmayı sil"><Trash2 size={17}/></button></article>)}</div></div>
        <button className="button button-secondary" onClick={() => content.resetUnit(unit.id)}><RotateCcw size={17}/> Varsayılan İçeriğe Dön</button>
      </section></div></>;
}
