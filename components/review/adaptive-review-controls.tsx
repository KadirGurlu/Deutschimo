"use client";

import { HelpCircle, ShieldCheck, ShieldQuestion } from "lucide-react";
import type { ReviewConfidence } from "@/types/vocabulary";
import styles from "./adaptive-review-controls.module.css";

type Props = {
  confidence: ReviewConfidence | null;
  onConfidenceChange: (value: ReviewConfidence) => void;
  hint?: string | null;
  hintUsed: boolean;
  onUseHint: () => void;
  disabled?: boolean;
};

export function AdaptiveReviewControls({
  confidence,
  onConfidenceChange,
  hint,
  hintUsed,
  onUseHint,
  disabled = false,
}: Props) {
  return (
    <div className={styles.shell}>
      <div className={styles.confidenceBlock}>
        <div>
          <strong>Cevabından ne kadar eminsin?</strong>
          <span>Bu seçim tekrar zamanını etkiler; dürüst cevap vermen yeterli.</span>
        </div>
        <div className={styles.confidenceButtons} role="group" aria-label="Cevap güveni">
          <button
            type="button"
            disabled={disabled}
            aria-pressed={confidence === "UNSURE"}
            className={confidence === "UNSURE" ? styles.selected : ""}
            onClick={() => onConfidenceChange("UNSURE")}
          >
            <ShieldQuestion size={18} /> Emin değilim
          </button>
          <button
            type="button"
            disabled={disabled}
            aria-pressed={confidence === "SURE"}
            className={confidence === "SURE" ? styles.selected : ""}
            onClick={() => onConfidenceChange("SURE")}
          >
            <ShieldCheck size={18} /> Eminim
          </button>
        </div>
      </div>

      {hint ? (
        <div className={styles.hintBlock}>
          {!hintUsed ? (
            <button type="button" disabled={disabled} className={styles.hintButton} onClick={onUseHint}>
              <HelpCircle size={18} /> İpucu kullan
            </button>
          ) : (
            <div className={styles.hintText} role="status">
              <HelpCircle size={18} />
              <span><strong>İpucu:</strong> {hint}</span>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
