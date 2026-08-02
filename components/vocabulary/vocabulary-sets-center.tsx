"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { BookOpenCheck, ChevronRight, Clock3, FolderOpen, GraduationCap, Layers3, LibraryBig, Plus, RotateCcw, Search, Sparkles, Trash2, X } from "lucide-react";
import type { CuratedVocabularySetSummary, VocabularySetEntryInput, VocabularySetSummary } from "@/types/vocabulary";

type OverviewPayload = {
  sets: VocabularySetSummary[];
  legacyCount: number;
  curated: CuratedVocabularySetSummary[];
};

type DraftEntry = Required<Pick<VocabularySetEntryInput, "word" | "translation">> & {
  article: string;
  plural: string;
  example: string;
  exampleTranslation: string;
};

const emptyEntry = (): DraftEntry => ({ word: "", article: "", plural: "", translation: "", example: "", exampleTranslation: "" });
const levels = ["A1", "A2", "B1", "B2"] as const;

export function VocabularySetsCenter() {
  const router = useRouter();
  const [data, setData] = useState<OverviewPayload>({ sets: [], legacyCount: 0, curated: [] });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");
  const [level, setLevel] = useState<(typeof levels)[number]>("A1");
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [formLevel, setFormLevel] = useState("");
  const [entries, setEntries] = useState<DraftEntry[]>([emptyEntry(), emptyEntry(), emptyEntry()]);
  const [saving, setSaving] = useState(false);
  const [busySlug, setBusySlug] = useState("");

  const load = useCallback(async () => {
    const response = await fetch("/api/vocabulary/sets", { cache: "no-store" });
    const payload = await response.json() as OverviewPayload & { error?: string };
    if (!response.ok) throw new Error(payload.error || "Kelime setleri yüklenemedi.");
    setData(payload);
  }, []);

  useEffect(() => {
    load().catch((error) => setMessage(error instanceof Error ? error.message : "Kelime setleri yüklenemedi.")).finally(() => setLoading(false));
  }, [load]);

  const curated = useMemo(() => {
    const needle = search.trim().toLocaleLowerCase("tr-TR");
    return data.curated.filter((set) => set.level === level && (!needle || [set.title, set.unitTitle, set.description].some((value) => value.toLocaleLowerCase("tr-TR").includes(needle))));
  }, [data.curated, level, search]);

  const ownWordCount = data.sets.reduce((sum, set) => sum + set.itemCount, 0) + data.legacyCount;

  function updateEntry(index: number, key: keyof DraftEntry, value: string) {
    setEntries((current) => current.map((entry, entryIndex) => entryIndex === index ? { ...entry, [key]: value } : entry));
  }

  function resetForm() {
    setTitle(""); setDescription(""); setFormLevel(""); setEntries([emptyEntry(), emptyEntry(), emptyEntry()]); setShowCreate(false);
  }

  async function createSet(event: React.FormEvent) {
    event.preventDefault();
    const cleanEntries = entries.filter((entry) => entry.word.trim() || entry.translation.trim());
    if (!title.trim()) return setMessage("Kelime setinin adını yazmalısın.");
    if (!cleanEntries.length || cleanEntries.some((entry) => !entry.word.trim() || !entry.translation.trim())) return setMessage("Eklediğin her satırda Almanca kelime ve Türkçe anlam bulunmalı.");
    setSaving(true); setMessage("");
    try {
      const response = await fetch("/api/vocabulary/sets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "CREATE_SET", title, description, level: formLevel || null, entries: cleanEntries }),
      });
      const payload = await response.json() as { set?: VocabularySetSummary; error?: string };
      if (!response.ok || !payload.set) throw new Error(payload.error || "Kelime seti oluşturulamadı.");
      resetForm();
      router.push(`/vocabulary/set/${payload.set.id}`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Kelime seti oluşturulamadı.");
    } finally { setSaving(false); }
  }

  async function openCurated(set: CuratedVocabularySetSummary) {
    if (set.importedSetId) return router.push(`/vocabulary/set/${set.importedSetId}`);
    setBusySlug(set.slug); setMessage("");
    try {
      const response = await fetch("/api/vocabulary/sets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "IMPORT_CURATED", slug: set.slug }),
      });
      const payload = await response.json() as { set?: VocabularySetSummary; error?: string };
      if (!response.ok || !payload.set) throw new Error(payload.error || "Hazır set açılamadı.");
      router.push(`/vocabulary/set/${payload.set.id}`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Hazır set açılamadı.");
    } finally { setBusySlug(""); }
  }

  async function deleteSet(id: string, name: string) {
    if (!window.confirm(`“${name}” kelime setini ve içindeki kelimeleri silmek istiyor musun?`)) return;
    const response = await fetch(`/api/vocabulary/sets?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    if (response.ok) await load();
    else setMessage("Kelime seti silinemedi.");
  }

  return <div className="v21-sets-page">
    <header className="v21-sets-hero">
      <div>
        <span className="eyebrow">V21 · KELİME SETLERİ</span>
        <h1>Kelime Setlerim</h1>
        <p>Kendi setini oluştur, geçmiş setlerine dön veya A1–B2 üniteleri için hazırlanmış kelime kartlarıyla çalış.</p>
      </div>
      <div className="v21-hero-actions">
        <Link className="button button-secondary" href="/vocabulary/review"><RotateCcw size={18}/>Akıllı tekrar</Link>
        <button className="button button-primary" onClick={() => setShowCreate(true)}><Plus size={18}/>Kelime seti oluştur</button>
      </div>
    </header>

    <div className="v21-set-stats">
      <Stat icon={<FolderOpen/>} label="Kendi setlerin" value={data.sets.length + (data.legacyCount ? 1 : 0)}/>
      <Stat icon={<BookOpenCheck/>} label="Kaydedilen kelime" value={ownWordCount}/>
      <Stat icon={<LibraryBig/>} label="Hazır set" value={data.curated.length}/>
    </div>

    {message ? <div className="vocab-message">{message}<button onClick={() => setMessage("")}><X size={16}/></button></div> : null}

    {showCreate ? <form className="panel v21-set-builder" onSubmit={createSet}>
      <div className="section-head">
        <div><span className="eyebrow">YENİ SET</span><h2>Kendi kelime setini oluştur</h2><p>Quizlet mantığında set adını yaz ve kelimelerini satır satır ekle.</p></div>
        <button type="button" className="icon-button" onClick={resetForm}><X/></button>
      </div>
      <div className="v21-set-meta-form">
        <label>Set adı *<input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="ör. B1 Meslekler ve İş Hayatı"/></label>
        <label>Seviye<select value={formLevel} onChange={(event) => setFormLevel(event.target.value)}><option value="">Seviye seçme</option>{levels.map((item) => <option value={item} key={item}>{item}</option>)}</select></label>
        <label className="wide">Kısa açıklama<textarea value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Bu sette hangi kelimeler var?"/></label>
      </div>
      <div className="v21-entry-head"><strong>Terimler</strong><span>Almanca kelime, Türkçe anlam ve cümle içi kullanım</span></div>
      <div className="v21-entry-list">
        {entries.map((entry, index) => <article className="v21-entry-row" key={index}>
          <span className="v21-entry-number">{index + 1}</span>
          <label>Artikel<select value={entry.article} onChange={(event) => updateEntry(index, "article", event.target.value)}><option value="">—</option><option>der</option><option>die</option><option>das</option></select></label>
          <label>Almanca kelime *<input value={entry.word} onChange={(event) => updateEntry(index, "word", event.target.value)} placeholder="Name"/></label>
          <label>Türkçe anlam *<input value={entry.translation} onChange={(event) => updateEntry(index, "translation", event.target.value)} placeholder="isim"/></label>
          <label>Çoğul<input value={entry.plural} onChange={(event) => updateEntry(index, "plural", event.target.value)} placeholder="die Namen"/></label>
          <label className="example">Almanca örnek cümle<input value={entry.example} onChange={(event) => updateEntry(index, "example", event.target.value)} placeholder="Mein Name ist Lena."/></label>
          <label className="example">Türkçe cümle<input value={entry.exampleTranslation} onChange={(event) => updateEntry(index, "exampleTranslation", event.target.value)} placeholder="Benim adım Lena."/></label>
          <button type="button" className="v21-remove-entry" title="Satırı kaldır" disabled={entries.length === 1} onClick={() => setEntries((current) => current.filter((_, entryIndex) => entryIndex !== index))}><Trash2 size={18}/></button>
        </article>)}
      </div>
      <div className="v21-builder-actions">
        <button type="button" className="button button-secondary" onClick={() => setEntries((current) => [...current, emptyEntry()])}><Plus size={17}/>Terim ekle</button>
        <div><button type="button" className="button button-secondary" onClick={resetForm}>Vazgeç</button><button className="button button-primary" disabled={saving}>{saving ? "Set oluşturuluyor..." : "Seti kaydet"}</button></div>
      </div>
    </form> : null}

    <section className="v21-own-sets">
      <div className="section-head"><div><span className="eyebrow">KÜTÜPHANEN</span><h2>Geçmiş kelime setleri</h2><p>Oluşturduğun ve daha önce çalıştığın setlere buradan devam et.</p></div></div>
      {loading ? <div className="panel">Kelime setleri hazırlanıyor...</div> : <div className="v21-set-grid">
        {data.sets.map((set) => <article className="v21-set-card" key={set.id}>
          <Link href={`/vocabulary/set/${set.id}`} className="v21-set-card-link">
            <div className="v21-set-card-top"><span className={`v21-level-pill ${set.level?.toLowerCase() || "personal"}`}>{set.level || "Kişisel"}</span><small>{set.itemCount} terim</small></div>
            <h3>{set.title}</h3>
            <p>{set.description || set.unitTitle || "Kendi oluşturduğun kelime seti."}</p>
            <footer><span><Clock3 size={15}/>{set.lastStudiedAt ? `Son çalışma ${new Date(set.lastStudiedAt).toLocaleDateString("tr-TR")}` : "Henüz çalışılmadı"}</span><ChevronRight/></footer>
          </Link>
          <button className="v21-delete-set" title="Seti sil" onClick={() => deleteSet(set.id, set.title)}><Trash2 size={17}/></button>
        </article>)}
        {data.legacyCount ? <article className="v21-set-card legacy"><Link href="/vocabulary/set/legacy" className="v21-set-card-link"><div className="v21-set-card-top"><span className="v21-level-pill personal">Önceki kayıtlar</span><small>{data.legacyCount} terim</small></div><h3>Önceki kelime defterim</h3><p>Beceri laboratuvarlarından ve eski kelime ekranından eklediğin kelimeler.</p><footer><span><Layers3 size={15}/>V14 kayıtları korunuyor</span><ChevronRight/></footer></Link></article> : null}
      </div>}
      {!loading && !data.sets.length && !data.legacyCount ? <div className="panel v21-empty-set"><FolderOpen/><div><h3>Henüz kişisel setin yok</h3><p>İlk setini oluşturabilir veya aşağıdaki hazır setlerden birini çalışmaya başlayabilirsin.</p></div><button className="button button-primary" onClick={() => setShowCreate(true)}><Plus/>Set oluştur</button></div> : null}
    </section>

    <section className="v21-curated-sets">
      <div className="section-head"><div><span className="eyebrow">DEUTSCHIMO HAZIR SETLERİ</span><h2>A1’den B2’ye ünite kelimeleri</h2><p>Her sette ortalama 30–40 kelime, kalıp ifade ve cümle içi kullanım bulunur.</p></div></div>
      <div className="v21-library-toolbar">
        <div className="v21-level-tabs">{levels.map((item) => <button key={item} className={level === item ? "active" : ""} onClick={() => setLevel(item)}>{item}</button>)}</div>
        <label className="v21-set-search"><Search size={18}/><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Hazır setlerde ara"/></label>
      </div>
      <div className="v21-curated-grid">{curated.map((set) => <article className="v21-curated-card" key={set.slug}>
        <div className="v21-curated-order"><span>{set.level}</span><strong>{String(set.unitOrder).padStart(2, "0")}</strong></div>
        <div><small>{set.itemCount} terim</small><h3>{set.unitTitle}</h3><p>{set.description}</p></div>
        <button className="button button-secondary" disabled={busySlug === set.slug} onClick={() => openCurated(set)}>{busySlug === set.slug ? "Hazırlanıyor..." : set.importedSetId ? "Çalışmaya devam et" : "Seti aç"}<ChevronRight size={17}/></button>
      </article>)}</div>
      {!curated.length ? <div className="panel v21-empty-set"><Search/><div><h3>Aramana uygun set bulunamadı</h3><p>Arama ifadesini değiştirerek tekrar dene.</p></div></div> : null}
    </section>
  </div>;
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return <article><span>{icon}</span><div><small>{label}</small><strong>{value}</strong></div></article>;
}
