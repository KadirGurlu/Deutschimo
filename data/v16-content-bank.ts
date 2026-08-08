import rawContentBank from "@/data/v16-content-bank.json";
import v33A1Enrichment from "@/data/v33-a1-enrichment.json";
import v34A2Enrichment from "@/data/v34-a2-enrichment.json";
import v35B1Enrichment from "@/data/v35-b1-enrichment.json";
import v36B2Enrichment from "@/data/v36-b2-enrichment.json";
import type { V16UnitContent } from "@/types/v16-content";

const baseBank = rawContentBank as V16UnitContent[];
const overlays = [
  ...(v33A1Enrichment as V16UnitContent[]),
  ...(v34A2Enrichment as V16UnitContent[]),
  ...(v35B1Enrichment as V16UnitContent[]),
  ...(v36B2Enrichment as V16UnitContent[]),
];
const overlayMap = new Map(overlays.map((item) => [item.id, item]));
export const v16ContentBank: V16UnitContent[] = baseBank.map((item) => overlayMap.get(item.id) ?? item);
const contentByUnit = new Map(v16ContentBank.map((item) => [item.id, item]));
export function getV16UnitContent(unitId: string): V16UnitContent | undefined { return contentByUnit.get(unitId); }
