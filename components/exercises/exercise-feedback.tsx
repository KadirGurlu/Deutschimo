import Link from "next/link";
import { CheckCircle2, CircleX } from "lucide-react";

function formatAnswer(answer: unknown): string {
  if (typeof answer === "boolean") return answer ? "Doğru" : "Yanlış";
  if (Array.isArray(answer)) return answer.join(" · ");
  if (typeof answer === "object" && answer !== null) return Object.entries(answer as Record<string, unknown>).map(([key, value]) => `${key}: ${String(value)}`).join(" · ");
  return String(answer ?? "");
}

export function ExerciseFeedback({
  correct,
  explanation,
  correctAnswer,
  relatedSlideHref,
  canRetry,
}: {
  correct: boolean;
  explanation: string;
  correctAnswer?: unknown;
  relatedSlideHref?: string;
  canRetry: boolean;
}) {
  return <div className={`exercise-step-feedback ${correct ? "success" : "error"}`} role="status">
    {correct ? <CheckCircle2 size={23}/> : <CircleX size={23}/>}<div>
      <strong>{correct ? "Doğru cevap" : canRetry ? "Cevabını tekrar kontrol et" : "Doğru cevap gösterildi"}</strong>
      {!correct && !canRetry && correctAnswer !== undefined ? <p><b>Doğru yanıt:</b> {formatAnswer(correctAnswer)}</p> : null}
      <p>{explanation}</p>
      {!correct && relatedSlideHref ? <Link href={relatedSlideHref}>İlgili ders slaydına dön</Link> : null}
    </div>
  </div>;
}
