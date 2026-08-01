import rawContentBank from "@/data/v16-content-bank.json";
import type { V16UnitContent } from "@/types/v16-content";

export const v16ContentBank = rawContentBank as V16UnitContent[];

const contentByUnit = new Map(v16ContentBank.map((item) => [item.id, item]));

export function getV16UnitContent(unitId: string): V16UnitContent | undefined {
  return contentByUnit.get(unitId);
}
