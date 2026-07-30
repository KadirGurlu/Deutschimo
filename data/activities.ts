import type { ActivityEvent } from "@/types/progress";

export const activityLabels: Record<ActivityEvent["eventType"], string> = {
  COURSE_STARTED: "Kursa başladın",
  UNIT_STARTED: "Üniteye başladın",
  SLIDE_COMPLETED: "Bir ders slaydını tamamladın",
  LESSONS_COMPLETED: "Ders notlarını tamamladın, alıştırmalar seni bekliyor",
  EXERCISE_COMPLETED: "Bir alıştırmayı tamamladın",
  EXERCISES_COMPLETED: "Ünite alıştırmalarını tamamladın",
  QUIZ_COMPLETED: "Ünite sonu testini tamamladın",
  QUIZ_PASSED: "Ünite sonu testinde hedef puana ulaştın",
  UNIT_COMPLETED: "Bir üniteyi tamamladın",
  COURSE_COMPLETED: "Kursu tamamladın",
};
