"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Check, ChevronLeft, ChevronRight, Layers3, List, RotateCcw, Shuffle, Volume2 } from "lucide-react";
import type { VocabularyRecord, VocabularySetDetail } from "@/types/vocabulary";

export function VocabularySetStudy({ setId }: { setId: string }) {
  const [set, setSet] = useState<VocabularySetDetail | null>(null);
  const [items, setItems] = useState<VocabularyRecord[]>([]);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [showList, setShowList] = useState(false);
  const [known, setKnown] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    const response = await fetch(`/api/vocabulary/sets/${encodeURIComponent(setId)}`, { cache: "no-store" });
    const payload = await response.json() as { set?: VocabularySetDetail; error?: string };
    if (!response.ok || !payload.set) throw new Error(payload.error || "Kelime seti yüklenemedi.");
    setSet(payload.set);
    setItems(payload.set.items);
    if (setId !== "legacy") {
      void fetch("/api/vocabulary/sets", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: setId, action: "MARK_STUDIED" }) });
    }
  }, [setId]);

  useEffect(() => {
    load().catch((error) => setMessage(error instanceof Error ? error.message : "Kelime seti yüklenemedi.")).finally(() => setLoading(false));
  }, [load]);

  const card = items[index];
  const progress = items.length ? Math.round(((index + 1) / items.length) * 100) : 0;

  const next = useCallback(() => {
    if (!items.length) return;
    setIndex((current) => (current + 1) % items.length);
    setFlipped(false);
  }, [items.length]);

  const previous = useCallback(() => {
    if (!items.length) return;
    setIndex((current) => (current - 1 + items.length) % items.length);
    setFlipped(false);
  }, [items.length]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return;
      if (event.code === "Space") { event.preventDefault(); setFlipped((value) => !value); }
      if (event.key === "ArrowRight") next();
      if (event.key === "ArrowLeft") previous();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, previous]);

  function speak(item?: VocabularyRecord) {
    if (!item || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(`${item.article ? `${item.article} ` : ""}${item.word}. ${item.example || ""}`);
    utterance.lang = "de-DE"; utterance.rate = .84;
    window.speechSynthesis.speak(utterance);
  }

  function shuffleCards() {
    setItems((current) => [...current].sort(() => Math.random() - .5));
    setIndex(0); setFlipped(false); setKnown([]);
  }

  function markKnown() {
    if (!card) return;
    setKnown((current) => current.includes(card.id) ? current : [...current, card.id]);
    next();
  }

  const displayedWord = useMemo(() => card ? `${card.article ? `${card.article} ` : ""}${card.word}` : "", [card]);

  if (loading) return <div className="v21-study-loading">Kelime seti hazırlanıyor...</div>;
  if (message || !set) return <div className="panel v21-study-loading">{message || "Kelime seti bulunamadı."}<Link className="button button-secondary" href="/vocabulary">Setlere dön</Link></div>;

  return <div className="v21-study-page">
    <header className="v21-study-header">
      <Link href="/vocabulary"><ArrowLeft size={18}/>Kelime setlerine dön</Link>
      <div><span className="eyebrow">{set.level || "KİŞİSEL SET"}</span><h1>{set.title}</h1><p>{set.description}</p></div>
      <div className="v21-study-actions"><button onClick={shuffleCards}><Shuffle/>Karıştır</button><button className={showList ? "active" : ""} onClick={() => setShowList((value) => !value)}><List/>Liste</button></div>
    </header>

    <div className="v21-study-meta"><span>{index + 1} / {items.length}</span><div><i style={{ width: `${progress}%` }}/></div><strong>{known.length} bilinen</strong></div>

    {!items.length ? <section className="panel v21-empty-study"><Layers3/><h2>Bu sette henüz kelime yok</h2><p>Kelime Setlerim sayfasından yeni bir set oluşturabilirsin.</p></section> : showList ? <section className="v21-study-list">
      {items.map((item, itemIndex) => <article key={item.id} onClick={() => { setIndex(itemIndex); setShowList(false); setFlipped(false); }}>
        <span>{itemIndex + 1}</span><div><strong>{item.article ? `${item.article} ` : ""}{item.word}</strong><small>{item.translation}</small></div><p>{item.example || "Örnek cümle eklenmemiş."}</p><ChevronRight/>
      </article>)}
    </section> : <>
      <section className={`v21-flashcard ${flipped ? "flipped" : ""}`} onClick={() => setFlipped((value) => !value)}>
        <div className="v21-card-side front">
          <div className="v21-card-toolbar"><span>İpucu göstermek için karta dokun</span><button onClick={(event) => { event.stopPropagation(); speak(card); }}><Volume2/></button></div>
          <div className="v21-card-center"><small>{card.wordType || "Kelime"}</small><h2>{displayedWord}</h2>{card.plural ? <p>Çoğul: {card.plural}</p> : null}</div>
          <footer><span>Boşluk</span> tuşuna bas veya kartın üzerine tıkla.</footer>
        </div>
        <div className="v21-card-side back">
          <div className="v21-card-toolbar"><span>Türkçe anlam ve kullanım</span><button onClick={(event) => { event.stopPropagation(); speak(card); }}><Volume2/></button></div>
          <div className="v21-card-center"><small>{displayedWord}</small><h2>{card.translation}</h2>{card.example ? <blockquote><strong>{card.example}</strong>{card.exampleTranslation ? <span>{card.exampleTranslation}</span> : null}</blockquote> : null}</div>
          <footer>Sonraki karta geçmek için sağ oku kullan.</footer>
        </div>
      </section>

      <div className="v21-card-controls">
        <button onClick={previous}><ChevronLeft/>Önceki</button>
        <button className="flip" onClick={() => setFlipped((value) => !value)}><RotateCcw/>{flipped ? "Kelimeyi göster" : "Cevabı göster"}</button>
        <button className="known" onClick={markKnown}><Check/>Biliyorum</button>
        <button onClick={next}>Sonraki<ChevronRight/></button>
      </div>
    </>}
  </div>;
}
