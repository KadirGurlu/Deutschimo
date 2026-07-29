import { exercises as baseExercises } from "@/data/exercises";
import { slides as baseSlides } from "@/data/slides";
import { lockReason } from "@/lib/learning/unlock-rules";
import { UnitCard } from "@/components/course/unit-card";
import type { Unit } from "@/types/course";
import type { LearningStatus } from "@/types/learning";
import type { UnitProgress } from "@/types/progress";
import type { ContentState } from "@/lib/storage/learning-storage";

export function UnitLearningPath({ units, progressMap, getStatus, content }: {
  units: Unit[];
  progressMap: Record<string, UnitProgress>;
  getStatus: (unitId: string) => LearningStatus;
  content: ContentState;
}) {
  return <div className="unit-learning-path">{units.map((unit) => {
    const slides = content.slides[unit.id] ?? baseSlides.filter((slide) => slide.unitId === unit.id);
    const exercises = content.exercises[unit.id] ?? baseExercises.filter((exercise) => exercise.unitId === unit.id);
    return <UnitCard key={unit.id} unit={unit} status={getStatus(unit.id)} progress={progressMap[unit.id]} slideCount={slides.length} exerciseCount={exercises.length} lockReason={lockReason(unit, units)}/>;
  })}</div>;
}
