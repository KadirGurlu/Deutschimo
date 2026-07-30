import type { Unit } from "@/types/course";
import type { UnitProgress } from "@/types/progress";

export function isUnitLocked(unit: Unit, progressMap: Record<string, UnitProgress>): boolean {
  if (!unit.prerequisiteUnitId) return false;
  return progressMap[unit.prerequisiteUnitId]?.status !== "COMPLETED";
}

export function lockReason(unit: Unit, allUnits: Unit[]): string | undefined {
  if (!unit.prerequisiteUnitId) return undefined;
  const prerequisite = allUnits.find((item) => item.id === unit.prerequisiteUnitId);
  return prerequisite ? `Bu üniteye erişmek için önce Ünite ${prerequisite.order}’yi tamamla.` : "Önce gerekli üniteyi tamamla.";
}
