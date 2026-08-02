import { AppSidebar } from "@/components/layout/app-sidebar";
import { VocabularyCenter } from "@/components/vocabulary/vocabulary-center";

export default function VocabularyReviewPage() {
  return <div className="dashboard-shell"><AppSidebar active="vocabulary"/><section className="dashboard-main"><VocabularyCenter/></section></div>;
}
