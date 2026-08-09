import { NextResponse } from "next/server";
import { getApiUser } from "@/lib/auth/authorization";
import { recordAssessmentEvidence } from "@/lib/assessment/server";
import { withApiMonitoring } from "@/lib/security/api-monitor";
import type { AssessmentEvidenceInput } from "@/types/assessment";


/* V37_ROUTE_COMPAT_INLINE
 * V28.x-V36 static release validators expect the historical learning logic
 * to remain visible in this route file. V37 therefore keeps the original
 * POST implementation inline and mirrors only successful responses into
 * Mastery Engine. The old business logic runs first and remains authoritative.
 */
import { captureMasteryExchange } from "@/lib/mastery/bridge";

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

const __v37LegacyPost = withApiMonitoring("/api/assessment/evidence", POSTHandler);


export async function POST(request: Request): Promise<Response> {
  const requestCopy = request.clone();

  const response = await (
    __v37LegacyPost as unknown as (request: Request) => Promise<Response>
  )(request);

  if (response.ok) {
    try {
      const requestBody = await requestCopy.json().catch(() => null);
      const responseBody = await response.clone().json().catch(() => null);

      await captureMasteryExchange({
        source: "assessment-evidence",
        requestBody,
        responseBody,
      });
    } catch (error) {
      console.warn(
        "V37 mastery bridge skipped:",
        error instanceof Error ? error.message : "unknown"
      );
    }
  }

  return response;
}
