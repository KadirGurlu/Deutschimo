"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { BookMarked, BrainCircuit, CalendarClock, CheckCircle2, ChevronRight, CircleAlert, Edit3, Headphones, ListChecks, PauseCircle, Plus, RotateCcw, Search, Trash2, Volume2, X } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import type { VerbConjugation, VocabularyRating, VocabularyRecentAttempt, VocabularyRecord, VocabularyReviewCard, VocabularyReviewMode, VocabularyReviewResult, VocabularyStats } from "@/types/vocabulary";

type Tab = "REVIEW" | "NOTEBOOK" | "STATS";
type ReviewPayload = { card: VocabularyReviewCard | null; dueCount: number; nextReviewAt?: string | null; availableModes?: VocabularyReviewMode[] };
type FormState = {
  id?: string; word: string; article: string; plural: string; translation: string; pronunciation: string; wordType: string;
  example: string; exampleTranslation: string; perfectForm: string; governedPreposition: string; sourceUnitTitle: string; notes: string;
  conjugation: Required<VerbConjugation>;
};

const emptyForm: FormState = {
  word: "", article: "", plural: "", translation: "", pronunciation: "", wordType: "", example: "", exampleTranslation: "",
  perfectForm: "", governedPreposition: "", sourceUnitTitle: "", notes: "",
  conjugation: { ich: "", du: "", erSieEs: "", wir: "", ihr: "", sieSie: "" },
};

const modeLabels: Record<"MIXED" | VocabularyReviewMode, string> = {
  MIXED: "Karışık tekrar", DE_TO_TR: "Almanca → Türkçe", TR_TO_DE: "Türkçe → Almanca", AUDIO_TO_WORD: "Ses → Kelime",
  FILL_BLANK: "Boşluk doldurma", ARTICLE: "Artikel seçme", PLURAL: "Çoğul biçimi", SENTENCE: "Cümlede kullanma",
};
const ratingLabels: Record<VocabularyRating, { label: string; note: string }> = {
  FORGOT: { label: "Unuttum", note: "10 dk" }, HARD: { label: "Zor", note: "kısa aralık" }, GOOD: { label: "İyi", note: "normal aralık" }, EASY: { label: "Çok kolay", note: "uzun aralık" },
};

