import { ChevronLeft, ChevronRight, Dumbbell } from "lucide-react";

export function SlideNavigation({ canPrevious, canNext, isLast, onPrevious, onNext, nextHint }: {
  canPrevious: boolean;
  canNext: boolean;
  isLast: boolean;
  onPrevious: () => void;
  onNext: () => void;
  nextHint?: string;
}) {
  return <div className="slide-navigation"><button className="button button-secondary" disabled={!canPrevious} onClick={onPrevious}><ChevronLeft size={18}/> Önceki</button><div>{!canNext && nextHint ? <small>{nextHint}</small> : null}<button className="button button-primary" disabled={!canNext} onClick={onNext}>{isLast ? <><Dumbbell size={18}/> Alıştırmalara Başla</> : <>Sonraki <ChevronRight size={18}/></>}</button></div></div>;
}
