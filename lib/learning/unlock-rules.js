export function isUnitLocked(unit, progressMap) {
    if (!unit.prerequisiteUnitId)
        return false;
    return progressMap[unit.prerequisiteUnitId]?.status !== "COMPLETED";
}
export function lockReason(unit, allUnits) {
    if (!unit.prerequisiteUnitId)
        return undefined;
    const prerequisite = allUnits.find((item) => item.id === unit.prerequisiteUnitId);
    return prerequisite ? `Bu üniteye erişmek için önce Ünite ${prerequisite.order}’yi tamamla.` : "Önce gerekli üniteyi tamamla.";
}
