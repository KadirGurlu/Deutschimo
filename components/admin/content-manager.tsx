"use client";
import { useCallback,useEffect,useMemo,useState } from "react";
import Link from "next/link";
import { BookOpenText,CheckCircle2,FileQuestion,Headphones,History,Languages,Plus,RefreshCw,Save,Search,ShieldCheck,ToggleLeft,ToggleRight } from "lucide-react";

type EntityType="COURSE"|"UNIT"|"LESSON"|"VOCABULARY"|"QUESTION"|"LISTENING";
type Status="DRAFT"|"REVIEW"|"READY"|"PUBLISHED"|"ARCHIVED";
type RecordItem={id:string;key:string;entityType:EntityType;parentKey:string|null;courseKey:string|null;unitKey:string|null;level:"A1"|"A2"|"B1"|"B2"|null;title:string;status:Status;active:boolean;qualityTier:"GOLD"|"STANDARD"|"REVIEW_REQUIRED";version:number;payload:Record<string,unknown>;updatedAt:string};
type Revision={id:string;version:number;status:Status;changeNote:string|null;createdAt:string};

const statusLabel:Record<Status,string>={DRAFT:"Taslak",REVIEW:"İncelemede",READY:"Yayına hazır",PUBLISHED:"Yayında",ARCHIVED:"Arşiv"};
const typeLabel:Record<EntityType,string>={COURSE:"Kurs",UNIT:"Ünite",LESSON:"Ders",VOCABULARY:"Kelime",QUESTION:"Soru",LISTENING:"Dinleme"};
const next=(s:Status):Status=>s==="DRAFT"?"REVIEW":s==="REVIEW"?"READY":s==="READY"?"PUBLISHED":"REVIEW";

function textOf(record:RecordItem){
  const p=record.payload??{};
  if(record.entityType==="QUESTION")return String(p.prompt??"");
  if(record.entityType==="VOCABULARY"){const item=p.item&&typeof p.item==="object"?p.item as Record<string,unknown>:{};return String(item.meaning??"")}
  if(record.entityType==="LISTENING"){const b=p.block&&typeof p.block==="object"?p.block as Record<string,unknown>:{};return String(b.text??"")}
  if(record.entityType==="LESSON"){const blocks=Array.isArray(p.contentBlocks)?p.contentBlocks as Array<Record<string,unknown>>:[];return String(blocks.find((b)=>b.type==="text")?.text??"")}
  return String(p.description??"");
}
function withText(record:RecordItem,value:string){
  const p=structuredClone(record.payload??{});
  if(record.entityType==="QUESTION")p.prompt=value;
  else if(record.entityType==="VOCABULARY"){const item=p.item&&typeof p.item==="object"?p.item as Record<string,unknown>:{};p.item={...item,meaning:value}}
  else if(record.entityType==="LISTENING"){const b=p.block&&typeof p.block==="object"?p.block as Record<string,unknown>:{};p.block={...b,text:value}}
  else if(record.entityType==="LESSON"){const blocks=Array.isArray(p.contentBlocks)?p.contentBlocks as Array<Record<string,unknown>>:[];const i=blocks.findIndex((b)=>b.type==="text");if(i>=0)blocks[i]={...blocks[i],text:value};else blocks.unshift({id:`cms-text-${Date.now()}`,type:"text",text:value});p.contentBlocks=blocks}
  else p.description=value;
  return p;
}

