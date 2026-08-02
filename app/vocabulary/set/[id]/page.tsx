import { AppSidebar } from "@/components/layout/app-sidebar";
import { VocabularySetStudy } from "@/components/vocabulary/vocabulary-set-study";

export default async function VocabularySetPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <div className="dashboard-shell"><AppSidebar active="vocabulary"/><section className="dashboard-main"><VocabularySetStudy setId={id}/></section></div>;
}
