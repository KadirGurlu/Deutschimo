"use client";

import { AlertTriangle, CheckCircle2, Info, Lightbulb } from "lucide-react";
import type { ContentBlock } from "@/types/learning";

export function LessonSlideRenderer({ blocks, miniAnswer, onMiniAnswer }: { blocks: ContentBlock[]; miniAnswer?: string; onMiniAnswer: (value: string) => void }) {
  return <div className="slide-blocks">{blocks.map((block) => {
    switch (block.type) {
      case "heading": return <h2 key={block.id}>{block.title}</h2>;
      case "text": return <p key={block.id}>{block.text}</p>;
      case "example": return <div className="content-example" key={block.id}><strong>{block.title}</strong><p>{block.text}</p></div>;
      case "translation": return <div className="content-translation" key={block.id}><span>{block.title}</span><p>{block.text}</p></div>;
      case "grammar_table": return <div className="grammar-table-wrap" key={block.id}><h3>{block.title}</h3><table><thead><tr>{block.columns?.map((column) => <th key={column.header}>{column.header}</th>)}</tr></thead><tbody>{Array.from({ length: Math.max(...(block.columns?.map((column) => column.values.length) ?? [0])) }, (_, index) => <tr key={index}>{block.columns?.map((column) => <td key={`${column.header}-${index}`}>{column.values[index] ?? ""}</td>)}</tr>)}</tbody></table></div>;
      case "vocabulary_list": return <div className="vocabulary-list-block" key={block.id}><h3>{block.title}</h3><div>{block.items?.map((item) => <span key={item}>{item}</span>)}</div></div>;
      case "info_box": return <div className="content-box info" key={block.id}><Info size={20}/><div><strong>{block.title}</strong><p>{block.text}</p></div></div>;
      case "warning_box": return <div className="content-box warning" key={block.id}><AlertTriangle size={20}/><div><strong>{block.title}</strong><p>{block.text}</p></div></div>;
      case "tip_box": return <div className="content-box tip" key={block.id}><Lightbulb size={20}/><div><strong>{block.title}</strong><p>{block.text}</p></div></div>;
      case "summary": return <div className="content-summary" key={block.id}><CheckCircle2 size={24}/><div><h3>{block.title}</h3><ul>{block.items?.map((item) => <li key={item}>{item}</li>)}</ul></div></div>;
      case "divider": return <hr key={block.id}/>;
      case "mini_check": return <fieldset className="mini-check" key={block.id}><legend>{block.miniCheck?.question}</legend>{block.miniCheck?.options.map((option) => <label key={option} className={miniAnswer === option ? "selected" : ""}><input type="radio" name={block.id} value={option} checked={miniAnswer === option} onChange={() => onMiniAnswer(option)}/><span>{option}</span></label>)}</fieldset>;
      default: return null;
    }
  })}</div>;
}
