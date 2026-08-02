import { AppSidebar } from "@/components/layout/app-sidebar";
import { VocabularySetsCenter } from "@/components/vocabulary/vocabulary-sets-center";

export default function VocabularyPage() {
  return <div className="dashboard-shell"><AppSidebar active="vocabulary"/><section className="dashboard-main"><VocabularySetsCenter/></section></div>;
}
