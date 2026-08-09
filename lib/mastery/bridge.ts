import { auth } from "@/auth";
import { recordMasteryEvidence } from "@/lib/mastery/server";
import { inferMasterySkill, inferMasteryTags, normalizeSkill } from "@/lib/mastery/skill-tags";
import type { MasteryEvidenceSource, MasterySkill } from "@/types/mastery";

type R = Record<string, unknown>;

type SkillLabQuestionResult = {
  questionId: string | null;
  masteryQuestionId: string | null;
  masteryTags: string[];
  kind: string | null;
  correct: boolean;
};

const rec = (value: unknown): R =>
  value && typeof value === "object" && !Array.isArray(value) ? (value as R) : {};

function deep(value: unknown, keys: string[]): unknown {
  const queue = [value];
  const seen = new Set<unknown>();

  while (queue.length) {
    const current = queue.shift();
    if (!current || typeof current !== "object" || seen.has(current)) continue;
    seen.add(current);

    if (Array.isArray(current)) {
      for (const item of current) queue.push(item);
      continue;
    }

    const object = rec(current);
    for (const key of keys) {
      if (object[key] !== undefined && object[key] !== null) return object[key];
    }

    for (const item of Object.values(object)) {
      if (item && typeof item === "object") queue.push(item);
    }
  }

  return undefined;
}

const str = (...values: unknown[]) =>
  values.find((value) => typeof value === "string" && value.trim()) as string | undefined;

const num = (...values: unknown[]) => {
  for (const value of values) {
    const parsed =
      typeof value === "number"
        ? value
        : typeof value === "string"
          ? Number(value)
          : Number.NaN;

    if (Number.isFinite(parsed)) return parsed;
  }

  return null;
};

const bool = (...values: unknown[]) => {
  for (const value of values) {
    if (typeof value === "boolean") return value;
    if (value === 1 || value === "true") return true;
    if (value === 0 || value === "false") return false;
  }

  return null;
};

function stringList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];

  return value
    .filter((item): item is string => typeof item === "string" && Boolean(item.trim()))
    .map((item) => item.trim())
    .slice(0, 8);
}

function skillLabCorrect(...roots: unknown[]) {
  const values: boolean[] = [];
  const queue = [...roots];
  const seen = new Set<unknown>();

  while (queue.length) {
    const current = queue.shift();
    if (!current || typeof current !== "object" || seen.has(current)) continue;
    seen.add(current);

    if (Array.isArray(current)) {
      for (const item of current) queue.push(item);
      continue;
    }

    const object = rec(current);
    const value = bool(object.correct, object.isCorrect);
    if (value !== null) values.push(value);

    for (const item of Object.values(object)) {
      if (item && typeof item === "object") queue.push(item);
    }
  }

  return values.length ? values.every(Boolean) : null;
}

/**
 * V46.3 release-readiness bridge.
 *
 * Skill Lab requests already carry questionResults with the exact
 * masteryQuestionId/masteryTags/correct signal. Use that authoritative
 * question-level payload instead of trying to infer a single aggregate
 * correctness value from the serialized SkillLabAttempt response.
 *
 * This makes every incorrect Skill Lab question a real Mastery evidence
 * record, which lets the existing V38 enqueueMasteryEvidenceForReview()
 * path create/refresh its ACTIVE Smart Review queue item.
 */
function skillLabQuestionResults(root: unknown): SkillLabQuestionResult[] {
  const rawResults = deep(root, ["questionResults"]);
  if (!Array.isArray(rawResults)) return [];

  const results: SkillLabQuestionResult[] = [];

  for (const raw of rawResults) {
    const row = rec(raw);
    const correct = bool(row.correct, row.isCorrect);
    if (correct === null) continue;

    results.push({
      questionId: str(row.questionId, row.itemId, row.exerciseId) ?? null,
      masteryQuestionId: str(row.masteryQuestionId) ?? null,
      masteryTags: stringList(row.masteryTags),
      kind: str(row.kind, row.type, row.section) ?? null,
      correct,
    });
  }

  return results;
}

