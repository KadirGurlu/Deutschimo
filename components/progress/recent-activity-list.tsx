import { Activity, CheckCircle2 } from "lucide-react";
import { activityLabels } from "@/data/activities";
import { courses } from "@/data/courses";
import { units } from "@/data/units";
import type { ActivityEvent } from "@/types/progress";

export function RecentActivityList({ activities }: { activities: ActivityEvent[] }) {
  if (!activities.length) return <div className="empty-inline"><Activity size={22}/><span>Henüz aktivite kaydı bulunmuyor.</span></div>;
  return <div className="recent-activity-list">{activities.map((activity) => {
    const course = courses.find((item) => item.id === activity.courseId);
    const unit = units.find((item) => item.id === activity.unitId);
    return <article key={activity.id}><CheckCircle2 size={19}/><div><strong>{activityLabels[activity.eventType]}</strong><span>{unit?.title ?? course?.title ?? "Deutschimo"}</span><small>{new Intl.DateTimeFormat("tr-TR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(activity.createdAt))}</small></div></article>;
  })}</div>;
}
