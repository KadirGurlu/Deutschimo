import type { AssessmentEvidenceInput } from "@/types/assessment";

export async function recordAssessmentEvidence(input: AssessmentEvidenceInput | AssessmentEvidenceInput[]) {
  try {
    const response = await fetch("/api/assessment/evidence", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ evidence: Array.isArray(input) ? input : [input] }),
      keepalive: true,
    });
    if (!response.ok && response.status !== 401) console.warn("assessment_evidence_not_saved", response.status);
  } catch (error) {
    console.warn("assessment_evidence_request_failed", error);
  }
}