export function VocabularyCenter() {
  const [tab, setTab] = useState<Tab>("REVIEW");
  const [items, setItems] = useState<VocabularyRecord[]>([]);
  const [stats, setStats] = useState<VocabularyStats>({ total:0,due:0,newCount:0,learning:0,mastered:0,averageMastery:0,reviewedToday:0,currentStreak:0 });
  const [recentAttempts, setRecentAttempts] = useState<VocabularyRecentAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState<FormState>(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [reviewMode, setReviewMode] = useState<"MIXED" | VocabularyReviewMode>("MIXED");
  const [review, setReview] = useState<ReviewPayload>({ card:null,dueCount:0 });
  const [answer, setAnswer] = useState("");
  const [reviewResult, setReviewResult] = useState<VocabularyReviewResult | null>(null);
  const [checking, setChecking] = useState(false);
  const [startedAt, setStartedAt] = useState(Date.now());
  const [message, setMessage] = useState("");

  const loadOverview = useCallback(async () => {
    const response = await fetch("/api/skills/vocabulary", { cache: "no-store" });
    if (!response.ok) throw new Error("Kelime verileri yüklenemedi.");
    const data = await response.json() as { items: VocabularyRecord[]; stats: VocabularyStats; recentAttempts: VocabularyRecentAttempt[] };
    setItems(data.items); setStats(data.stats); setRecentAttempts(data.recentAttempts);
  }, []);

  const loadReview = useCallback(async () => {
    const response = await fetch(`/api/vocabulary/review?mode=${encodeURIComponent(reviewMode)}`, { cache: "no-store" });
    if (!response.ok) throw new Error("Tekrar kuyruğu yüklenemedi.");
    setReview(await response.json() as ReviewPayload);
    setAnswer(""); setReviewResult(null); setStartedAt(Date.now());
  }, [reviewMode]);

  useEffect(() => { Promise.all([loadOverview(), loadReview()]).catch((error)=>setMessage(error instanceof Error?error.message:"Bir hata oluştu.")).finally(()=>setLoading(false)); }, [loadOverview, loadReview]);

  const filteredItems = useMemo(() => {
    const needle = search.trim().toLocaleLowerCase("tr-TR");
    if (!needle) return items;
    return items.filter((item) => [item.word,item.translation,item.article,item.plural,item.sourceUnitTitle,item.wordType].some((value)=>value?.toLocaleLowerCase("tr-TR").includes(needle)));
  }, [items, search]);

  function speak(text?: string | null) {
    if (!text || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel(); const utterance = new SpeechSynthesisUtterance(text); utterance.lang = "de-DE"; utterance.rate = .84; window.speechSynthesis.speak(utterance);
  }

  async function checkAnswer() {
    if (!review.card || (!answer.trim() && !review.card.selfAssessment)) return;
    setChecking(true); setMessage("");
    try {
      const response = await fetch("/api/vocabulary/review", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ action:"CHECK", itemId:review.card.itemId, mode:review.card.mode, answer }) });
      const data = await response.json() as { result?: VocabularyReviewResult; error?: string };
      if (!response.ok || !data.result) throw new Error(data.error || "Cevap kontrol edilemedi.");
      setReviewResult(data.result);
    } catch (error) { setMessage(error instanceof Error ? error.message : "Cevap kontrol edilemedi."); }
    finally { setChecking(false); }
  }

  async function rateAnswer(rating: VocabularyRating) {
    if (!review.card || !reviewResult) return;
    setChecking(true); setMessage("");
    try {
      const response = await fetch("/api/vocabulary/review", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ action:"RATE", itemId:review.card.itemId, mode:review.card.mode, answer, rating, responseMs:Date.now()-startedAt }) });
      const data = await response.json() as { error?: string };
      if (!response.ok) throw new Error(data.error || "Tekrar sonucu kaydedilemedi.");
      await Promise.all([loadReview(), loadOverview()]);
    } catch (error) { setMessage(error instanceof Error ? error.message : "Tekrar sonucu kaydedilemedi."); }
    finally { setChecking(false); }
  }

  function editItem(item: VocabularyRecord) {
    const conjugation = item.verbConjugation ?? {};
    setForm({ id:item.id, word:item.word, article:item.article??"", plural:item.plural??"", translation:item.translation, pronunciation:item.pronunciation??"", wordType:item.wordType??"", example:item.example??"", exampleTranslation:item.exampleTranslation??"", perfectForm:item.perfectForm??"", governedPreposition:item.governedPreposition??"", sourceUnitTitle:item.sourceUnitTitle??"", notes:item.notes??"", conjugation:{ ich:conjugation.ich??"",du:conjugation.du??"",erSieEs:conjugation.erSieEs??"",wir:conjugation.wir??"",ihr:conjugation.ihr??"",sieSie:conjugation.sieSie??"" } });
    setShowForm(true); window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function saveItem(event: React.FormEvent) {
    event.preventDefault(); setSaving(true); setMessage("");
    try {
      const response = await fetch("/api/skills/vocabulary", { method:form.id?"PATCH":"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ ...form, verbConjugation:form.conjugation, sourceSkill:form.id?undefined:"MANUAL" }) });
      const data = await response.json() as { error?: string };
      if (!response.ok) throw new Error(data.error || "Kelime kaydedilemedi.");
      setForm(emptyForm); setShowForm(false); await Promise.all([loadOverview(), loadReview()]);
    } catch (error) { setMessage(error instanceof Error?error.message:"Kelime kaydedilemedi."); }
    finally { setSaving(false); }
  }

  async function removeItem(id: string) {
    if (!window.confirm("Bu kelimeyi ve tekrar geçmişini kalıcı olarak silmek istiyor musun?")) return;
    const response = await fetch(`/api/skills/vocabulary?id=${encodeURIComponent(id)}`, { method:"DELETE" });
    if (response.ok) await Promise.all([loadOverview(), loadReview()]);
  }

  async function toggleSuspended(item: VocabularyRecord) {
    const response = await fetch("/api/skills/vocabulary", { method:"PATCH", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ ...item, id:item.id, verbConjugation:item.verbConjugation, suspended:!item.suspended }) });
    if (response.ok) await Promise.all([loadOverview(), loadReview()]);
  }

  return <div className="vocab-v14">
    <header className="vocab-hero"><div><span className="eyebrow">V14 · GELİŞMİŞ KELİME ÖĞRENME</span><h1>Kelimeyi yalnızca görme, kalıcı olarak öğren.</h1><p>Artikel, çoğul, fiil çekimi, Perfekt biçimi ve kullanım bağlamını aralıklı tekrar sistemiyle birlikte çalış.</p></div><BrainCircuit size={54}/></header>
    <div className="vocab-stat-grid"><Stat icon={<CalendarClock/>} label="Bugün bekleyen" value={stats.due}/><Stat icon={<BookMarked/>} label="Toplam kelime" value={stats.total}/><Stat icon={<CheckCircle2/>} label="Ustalaşılan" value={stats.mastered}/><Stat icon={<RotateCcw/>} label="Bugünkü tekrar" value={stats.reviewedToday}/></div>
    <nav className="vocab-tabs"><button className={tab==="REVIEW"?"active":""} onClick={()=>setTab("REVIEW")}><BrainCircuit/>Akıllı tekrar</button><button className={tab==="NOTEBOOK"?"active":""} onClick={()=>setTab("NOTEBOOK")}><BookMarked/>Kelime defteri</button><button className={tab==="STATS"?"active":""} onClick={()=>setTab("STATS")}><ListChecks/>İstatistikler</button></nav>
    {message?<div className="vocab-message"><CircleAlert size={18}/>{message}<button onClick={()=>setMessage("")}><X size={16}/></button></div>:null}
    {loading?<section className="panel">Kelime sistemi hazırlanıyor...</section>:null}
    {!loading&&tab==="REVIEW"?<ReviewPanel review={review} mode={reviewMode} setMode={setReviewMode} answer={answer} setAnswer={setAnswer} result={reviewResult} checking={checking} onCheck={checkAnswer} onRate={rateAnswer} onSpeak={speak}/>:null}
    {!loading&&tab==="NOTEBOOK"?<section className="vocab-notebook">
      <div className="section-head"><div><h2>Kelime defteri</h2><p>Eksik bilgileri tamamla; sistem kullanılabilir tekrar türlerini otomatik artırır.</p></div><button className="button button-primary" onClick={()=>{setForm(emptyForm);setShowForm(!showForm);}}><Plus size={17}/>Yeni kelime</button></div>
      {showForm?<VocabularyForm form={form} setForm={setForm} saving={saving} onSubmit={saveItem} onCancel={()=>{setShowForm(false);setForm(emptyForm);}}/>:null}
      <label className="vocab-search"><Search size={18}/><input value={search} onChange={(event)=>setSearch(event.target.value)} placeholder="Kelime, anlam, artikel veya ünite ara"/></label>
      <div className="vocab-item-list">{filteredItems.map((item)=><VocabularyItemCard key={item.id} item={item} onSpeak={speak} onEdit={editItem} onDelete={removeItem} onSuspend={toggleSuspended}/>)}</div>
      {!filteredItems.length?<div className="panel intelligence-empty"><BookMarked/><div><h2>Kelime bulunamadı</h2><p>Yeni kelime ekleyebilir veya arama ifadesini değiştirebilirsin.</p></div></div>:null}
    </section>:null}
    {!loading&&tab==="STATS"?<StatsPanel stats={stats} items={items} attempts={recentAttempts}/>:null}
  </div>;
}

