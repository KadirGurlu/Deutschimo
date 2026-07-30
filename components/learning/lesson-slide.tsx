import { Clock3 } from "lucide-react";
import { LessonSlideRenderer } from "@/components/learning/lesson-slide-renderer";
import type { LessonSlide as LessonSlideType } from "@/types/learning";

export function LessonSlide({ slide, miniAnswer, onMiniAnswer, onPracticeResult }: { slide: LessonSlideType; miniAnswer?: string; onMiniAnswer: (value: string) => void; onPracticeResult: (questionId: string, correct: boolean) => void }) {
  return <article className="lesson-slide-card"><header><div><span className="eyebrow">SLAYT {slide.order}</span><h1>{slide.title}</h1></div><span className="slide-time"><Clock3 size={16}/>{slide.estimatedMinutes} dk</span></header><LessonSlideRenderer blocks={slide.contentBlocks} miniAnswer={miniAnswer} onMiniAnswer={onMiniAnswer} onPracticeResult={onPracticeResult}/></article>;
}