function course(value: unknown) {
  const source = str(value);
  if (!source) return null;

  const match = source.toLowerCase().match(/\b(a1|a2|b1|b2)\b/);
  return match?.[1] ?? source.toLowerCase().slice(0, 40);
}

function source(value: string): MasteryEvidenceSource {
  const upper = value.toUpperCase();

  if (/VOCAB/.test(upper)) return "VOCABULARY_REVIEW";
  if (/WRITING/.test(upper)) return "WRITING_COACH";
  if (/REAL.GERMANY/.test(upper)) return "REAL_GERMANY";
  if (/PLACEMENT/.test(upper)) return "PLACEMENT";
  if (/SMART|INTELLIGENCE.REVIEW/.test(upper)) return "SMART_REVIEW";
  if (/SKILL/.test(upper)) return "SKILL_LAB";
  if (/ASSESSMENT/.test(upper)) return "ASSESSMENT";
  if (/QUIZ/.test(upper)) return "UNIT_QUIZ";
  if (/PROGRESS/.test(upper)) return "PROGRESS";

  return "EXERCISE";
}

function multi(value: unknown) {
  const output: Array<{ skill: MasterySkill; score: number }> = [];
  const scores = deep(value, ["skillScores", "scores", "rubricScores"]);

  if (Array.isArray(scores)) {
    for (const entry of scores) {
      const object = rec(entry);
      const skill = normalizeSkill(object.skill ?? object.name ?? object.dimension);
      const score = num(object.score, object.value, object.percent);
      if (skill && score !== null) output.push({ skill, score });
    }
  } else if (scores && typeof scores === "object") {
    for (const [key, value] of Object.entries(rec(scores))) {
      const skill = normalizeSkill(key);
      const score = num(value);
      if (skill && score !== null) output.push({ skill, score });
    }
  }

  const direct: Array<[string[], MasterySkill]> = [
    [["vocabularyScore", "wortschatzScore"], "VOCABULARY"],
    [["grammarScore", "formScore"], "GRAMMAR"],
    [["readingScore"], "READING"],
    [["listeningScore"], "LISTENING"],
    [["writingScore"], "WRITING"],
    [["speakingScore"], "SPEAKING"],
  ];

  for (const [keys, skill] of direct) {
    const score = num(deep(value, keys));
    if (score !== null && !output.some((entry) => entry.skill === skill)) {
      output.push({ skill, score });
    }
  }

  return output;
}