function ReviewPanel({ review,mode,setMode,answer,setAnswer,result,checking,onCheck,onRate,onSpeak }:{ review:ReviewPayload;mode:"MIXED"|VocabularyReviewMode;setMode:(value:"MIXED"|VocabularyReviewMode)=>void;answer:string;setAnswer:(value:string)=>void;result:VocabularyReviewResult|null;checking:boolean;onCheck:()=>void;onRate:(rating:VocabularyRating)=>void;onSpeak:(text?:string|null)=>void }) {
  const card=review.card;
  return <section className="vocab-review-layout"><aside className="panel vocab-review-side"><span className="eyebrow">TEKRAR KUYRUĞU</span><strong>{review.dueCount}</strong><p>şu anda çalışılacak kelime</p><label>Görev türü<select value={mode} onChange={(event)=>setMode(event.target.value as "MIXED"|VocabularyReviewMode)}>{Object.entries(modeLabels).map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label><small>Yanıtına göre bir sonraki tekrar tarihi otomatik belirlenir.</small></aside>
    <div className="vocab-review-card">{card?<><div className="vocab-review-meta"><span>{modeLabels[card.mode]}</span><span>Ustalık %{card.mastery}</span></div><Progress value={card.mastery} label={`${card.reviewCount} tekrar · ${card.lapseCount} unutma`}/><h2>{card.prompt}</h2>{card.mode==="AUDIO_TO_WORD"?<button className="audio-review-button" onClick={()=>onSpeak(card.audioText)}><Headphones/>Kelimeyi dinle</button>:null}{card.options?<div className="article-options">{card.options.map((option)=><button key={option} className={answer===option?"selected":""} onClick={()=>setAnswer(option)}>{option}</button>)}</div>:<textarea value={answer} onChange={(event)=>setAnswer(event.target.value)} placeholder={card.selfAssessment?"Almanca cümleni yaz...":"Cevabını yaz..."} disabled={Boolean(result)}/>} {!result?<button className="button button-primary review-check" disabled={checking||!answer.trim()} onClick={onCheck}>{checking?"Kontrol ediliyor...":"Cevabı kontrol et"}<ChevronRight size={17}/></button>:<><div className={`vocab-answer-result ${result.correct?"correct":"wrong"}`}><strong>{result.correct?"Cevap kaydedildi":"Tekrar kontrol et"}</strong><p>{result.explanation}</p>{result.modelSentence?<p><b>Model cümle:</b> {result.modelSentence}</p>:null}</div><div className="rating-grid">{(Object.keys(ratingLabels) as VocabularyRating[]).map((rating)=><button key={rating} disabled={checking} onClick={()=>onRate(rating)}><strong>{ratingLabels[rating].label}</strong><span>{ratingLabels[rating].note}</span></button>)}</div></>}</>:<div className="review-empty"><CheckCircle2 size={46}/><h2>Bugünkü tekrarlar tamamlandı</h2><p>{review.nextReviewAt?`Sıradaki tekrar ${new Date(review.nextReviewAt).toLocaleString("tr-TR")} tarihinde.`:"Defterine yeni kelimeler ekleyerek tekrar kuyruğu oluşturabilirsin."}</p></div>}</div>
  </section>;
}

function VocabularyForm({form,setForm,saving,onSubmit,onCancel}:{form:FormState;setForm:React.Dispatch<React.SetStateAction<FormState>>;saving:boolean;onSubmit:(event:React.FormEvent)=>void;onCancel:()=>void}) {
  const field=(key:keyof Omit<FormState,"conjugation"|"id">,label:string,placeholder="")=><label>{label}<input value={String(form[key]??"")} onChange={(event)=>setForm((current)=>({...current,[key]:event.target.value}))} placeholder={placeholder}/></label>;
  return <form className="vocab-form panel" onSubmit={onSubmit}><div className="section-head"><h2>{form.id?"Kelimeyi düzenle":"Yeni kelime ekle"}</h2><button type="button" onClick={onCancel}><X/></button></div><div className="vocab-form-grid">{field("word","Almanca kelime *","ör. arbeiten")}{field("article","Artikel","der / die / das")}{field("plural","Çoğul","die ...")}{field("translation","Türkçe anlam *")}{field("pronunciation","Telaffuz notu","isteğe bağlı")}{field("wordType","Kelime türü","isim, fiil, sıfat...")}{field("perfectForm","Perfekt biçimi","hat gearbeitet")}{field("governedPreposition","Kullanıldığı edat","sich interessieren für + Akk.")}{field("sourceUnitTitle","Öğrenildiği ünite","A1 · İş ve Meslekler")}</div><label>Almanca örnek cümle<textarea value={form.example} onChange={(event)=>setForm((current)=>({...current,example:event.target.value}))}/></label><label>Türkçe örnek çevirisi<textarea value={form.exampleTranslation} onChange={(event)=>setForm((current)=>({...current,exampleTranslation:event.target.value}))}/></label><fieldset><legend>Fiil çekimi</legend><div className="conjugation-grid">{([['ich','ich'],['du','du'],['erSieEs','er/sie/es'],['wir','wir'],['ihr','ihr'],['sieSie','sie/Sie']] as const).map(([key,label])=><label key={key}>{label}<input value={form.conjugation[key]} onChange={(event)=>setForm((current)=>({...current,conjugation:{...current.conjugation,[key]:event.target.value}}))}/></label>)}</div></fieldset><label>Öğrenci notu<textarea value={form.notes} onChange={(event)=>setForm((current)=>({...current,notes:event.target.value}))}/></label><div className="lab-actions end"><button type="button" className="button button-secondary" onClick={onCancel}>Vazgeç</button><button className="button button-primary" disabled={saving||!form.word.trim()||!form.translation.trim()}>{saving?"Kaydediliyor...":"Kelimeyi kaydet"}</button></div></form>;
}

function VocabularyItemCard({item,onSpeak,onEdit,onDelete,onSuspend}:{item:VocabularyRecord;onSpeak:(text?:string|null)=>void;onEdit:(item:VocabularyRecord)=>void;onDelete:(id:string)=>void;onSuspend:(item:VocabularyRecord)=>void}) {
  const conjugation=item.verbConjugation;
  return <article className={`vocab-detail-card ${item.suspended?"suspended":""}`}><div className="vocab-card-head"><div><span>{item.wordType||"Kelime"}</span><h3>{item.article?`${item.article} `:""}{item.word}</h3><p>{item.translation}</p></div><div className="vocab-card-actions"><button onClick={()=>onSpeak(`${item.article??""} ${item.word}. ${item.example??""}`)} title="Dinle"><Volume2/></button><button onClick={()=>onEdit(item)} title="Düzenle"><Edit3/></button><button onClick={()=>onSuspend(item)} title={item.suspended?"Tekrara al":"Tekrarı duraklat"}><PauseCircle/></button><button onClick={()=>onDelete(item.id)} title="Sil"><Trash2/></button></div></div><Progress value={item.mastery} label={`Ustalık %${item.mastery} · sonraki tekrar ${new Date(item.nextReviewAt).toLocaleDateString("tr-TR")}`}/><div className="vocab-detail-grid"><Detail label="Çoğul" value={item.plural}/><Detail label="Perfekt" value={item.perfectForm}/><Detail label="Edat / yapı" value={item.governedPreposition}/><Detail label="Kaynak ünite" value={item.sourceUnitTitle}/></div>{conjugation&&Object.values(conjugation).some(Boolean)?<div className="conjugation-table">{Object.entries(conjugation).filter(([,value])=>value).map(([key,value])=><span key={key}><small>{key.replace("erSieEs","er/sie/es").replace("sieSie","sie/Sie")}</small><strong>{value}</strong></span>)}</div>:null}{item.example?<blockquote><strong>{item.example}</strong>{item.exampleTranslation?<span>{item.exampleTranslation}</span>:null}</blockquote>:null}<div className="vocab-history-line"><span>{item.reviewCount} tekrar</span><span>{item.correctStreak} doğru seri</span><span>{item.lapseCount} unutma</span><span>{item.intervalDays?`${item.intervalDays} gün aralık`:"Yeni kelime"}</span></div>{item.notes?<p className="vocab-note">{item.notes}</p>:null}</article>;
}

function StatsPanel({stats,items,attempts}:{stats:VocabularyStats;items:VocabularyRecord[];attempts:VocabularyRecentAttempt[]}) {
  const buckets=[{label:"Yeni",value:stats.newCount},{label:"Öğreniliyor",value:stats.learning},{label:"Ustalaşıldı",value:stats.mastered}];
  const articleCounts=["der","die","das"].map((article)=>({article,count:items.filter((item)=>item.article===article).length}));
  return <section className="vocab-stats"><div className="panel"><div className="section-head"><div><h2>Öğrenme durumu</h2><p>Kelime havuzunun güncel dağılımı.</p></div><strong className="metric">%{stats.averageMastery}</strong></div>{buckets.map((bucket)=><div className="stats-row" key={bucket.label}><span>{bucket.label}</span><Progress value={stats.total?Math.round(bucket.value/stats.total*100):0} label={`${bucket.value} kelime`}/></div>)}</div><div className="panel"><h2>Artikel dağılımı</h2><div className="article-stat-grid">{articleCounts.map((entry)=><article key={entry.article}><strong>{entry.article}</strong><span>{entry.count}</span></article>)}</div><p className="muted-copy">Artikeli olmayan veya henüz tamamlanmamış {items.filter((item)=>!["der","die","das"].includes(item.article??"")).length} kayıt bulunuyor.</p></div><div className="panel vocab-attempt-history"><h2>Son tekrarlar</h2>{attempts.length?attempts.map((attempt)=><article key={attempt.id}><div><strong>{attempt.word}</strong><span>{modeLabels[attempt.mode]}</span></div><div><b className={attempt.correct?"ok":"bad"}>{attempt.correct?"Doğru":"Yanlış"}</b><span>{ratingLabels[attempt.rating].label}</span><time>{new Date(attempt.createdAt).toLocaleString("tr-TR")}</time></div></article>):<p>Henüz tekrar geçmişi yok.</p>}</div></section>;
}

function Stat({icon,label,value}:{icon:React.ReactNode;label:string;value:number}){return <article><span>{icon}</span><div><small>{label}</small><strong>{value}</strong></div></article>}
function Detail({label,value}:{label:string;value?:string|null}){return <div><small>{label}</small><strong>{value||"—"}</strong></div>}
