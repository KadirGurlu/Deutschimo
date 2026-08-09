import LegacySkillsPage from "./legacy-v36-page";
import { MasteryOverview } from "@/components/mastery/mastery-overview";

export default function SkillsPageV37() {
  return (
    <>
      <MasteryOverview compact />
      <LegacySkillsPage />
    </>
  );
}