export async function captureMasteryExchange(input: {
  source: string;
  requestBody: unknown;
  responseBody?: unknown;
}): Promise<void> {
  const request = rec(input.requestBody);
  const response = rec(input.responseBody);
  const src = source(input.source);

  const session = await auth();
  const sessionUserId = (session?.user as { id?: string } | undefined)?.id;

  // /api/skills/attempts returns the freshly persisted SkillLabAttempt.
  // If Auth.js cannot be re-read after the wrapped handler has produced
  // its response, the server-generated attempt.userId remains a trusted
  // fallback for this SKILL_LAB bridge only.
  const persistedSkillLabUserId =
    src === "SKILL_LAB" ? str(deep(response, ["userId"])) : undefined;

  const userId = sessionUserId ?? persistedSkillLabUserId;
  if (!userId) return;

  const courseId = course(
    deep(request, ["courseId", "course", "level"]) ??
      deep(response, ["courseId", "course", "level"]),
  );
  if (!courseId) return;

  const unitId =
    str(
      deep(request, ["unitId", "unit"]),
      deep(response, ["unitId", "unit"]),
    ) ?? null;

  const externalId =
    str(
      deep(response, ["attemptId", "evidenceId", "id"]),
      deep(request, ["attemptId", "evidenceId"]),
    ) ?? null;

  const qid =
    str(
      deep(request, ["questionId", "exerciseId", "itemId", "taskId", "scenarioId"]),
      deep(response, ["questionId", "exerciseId", "itemId", "taskId", "scenarioId"]),
      externalId,
    ) ?? `${src}:${unitId ?? courseId}:${Date.now()}`;

  const questionResults =
    src === "SKILL_LAB" ? skillLabQuestionResults(request) : [];

  if (questionResults.length) {
    const skill = inferMasterySkill({
      explicit:
        deep(request, ["masterySkill", "skill"]) ??
        deep(response, ["masterySkill", "skill"]),
      source: input.source,
      prompt: deep(request, ["prompt", "question", "title"]),
      section: deep(request, ["section", "kind", "type"]),
    });

    const skillLabScore = num(
      deep(request, ["score", "percent"]),
      deep(response, ["score", "overallScore", "percent", "mastery"]),
    );

    const durationSeconds = num(deep(request, ["durationSeconds"]));
    const responseMs =
      num(deep(request, ["responseMs", "durationMs", "elapsedMs"])) ??
      (durationSeconds === null
        ? null
        : Math.max(0, Math.round(durationSeconds * 1000)));

    await Promise.all(
      questionResults.map((result, index) => {
        const questionId =
          result.masteryQuestionId ??
          result.questionId ??
          `${qid}:q${index + 1}`;

        const tags = result.masteryTags.length
          ? result.masteryTags
          : inferMasteryTags({
              skill,
              courseId,
              unitId,
              prompt: questionId,
              section: result.kind,
            });

        return recordMasteryEvidence(userId, {
          courseId,
          unitId,
          questionId,
          skill,
          tags,
          score: skillLabScore ?? undefined,
          correct: result.correct,
          responseMs,
          hintUsed: bool(deep(request, ["hintUsed", "usedHint"])) ?? false,
          confidence: str(deep(request, ["confidence"])) ?? null,
          difficulty: num(deep(request, ["difficulty"])),
          source: src,
          externalId: externalId ? `${externalId}:${questionId}` : null,
        });
      }),
    );

    return;
  }

  const responseScores = multi(response);
  const scores = responseScores.length ? responseScores : multi(request);
  const multiCorrect =
    src === "SKILL_LAB" ? skillLabCorrect(request, response) : null;

  if (scores.length) {
    await Promise.all(
      scores.map(({ skill, score }) =>
        recordMasteryEvidence(userId, {
          courseId,
          unitId,
          questionId: `${qid}:${skill.toLowerCase()}`,
          skill,
          tags: inferMasteryTags({ skill, courseId, unitId, prompt: qid }),
          score,
          correct:multiCorrect,
          source: src,
          externalId: externalId ? `${externalId}:${skill}` : null,
        }),
      ),
    );
    return;
  }

  const score = num(
    deep(response, ["score", "overallScore", "percent", "mastery"]),
    deep(request, ["score", "percent"]),
  );

  const correct = bool(
    deep(response, ["correct", "isCorrect", "passed"]),
    deep(request, ["correct", "isCorrect"]),
  );

  const finalCorrect =
    src === "SKILL_LAB"
      ? (skillLabCorrect(request, response) ?? correct)
      : correct;

  if (score === null && finalCorrect === null) return;

  const skill = inferMasterySkill({
    explicit:
      deep(request, ["masterySkill", "skill"]) ??
      deep(response, ["masterySkill", "skill"]),
    source: input.source,
    prompt: deep(request, ["prompt", "question", "title"]),
    section: deep(request, ["section", "kind", "type"]),
  });

  await recordMasteryEvidence(userId, {
    courseId,
    unitId,
    questionId: qid,
    skill,
    tags: inferMasteryTags({
      skill,
      courseId,
      unitId,
      prompt: deep(request, ["prompt", "question", "title"]),
      section: deep(request, ["section", "kind", "type"]),
      existing:
        deep(request, ["masteryTags", "tags"]) ??
        deep(response, ["masteryTags", "tags"]),
    }),
    score: score ?? undefined,
    correct:finalCorrect,
    responseMs: num(deep(request, ["responseMs", "durationMs", "elapsedMs"])),
    hintUsed: bool(deep(request, ["hintUsed", "usedHint"])) ?? false,
    confidence: str(deep(request, ["confidence"])) ?? null,
    difficulty: num(deep(request, ["difficulty"])),
    source: src,
    externalId,
  });
}
