"use client";

import { AlertTriangle, Check, CheckCircle2, Info, Lightbulb } from "lucide-react";
import type { ContentBlock } from "@/types/learning";

function vocabularyMeta(term: string) {
  const articleMatch = term.match(/^(der|die|das)\s+(.+)$/i);
  if (articleMatch) return { badge: articleMatch[1].toLowerCase(), term: articleMatch[2], kind: "İsim" };
  const fixedExpressions = new Set(["Guten Morgen", "Guten Tag", "Auf Wiedersehen", "im Folgenden"]);
  if (fixedExpressions.has(term)) return { badge: "İ", term, kind: "İfade" };
  const looksLikeVerb = term.startsWith("sich ") || /^[a-zäöüß].*(?:en|ern|eln|ieren)(?:\s+(?:an|auf|mit|gegen|um|von|zu))?$/i.test(term);
  if (looksLikeVerb) return { badge: "V", term, kind: "Fiil" };
  const hasVerbAtEnd = term.split(/\s+/).some((part) => /(?:en|ern|eln|ieren)$/i.test(part));
  if (hasVerbAtEnd) return { badge: "V", term, kind: "Fiil kalıbı" };
  return { badge: "•", term, kind: term.includes(" ") ? "İfade" : "Kelime" };
}

export function LessonSlideRenderer({ blocks, miniAnswer, onMiniAnswer }: { blocks: ContentBlock[]; miniAnswer?: string; onMiniAnswer: (value: string) => void }) {
  return <div className="slide-blocks">{blocks.map((block) => {
    switch (block.type) {
      case "heading": return <h2 key={block.id}>{block.title}</h2>;
      case "text": return <p key={block.id}>{block.text}</p>;
      case "example": return <div className="content-example" key={block.id}><strong>{block.title}</strong><p lang="de">{block.text}</p></div>;
      case "translation": return <div className="content-translation" key={block.id}><span>{block.title}</span><p>{block.text}</p></div>;
      case "grammar_table": return <div className="grammar-table-wrap" key={block.id}><h3>{block.title}</h3><div className="responsive-table"><table><thead><tr>{block.columns?.map((column) => <th key={column.header}>{column.header}</th>)}</tr></thead><tbody>{Array.from({ length: Math.max(...(block.columns?.map((column) => column.values.length) ?? [0])) }, (_, index) => <tr key={index}>{block.columns?.map((column) => <td key={`${column.header}-${index}`}>{column.values[index] ?? ""}</td>)}</tr>)}</tbody></table></div></div>;
      case "vocabulary_list": return <section className="vocabulary-list-block" key={block.id}><h3>{block.title}</h3><div className="vocabulary-rows">{block.items?.map((item, index) => {
        const [rawTerm, ...meaningParts] = item.split(" — ");
        const meta = vocabularyMeta(rawTerm.trim());
        return <div className="vocabulary-row" key={`${item}-${index}`}>
          <span className={`vocabulary-index ${["der", "die", "das"].includes(meta.badge) ? `article-${meta.badge}` : ""}`}>{meta.badge}</span>
          <div className="vocabulary-term"><strong lang="de">{meta.term}</strong><small>{meta.kind}</small></div>
          <span className="vocabulary-separator" aria-hidden="true">→</span>
          <span className="vocabulary-meaning">{meaningParts.join(" — ")}</span>
        </div>;
      })}</div></section>;
      case "info_box": return <div className="content-box info" key={block.id}><Info size={20}/><div><strong>{block.title}</strong><p>{block.text}</p></div></div>;
      case "warning_box": return <div className="content-box warning" key={block.id}><AlertTriangle size={20}/><div><strong>{block.title}</strong><p>{block.text}</p></div></div>;
      case "tip_box": return <div className="content-box tip" key={block.id}><Lightbulb size={20}/><div><strong>{block.title}</strong><p>{block.text}</p></div></div>;
      case "summary": return <div className="content-summary" key={block.id}><CheckCircle2 size={24}/><div><h3>{block.title}</h3><ul>{block.items?.map((item) => <li key={item}>{item}</li>)}</ul></div></div>;
      case "divider": return <hr key={block.id}/>;
      case "mini_check": {
        const isCorrect = Boolean(miniAnswer && miniAnswer === block.miniCheck?.correctAnswer);
        const isWrong = Boolean(miniAnswer && miniAnswer !== block.miniCheck?.correctAnswer);
        return <fieldset className="mini-check" key={block.id}>
          <legend>{block.miniCheck?.question}</legend>
          <p className="selection-hint">Doğru cevabı seçtiğinde sonraki slayt açılır.</p>
          {block.miniCheck?.options.map((option, optionIndex) => {
            const selected = miniAnswer === option;
            return <button key={option} type="button" className={`choice-option-button ${selected ? "selected" : ""}`} aria-pressed={selected} onClick={() => onMiniAnswer(option)}>
              <span className="choice-option-marker" aria-hidden="true">{selected ? <Check size={16}/> : String.fromCharCode(65 + optionIndex)}</span>
              <span className="choice-option-text">{option}</span>
            </button>;
          })}
          {isCorrect ? <p className="mini-check-feedback correct"><CheckCircle2 size={18}/> Doğru. Bu yapıyı bir sonraki adımda kullanabilirsin.</p> : null}
          {isWrong ? <p className="mini-check-feedback wrong"><AlertTriangle size={18}/> Bu cevap uygun değil. Ders notundaki kuralı yeniden kontrol et.</p> : null}
        </fieldset>;
      }
      default: return null;
    }
  })}</div>;
}
