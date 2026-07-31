"use client";

import { readLearningState } from "@/lib/storage/learning-storage";

export function getRecentActivities(limit = 10) {
  return readLearningState().activities.slice(0, limit);
}
