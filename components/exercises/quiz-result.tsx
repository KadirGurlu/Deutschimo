import Link from "next/link";
import { CheckCircle2, CircleX, RotateCcw } from "lucide-react";
import { answersMatch } from "@/lib/learning/answer-normalizer";
import type { UnitQuizQuestion } from "@/types/exercise";

function formatAnswer(answer: unknown): string {
  if (typeof answer === "boolean") return answer ? "Doğru" : "Yanlış";
  if (Array.isArray(answer)) return answer.join(" · ");
  return String(answer ?? "Boş bırakıldı");
}

export function QuizResult({
  score,
  passed,
  correct,
  wrong,
  blank,
  courseId,
  unitId,
  nextUnitId,
  onRetry,
  questions,
  answers,
}: {
  score: number;
  passed: boolean;
  correct: number;
  wrong: number;
  blank: number;
  courseId: string;
  unitId: string;
  nextUnitId?: string;
  onRetry: () => void;
  questions: UnitQuizQuestion[];
  answers: Record<string, unknown>;
}) {
  return <section className={`quiz-result-card ${passed ? "passed" : "failed"}`}>
    {passed ? <CheckCircle2 size={42}/> : <CircleX size={42}/>}<h1>{passed ? "Ünite tamamlandı" : "Minimum başarı puanına ulaşılamadı"}</h1><p>{passed ? "Bu üniteyi başarıyla tamamladın. Bir sonraki ünite artık erişilebilir." : "Ders notlarını tekrar ederek değerlendirmeyi yeniden deneyebilirsin."}</p>
    <div className="quiz-result-score"><strong>%{score}</strong><span>Başarı oranı</span></div>
    <div className="quiz-result-stats"><span><strong>{correct}</strong> Doğru</span><span><strong>{wrong}</strong> Yanlış</span><span><strong>{blank}</strong> Boş</span></div>

    <div className="quiz-answer-review">
      <h2>Soru açıklamaları</h2>
      <p className="quiz-answer-review-copy">Her soru için doğru yanıtı ve o soruya özel açıklamayı inceleyebilirsin.</p>
      {questions.map((question, index) => {
        const userAnswer = answers[question.id];
        const isCorrect = answersMatch(userAnswer, question.correctAnswer);
        return <article className={`quiz-review-item ${isCorrect ? "correct" : "incorrect"}`} key={question.id}>
          <div className="quiz-review-head">
            {isCorrect ? <CheckCircle2 size={21}/> : <CircleX size={21}/>}<strong>Soru {index + 1}</strong><span>{question.topic}</span>
          </div>
          <p className="quiz-review-question">{question.prompt}</p>
          <div className="quiz-review-answers"><span><b>Senin yanıtın:</b> {formatAnswer(userAnswer)}</span><span><b>Doğru yanıt:</b> {formatAnswer(question.correctAnswer)}</span></div>
          <p className="quiz-review-explanation"><b>Neden?</b> {question.explanation}</p>
          {question.relatedSlideId ? <Link href={`/learn/${courseId}/${unitId}`}>İlgili ders notlarını tekrar aç</Link> : null}
        </article>;
      })}
    </div>

    <div className="quiz-result-actions"><button className="button button-secondary" onClick={onRetry}><RotateCcw size={17}/> Yeniden Dene</button><Link className="button button-secondary" href={`/courses/${courseId}`}>Programa Dön</Link>{passed && nextUnitId ? <Link className="button button-primary" href={`/learn/${courseId}/${nextUnitId}`}>Sonraki Üniteye Geç</Link> : <Link className="button button-primary" href={`/learn/${courseId}/${unitId}`}>Üniteye Dön</Link>}</div>
  </section>;
}
