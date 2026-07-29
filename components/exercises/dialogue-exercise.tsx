import { MultipleChoiceExercise } from "@/components/exercises/multiple-choice-exercise";
import type { Exercise } from "@/types/exercise";
export function DialogueExercise(props: { exercise: Exercise; value: unknown; onChange: (value: unknown) => void; disabled: boolean }) { return <div className="dialogue-exercise"><div className="dialogue-line">A: Diyalog başlangıcı için placeholder alan.</div><div className="dialogue-line muted">B: ...</div><MultipleChoiceExercise {...props}/></div>; }
