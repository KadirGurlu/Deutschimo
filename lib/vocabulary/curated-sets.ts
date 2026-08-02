import rawSets from "@/data/v21-vocabulary-sets.json";
import type { CuratedVocabularySetSummary, VocabularySetEntryInput } from "@/types/vocabulary";

export type CuratedVocabularySet = Omit<CuratedVocabularySetSummary, "itemCount" | "importedSetId"> & {
  entries: (VocabularySetEntryInput & { id: string })[];
};

const curatedSets = rawSets as CuratedVocabularySet[];

export function getCuratedVocabularySets() {
  return curatedSets;
}

export function getCuratedVocabularySet(slug: string) {
  return curatedSets.find((set) => set.slug === slug) ?? null;
}

export function getCuratedVocabularySetSummaries(): CuratedVocabularySetSummary[] {
  return curatedSets.map(({ entries, ...set }) => ({ ...set, itemCount: entries.length }));
}
