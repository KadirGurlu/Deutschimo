import type { MasterySkill } from "@/types/mastery";

const validSkills = new Set<MasterySkill>(["VOCABULARY","GRAMMAR","READING","LISTENING","WRITING","SPEAKING"]);

function textOf(value: unknown): string {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value.map(textOf).join(" ");
  if (value && typeof value === "object") return Object.values(value as Record<string, unknown>).map(textOf).join(" ");
  return "";
}
function normalize(value: string): string {
  return value.toLocaleLowerCase("de-DE").normalize("NFD").replace(/\p{Diacritic}/gu,"").replace(/ß/g,"ss");
}
function slug(value: string): string {
  return normalize(value).replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"").slice(0,64);
}
export function normalizeSkill(value: unknown): MasterySkill | null {
  if (typeof value !== "string") return null;
  const v=normalize(value);
  const aliases:Record<string,MasterySkill>={
    vocabulary:"VOCABULARY",wortschatz:"VOCABULARY",kelime:"VOCABULARY",
    grammar:"GRAMMAR",grammatik:"GRAMMAR",gramer:"GRAMMAR",form:"GRAMMAR",
    reading:"READING",lesen:"READING",okuma:"READING",
    listening:"LISTENING",horen:"LISTENING",hoeren:"LISTENING",dinleme:"LISTENING",
    writing:"WRITING",schreiben:"WRITING",yazma:"WRITING",
    speaking:"SPEAKING",sprechen:"SPEAKING",konusma:"SPEAKING"
  };
  if (aliases[v]) return aliases[v];
  const upper=value.toUpperCase() as MasterySkill;
  return validSkills.has(upper)?upper:null;
}
export function inferMasterySkill(input:{explicit?:unknown;section?:unknown;type?:unknown;prompt?:unknown;source?:unknown}):MasterySkill {
  const explicit=normalizeSkill(input.explicit); if(explicit) return explicit;
  const t=normalize(textOf([input.section,input.type,input.prompt,input.source]));
  if(/(listening|listen|audio|horen|hoeren|dinle)/.test(t)) return "LISTENING";
  if(/(reading|read|lesen|okuma|metin)/.test(t)) return "READING";
  if(/(speaking|speak|sprechen|konus|aussprache)/.test(t)) return "SPEAKING";
  if(/(writing|write|schreiben|yaz|email|e-mail|brief|forum)/.test(t)) return "WRITING";
  if(/(wortschatz|vocab|kelime|artikel|plural|meaning|bedeutung)/.test(t)) return "VOCABULARY";
  return "GRAMMAR";
}
export function inferMasteryTags(input:{skill:MasterySkill;prompt?:unknown;section?:unknown;courseId?:unknown;unitId?:unknown;existing?:unknown}):string[] {
  const tags=new Set<string>();
  if(Array.isArray(input.existing)) for(const item of input.existing) if(typeof item==="string"&&item.trim()) tags.add(slug(item));
  const t=normalize(textOf([input.prompt,input.section]));
  const pairs:Array<[RegExp,string]>=[
    [/\bakkusativ\b/,"akkusativ"],[/\bdativ\b/,"dativ"],[/\bgenitiv\b/,"genitiv"],[/\bnominativ\b/,"nominativ"],
    [/(der die das|artikel)/,"der-die-das"],[/(trennbar)/,"trennbare-verben"],[/(modalverb)/,"modalverben"],
    [/(konjunktiv)/,"konjunktiv"],[/(relativ)/,"relativsatz"],[/(passiv)/,"passiv"],
    [/(praposition|praeposition|edat)/,"praepositionen"],[/(plusquamperfekt)/,"plusquamperfekt"],[/(perfekt)/,"perfekt"],[/(prateritum|praeteritum)/,"praeteritum"]
  ];
  for(const [rx,tag] of pairs) if(rx.test(t)) tags.add(tag);
  if(/hauptidee|ana fikir|main idea/.test(t)) tags.add(input.skill==="LISTENING"?"hoeren-hauptidee":"lesen-hauptidee");
  if(/detail|ayrinti/.test(t)) tags.add(input.skill==="LISTENING"?"hoeren-detail":"lesen-detail");
  if(/inferenz|cikarim/.test(t)) tags.add(input.skill==="LISTENING"?"hoeren-inferenz":"lesen-inferenz");
  if(/formell|formal/.test(t)) tags.add(input.skill==="WRITING"?"schreiben-formell":"sprechen-register");
  if(/argument|begrund|begruend/.test(t)) tags.add(input.skill==="WRITING"?"schreiben-argumentation":"sprechen-argumentation");
  const fallback=[input.skill.toLowerCase(),typeof input.courseId==="string"?slug(input.courseId):"",typeof input.unitId==="string"?slug(input.unitId):""].filter(Boolean).join("-");
  if(fallback) tags.add(fallback);
  return [...tags].filter(Boolean).slice(0,8);
}
