"use client";

// V45_ACCESSIBILITY_QUESTION_SEMANTICS

import { CheckCircle2, XCircle } from "lucide-react";
import type { ComprehensionQuestion } from "@/types/skills";

const kindLabels: Record<ComprehensionQuestion["kind"], string> = {
  MAIN_IDEA: "ANA FİKİR",
  DETAIL: "DETAY",
  INFERENCE: "ÇIKARIM",
  ATTITUDE: "KONUŞMACININ TUTUMU",
};

export function QuestionStep({
  question,
  selected,
  checked,
  onSelect,
}: {
  question: ComprehensionQuestion;
  selected?: string;
  checked: boolean;
  onSelect: (value: string) => void;
}) {
  const correct = selected === question.correctAnswer;

  return (
    <div className="lab-question">
      <span className="eyebrow">{kindLabels[question.kind]}</span>
      <h2 id={`question-${question.id}`}>{question.prompt}</h2>
      <div className="lab-options" role="radiogroup" aria-labelledby={`question-${question.id}`}>
        {question.options.map((option, index) => {
          const state = checked
            ? option.id === question.correctAnswer
              ? "correct"
              : option.id === selected
                ? "wrong"
                : ""
            : option.id === selected
              ? "selected"
              : "";

          return (
            <button
              key={option.id}
              className={state}
              type="button"
              role="radio"
              aria-checked={option.id === selected}
              disabled={checked}
              onClick={() => onSelect(option.id)}
            >
              <span>{String.fromCharCode(65 + index)}</span>
              {option.label}
            </button>
          );
        })}
      </div>

      {checked ? (
        <div className={`lab-feedback ${correct ? "correct" : "wrong"}`} role="status" aria-live="polite">
          {correct ? <CheckCircle2 /> : <XCircle />}
          <div>
            <strong>{correct ? "Doğru cevap" : "Cevabını tekrar incele"}</strong>
            <p>{question.explanation}</p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
