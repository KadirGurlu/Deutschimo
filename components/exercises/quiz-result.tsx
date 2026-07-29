import Link from "next/link";
import { CheckCircle2, CircleX, RotateCcw } from "lucide-react";

export function QuizResult({ score, passed, correct, wrong, blank, courseId, unitId, nextUnitId, onRetry }: { score: number; passed: boolean; correct: number; wrong: number; blank: number; courseId: string; unitId: string; nextUnitId?: string; onRetry: () => void }) {
  return <section className={`quiz-result-card ${passed ? "passed" : "failed"}`}>
    {passed ? <CheckCircle2 size={42}/> : <CircleX size={42}/>}<h1>{passed ? "Ünite tamamlandı" : "Minimum başarı puanına ulaşılamadı"}</h1><p>{passed ? "Bu üniteyi başarıyla tamamladın. Bir sonraki ünite artık erişilebilir." : "Ders notlarını tekrar ederek değerlendirmeyi yeniden deneyebilirsin."}</p>
    <div className="quiz-result-score"><strong>%{score}</strong><span>Başarı oranı</span></div>
    <div className="quiz-result-stats"><span><strong>{correct}</strong> Doğru</span><span><strong>{wrong}</strong> Yanlış</span><span><strong>{blank}</strong> Boş</span></div>
    <div className="quiz-result-actions"><button className="button button-secondary" onClick={onRetry}><RotateCcw size={17}/> Yeniden Dene</button><Link className="button button-secondary" href={`/courses/${courseId}`}>Programa Dön</Link>{passed && nextUnitId ? <Link className="button button-primary" href={`/learn/${courseId}/${nextUnitId}`}>Sonraki Üniteye Geç</Link> : <Link className="button button-primary" href={`/learn/${courseId}/${unitId}`}>Üniteye Dön</Link>}</div>
  </section>;
}