export function ContentManager(){
  const[catalog,setCatalog]=useState<{courses:RecordItem[];units:RecordItem[]}>({courses:[],units:[]});
  const[records,setRecords]=useState<RecordItem[]>([]);const[courseKey,setCourseKey]=useState("a1");const[unitKey,setUnitKey]=useState("a1-u01");
  const[tab,setTab]=useState<"ALL"|EntityType>("ALL");const[query,setQuery]=useState("");const[message,setMessage]=useState("");const[busy,setBusy]=useState(false);
  const[editing,setEditing]=useState<RecordItem|null>(null);const[editTitle,setEditTitle]=useState("");const[editText,setEditText]=useState("");
  const[history,setHistory]=useState<{record:RecordItem;revisions:Revision[]}|null>(null);

  const loadCatalog=useCallback(async()=>{const r=await fetch("/api/admin/content-studio?catalog=1",{cache:"no-store"});const p=await r.json();if(r.ok)setCatalog(p)},[]);
  const loadUnit=useCallback(async(id=unitKey)=>{if(!id)return;setBusy(true);try{const r=await fetch(`/api/admin/content-studio?unitKey=${encodeURIComponent(id)}&materialize=1`,{cache:"no-store"});const p=await r.json();if(!r.ok)throw new Error(p.error);setRecords(p.records??[])}catch(e){setMessage(e instanceof Error?e.message:"İçerik yüklenemedi.")}finally{setBusy(false)}},[unitKey]);
  useEffect(()=>{void loadCatalog()},[loadCatalog]);useEffect(()=>{void loadUnit(unitKey)},[unitKey,loadUnit]);

  const units=useMemo(()=>catalog.units.filter((u)=>u.courseKey===courseKey),[catalog.units,courseKey]);
  useEffect(()=>{if(!units.some((u)=>u.unitKey===unitKey)&&units[0]?.unitKey)setUnitKey(units[0].unitKey)},[units,unitKey]);
  const visible=useMemo(()=>records.filter((r)=>(tab==="ALL"||r.entityType===tab)&&(!query.trim()||r.title.toLocaleLowerCase("tr-TR").includes(query.toLocaleLowerCase("tr-TR")))),[records,tab,query]);
  const currentUnit=catalog.units.find((u)=>u.unitKey===unitKey);const currentCourse=catalog.courses.find((c)=>c.courseKey===courseKey);

  async function patch(record:RecordItem,body:Record<string,unknown>){
    setBusy(true);try{const r=await fetch(`/api/admin/content-studio/${record.id}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});const p=await r.json();if(!r.ok)throw new Error(p.error);setMessage(`${p.record.title} kaydedildi · v${p.record.version}`);await Promise.all([loadCatalog(),loadUnit()]);return p.record as RecordItem}catch(e){setMessage(e instanceof Error?e.message:"Güncelleme başarısız.");return null}finally{setBusy(false)}
  }
  async function create(type:EntityType){
    const title=window.prompt(`${typeLabel[type]} başlığı`,`Yeni ${typeLabel[type].toLocaleLowerCase("tr-TR")}`)?.trim();if(!title)return;
    const generated=type==="UNIT"?`${courseKey}-u${String(units.length+1).padStart(2,"0")}-${Date.now().toString().slice(-4)}`:unitKey;
    setBusy(true);try{const r=await fetch("/api/admin/content-studio",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({
      entityType:type,title,courseKey:type==="COURSE"?title.toLowerCase().replace(/[^a-z0-9]+/g,"-"):courseKey,
      unitKey:type==="COURSE"?null:generated,parentKey:type==="COURSE"?null:type==="UNIT"?`course:${courseKey}`:`unit:${unitKey}`,level:currentCourse?.level??"A1",
    })});const p=await r.json();if(!r.ok)throw new Error(p.error);setMessage(`${typeLabel[type]} taslak olarak oluşturuldu.`);await loadCatalog();if(!["COURSE","UNIT"].includes(type))await loadUnit()}catch(e){setMessage(e instanceof Error?e.message:"İçerik oluşturulamadı.")}finally{setBusy(false)}
  }
  function edit(record:RecordItem){setEditing(record);setEditTitle(record.title);setEditText(textOf(record))}
  async function save(){if(!editing)return;const updated=await patch(editing,{title:editTitle,payload:withText(editing,editText),changeNote:"Content Studio düzenlemesi"});if(updated)setEditing(null)}
  async function versions(record:RecordItem){const r=await fetch(`/api/admin/content-studio/${record.id}/versions`,{cache:"no-store"});const p=await r.json();if(r.ok)setHistory({record,revisions:p.revisions??[]})}

  return <>
    <div className="section-head"><div><span className="eyebrow">V44 · ADMIN CONTENT STUDIO</span><h1 className="section-title">İçeriği kod değiştirmeden yönet</h1><p className="section-copy">Kurs, ünite, ders, kelime, soru ve dinleme içerikleri artık veritabanında sürümlenir.</p></div><div className="v44-actions"><Link className="button button-secondary" href="/admin/quality"><ShieldCheck size={17}/> Kalite Merkezi</Link><button className="button button-primary" onClick={()=>create("COURSE")}><Plus size={17}/> Kurs Oluştur</button></div></div>
    {message?<div className="save-message">{message}</div>:null}
    <div className="v44-status-flow">{(["DRAFT","REVIEW","READY","PUBLISHED"] as Status[]).map((s)=><span key={s}>{statusLabel[s]}</span>)}</div>
    <div className="v44-layout">
      <aside className="v44-nav">
        <strong>Kurslar</strong>
        {catalog.courses.map((c)=><button key={c.id} className={c.courseKey===courseKey?"active":""} onClick={()=>setCourseKey(c.courseKey??"")}><span className="level-badge">{c.level}</span><div><b>{c.title}</b><small>{catalog.units.filter((u)=>u.courseKey===c.courseKey).length} ünite</small></div></button>)}
        <button className="v44-add" onClick={()=>create("COURSE")}><Plus size={14}/> Yeni kurs</button>
        <strong className="v44-unit-label">Üniteler</strong>
        {units.map((u)=><button key={u.id} className={u.unitKey===unitKey?"active":""} onClick={()=>setUnitKey(u.unitKey??"")}><i className={`v44-dot ${u.status.toLowerCase()}`}/><div><b>{u.title}</b><small>{statusLabel[u.status]} · v{u.version}</small></div></button>)}
        <button className="v44-add" onClick={()=>create("UNIT")}><Plus size={14}/> Yeni ünite</button>
      </aside>
      <main className="v44-main">
        <section className="panel v44-current"><div><span className="eyebrow">{currentCourse?.level} · AKTİF ÜNİTE</span><h2>{currentUnit?.title??"Ünite seç"}</h2><p>{currentUnit?`${statusLabel[currentUnit.status]} · ${currentUnit.qualityTier==="GOLD"?"Gold":"Standart"} · v${currentUnit.version}`:""}</p></div>{currentUnit?<div><button className="button button-secondary" onClick={()=>edit(currentUnit)}>Üniteyi Düzenle</button><button className="button button-primary" onClick={()=>patch(currentUnit,{status:next(currentUnit.status),changeNote:"Yayın akışı güncellendi"})}>{currentUnit.status==="PUBLISHED"?"İncelemeye Al":statusLabel[next(currentUnit.status)]}</button></div>:null}</section>
        <div className="v44-create">{(["LESSON","VOCABULARY","QUESTION","LISTENING"] as EntityType[]).map((t)=>{const Icon=t==="LESSON"?BookOpenText:t==="VOCABULARY"?Languages:t==="QUESTION"?FileQuestion:Headphones;return <button key={t} onClick={()=>create(t)}><Icon/><b>{typeLabel[t]} ekle</b><small>Taslak oluştur</small></button>})}</div>
        <section className="panel">
          <div className="section-head"><div><h2>Ünite içeriği</h2><p>Legacy Gold Standard içerik bu ünite açıldığında otomatik CMS'e bağlanır.</p></div><button className="button button-secondary" onClick={()=>loadUnit()}><RefreshCw size={16}/> Yenile</button></div>
          <div className="v44-toolbar"><div>{(["ALL","LESSON","VOCABULARY","QUESTION","LISTENING"] as const).map((t)=><button key={t} className={tab===t?"active":""} onClick={()=>setTab(t)}>{t==="ALL"?"Tümü":typeLabel[t]}</button>)}</div><label><Search size={15}/><input value={query} onChange={(e)=>setQuery(e.target.value)} placeholder="Ara"/></label></div>
          <div className="v44-list">{visible.map((r)=><article key={r.id}><div className="v44-meta"><span>{typeLabel[r.entityType]}</span><em className={r.status.toLowerCase()}>{statusLabel[r.status]}</em>{r.qualityTier==="GOLD"?<mark><ShieldCheck size={12}/> Gold</mark>:null}{!r.active?<u>Pasif</u>:null}</div><div className="v44-title"><b>{r.title}</b><small>v{r.version} · {new Date(r.updatedAt).toLocaleString("tr-TR")}</small></div><div className="v44-row-actions"><button onClick={()=>edit(r)}><Save size={15}/> Düzenle</button>{r.entityType==="QUESTION"?<button onClick={()=>patch(r,{active:!r.active,changeNote:r.active?"Soru pasife alındı":"Soru aktifleştirildi"})}>{r.active?<ToggleRight size={16}/>:<ToggleLeft size={16}/>} {r.active?"Pasife al":"Aktifleştir"}</button>:null}<button onClick={()=>versions(r)}><History size={15}/> Sürümler</button><button onClick={()=>patch(r,{status:next(r.status),changeNote:"Yayın akışı güncellendi"})}><CheckCircle2 size={15}/> {r.status==="PUBLISHED"?"İncele":statusLabel[next(r.status)]}</button></div></article>)}{!busy&&!visible.length?<p className="v44-empty">İçerik bulunamadı.</p>:null}</div>
        </section>
      </main>
    </div>
    {editing?<div className="modal-backdrop"><section className="confirm-modal v44-modal"><span className="eyebrow">{typeLabel[editing.entityType]} · v{editing.version}</span><h2>Düzenle</h2><label className="field"><span>Başlık</span><input value={editTitle} onChange={(e)=>setEditTitle(e.target.value)}/></label><label className="field"><span>{editing.entityType==="QUESTION"?"Soru metni":editing.entityType==="VOCABULARY"?"Türkçe anlam":editing.entityType==="LISTENING"?"Transkript":"Ana metin / açıklama"}</span><textarea rows={8} value={editText} onChange={(e)=>setEditText(e.target.value)}/></label><div className="v44-modal-actions"><button className="button button-secondary" onClick={()=>setEditing(null)}>Vazgeç</button><button className="button button-primary" onClick={save}><Save size={16}/> Yeni Sürüm Kaydet</button></div></section></div>:null}
    {history?<div className="modal-backdrop"><section className="confirm-modal v44-modal"><span className="eyebrow">SÜRÜM GEÇMİŞİ</span><h2>{history.record.title}</h2><div className="v44-history">{history.revisions.map((v)=><div key={v.id}><History size={15}/><b>v{v.version} · {statusLabel[v.status]}</b><span>{v.changeNote??"Değişiklik"}</span><time>{new Date(v.createdAt).toLocaleString("tr-TR")}</time></div>)}</div><button className="button button-secondary" onClick={()=>setHistory(null)}>Kapat</button></section></div>:null}
  </>
}
