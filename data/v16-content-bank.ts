import rawContentBank from "@/data/v16-content-bank.json";
import v33A1Enrichment from "@/data/v33-a1-enrichment.json";
import type { V16UnitContent } from "@/types/v16-content";

const baseBank = rawContentBank as V16UnitContent[];
const v33Map = new Map((v33A1Enrichment as V16UnitContent[]).map((item) => [item.id, item]));

export const v16ContentBank: V16UnitContent[] = baseBank.map(
  (item) => v33Map.get(item.id) ?? item,
);

const contentByUnit = new Map(v16ContentBank.map((item) => [item.id, item]));

export function getV16UnitContent(unitId: string): V16UnitContent | undefined {
  return contentByUnit.get(unitId);
}
