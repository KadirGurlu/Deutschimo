import { Progress } from "@/components/ui/progress";

export function SlideProgress({ current, total }: { current: number; total: number }) {
  const percent = total ? Math.round((current / total) * 100) : 0;
  return <div className="slide-progress"><div><span>Ders Notları</span><strong>{current} / {total}</strong></div><Progress value={percent} label={`%${percent}`}/></div>;
}
