import { NextResponse } from "next/server";
import { getApiUser } from "@/lib/auth/authorization";
import { recordAssessmentEvidence } from "@/lib/assessment/server";
import { withApiMonitoring } from "@/lib/security/api-monitor";
import type { AssessmentEvidenceInput } from "@/types/assessment";

const sources = new Set(["EXERCISE", "UNIT_QUIZ", "SKILL_LAB", "PLACEMENT", "SMART_REVIEW"]);
const levels = new Set(["A1", "A2", "B1", "B2"]);
const skills = new Set(["GRAMMAR", "VOCABULARY", "COMMUNICATION", "READING", "LISTENING", "WRITING", "SPEAKING", "PRONUNCIATION"]);
const cognitiveLevels = new Set(["REMEMBER", "UNDERSTAND", "APPLY", "ANALYZE", "CREATE"]);

function valid(item: AssessmentEvidenceInput) {
  return Boolean(
    item && sources.has(item.sourceType) && levels.has(item.level) && skills.has(item.skill) && cognitiveLevels.has(item.cognitiveLevel)
    && item.sourceId?.trim() && item.courseId?.trim() && Array.isArray(item.objectiveCodes) && item.objectiveCodes.length > 0
    && Array.isArray(item.topicTags),
  );
}

async function POSTHandler(request: Request) {
  const user = await getApiUser();
  if (!user) return NextResponse.json({ error: "Oturum gerekli." }, { status: 401 });
  const body = await request.json() as { evidence?: AssessmentEvidenceInput[] };
  const evidence = Array.isArray(body.evidence) ? body.evidence.slice(0, 30) : [];
  if (!evidence.length || evidence.some((item) => !valid(item))) return NextResponse.json({ error: "Geçersiz ölçme verisi." }, { status: 400 });
  const saved = [];
  for (const item of evidence) saved.push(await recordAssessmentEvidence(user.id, item));
  return NextResponse.json({ saved: saved.length }, { status: 201 });
}

export const POST = withApiMonitoring("/api/assessment/evidence", POSTHandler);
