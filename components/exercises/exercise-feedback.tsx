import Link from "next/link";
import { CheckCircle2, CircleX } from "lucide-react";

export function ExerciseFeedback({ correct, explanation, relatedSlideHref, canRetry }: { correct: boolean; explanation: string; relatedSlideHref?: string; canRetry: boolean }) {
  return <div className={`exercise-step-feedback ${correct ? "success" : "error"}`} role="status">
    {correct ? <CheckCircle2 size={23}/> : <CircleX size={23}/>}<div><strong>{correct ? "Doğru cevap" : canRetry ? "Cevabını tekrar kontrol et" : "Doğru cevap gösterildi"}</strong><p>{explanation}</p>{!correct && relatedSlideHref ? <Link href={relatedSlideHref}>İlgili ders slaydına dön</Link> : null}</div>
  </div>;
}
