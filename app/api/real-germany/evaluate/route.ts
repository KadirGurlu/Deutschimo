import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import {
  AssessmentSkill,
  AssessmentSourceType,
  CognitiveLevel,
  Level as PrismaLevel,
  Prisma,
} from "@prisma/client";
import { getRealGermanyScenario } from "@/data/real-germany";
import { getApiUser } from "@/lib/auth/authorization";
import { prisma } from "@/lib/db";
import { withApiMonitoring } from "@/lib/security/api-monitor";
import type {
  RealGermanyComparison,
  RealGermanyEvaluateRequest,
  RealGermanyEvaluationMode,
  RealGermanyEvaluationResult,
  RealGermanyLevel,
  RealGermanyScenario,
  RealGermanySkill,
  RealGermanySkillScore,
  RealGermanyWeakArea,
} from "@/types/real-germany";

export const runtime = "nodejs";

const levels = new Set<RealGermanyLevel>(["A1", "A2", "B1", "B2"]);
const skills = new Set<RealGermanySkill>(["READING", "LISTENING", "FORM", "WRITING"]);
const severities = new Set(["LOW", "MEDIUM", "HIGH"] as const);

const skillLabels: Record<RealGermanySkill, string> = {
  READING: "Okuma",
  LISTENING: "Dinleme",
  FORM: "Form",
  WRITING: "Yazma",
};

const skillToAssessment: Record<RealGermanySkill, AssessmentSkill> = {
  READING: AssessmentSkill.READING,
  LISTENING: AssessmentSkill.LISTENING,
  FORM: AssessmentSkill.WRITING,
  WRITING: AssessmentSkill.WRITING,
};

const feedbackSchema = {
  type: "object",
  additionalProperties: false,
  required: ["scores", "feedback", "strengths", "weakAreas", "nextStep"],
  properties: {
    scores: {
      type: "object",
      additionalProperties: false,
      required: ["reading", "listening", "form", "writing"],
      properties: {
        reading: { type: "integer" },
        listening: { type: "integer" },
        form: { type: "integer" },
        writing: { type: "integer" },
      },
    },
    feedback: {
      type: "object",
      additionalProperties: false,
      required: ["reading", "listening", "form", "writing"],
      properties: {
        reading: { type: "string" },
        listening: { type: "string" },
        form: { type: "string" },
        writing: { type: "string" },
      },
    },
    strengths: { type: "array", items: { type: "string" } },
    weakAreas: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["code", "label", "skill", "severity", "explanation", "excerpt", "nextReviewDays"],
        properties: {
          code: { type: "string" },
          label: { type: "string" },
          skill: { type: "string", enum: [...skills] },
          severity: { type: "string", enum: [...severities] },
          explanation: { type: "string" },
          excerpt: { type: "string" },
          nextReviewDays: { type: "integer" },
        },
      },
    },
    nextStep: { type: "string" },
  },
} as const;

const systemInstructions = `Sen Deutschimo Gerçek Almanya Modu değerlendirme motorusun. Türkçe konuşan A1-B2 Almanca öğrencilerinin Almanya'daki gerçek görevleri tamamlama becerisini değerlendirirsin.

Dört alanı 0-100 arasında ayrı ayrı puanla:
- READING: E-posta, duyuru veya resmî metinden istenen bilgiyi çıkarma.
- LISTENING: Simüle edilen sesli mesajın ana fikrini ve ayrıntısını anlama.
- FORM: İstenen alanları eksiksiz, doğru ve anlaşılır doldurma.
- WRITING: Amaca uygun, seviyeye göre doğru ve anlaşılır Almanca iletişim.

Öğrencinin seviyesine adil davran. A1'de kısa ve basit cevap kabul edilir; B2'de ayrıntı, bağlayıcılık ve uygun resmiyet beklenir.

Zayıf alanları öğretici biçimde belirle. code kısa, kalıcı ve küçük harfli İngilizce/ASCII bir öğrenme hedefi olsun (ör. date_time, formal_question, verb_position, form_completeness). Tam düzeltilmiş cevap veya öğrencinin yerine yazılmış model metin üretme. excerpt yalnızca öğrencinin cevabından kısa bir alıntı olmalı; yoksa boş bırak. Açıklama Türkçe olmalı. nextReviewDays 1-14 arasında olmalı.

Bu sonuç resmî Goethe/telc sonucu değildir; Deutschimo iç öğrenme değerlendirmesidir.`;

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function clamp(value: unknown) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(0, Math.min(100, Math.round(number))) : 0;
}

function cleanText(value: unknown, fallback: string, max = 500) {
  return typeof value === "string" && value.trim() ? value.trim().slice(0, max) : fallback;
}

function codeSlug(value: unknown) {
  const source = typeof value === "string" ? value : "general_task";
  const normalized = source.toLocaleLowerCase("en-US")
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/gu, "_")
    .replace(/^_+|_+$/gu, "")
    .slice(0, 60);
  return normalized || "general_task";
}

function sanitizeResponses(scenario: RealGermanyScenario, value: unknown) {
  const source = asRecord(value);
  return Object.fromEntries(
    scenario.steps.map((step) => [
      step.id,
      typeof source[step.id] === "string" ? String(source[step.id]).trim().slice(0, 4_000) : "",
    ]),
  );
}

function skillForStep(kind: RealGermanyScenario["steps"][number]["kind"]): RealGermanySkill {
  if (kind === "READ") return "READING";
  if (kind === "LISTEN") return "LISTENING";
  if (kind === "FORM") return "FORM";
  return "WRITING";
}

function outputTextFromResponse(payload: unknown) {
  const response = asRecord(payload);
  if (typeof response.output_text === "string") return response.output_text;
  const output = Array.isArray(response.output) ? response.output : [];
  for (const item of output) {
    const content = Array.isArray(asRecord(item).content) ? asRecord(item).content as unknown[] : [];
    for (const part of content) {
      const record = asRecord(part);
      if (record.type === "output_text" && typeof record.text === "string") return record.text;
    }
  }
  return "";
}

function tokenize(value: string) {
  const stop = new Set(["und", "oder", "der", "die", "das", "ein", "eine", "ist", "sind", "ich", "sie", "wir", "mit", "für", "von", "zu", "am", "im", "in", "auf", "bitte"]);
  return value.toLocaleLowerCase("de-DE")
    .normalize("NFKD")
    .replace(/[^a-zäöüß0-9\s]/gu, " ")
    .split(/\s+/u)
    .filter((token) => token.length > 2 && !stop.has(token));
}

function overlapScore(response: string, reference: string) {
  const answer = new Set(tokenize(response));
  const target = new Set(tokenize(reference));
  if (!answer.size || !target.size) return 0;
  let matches = 0;
  for (const token of answer) if (target.has(token)) matches += 1;
  return Math.min(1, matches / Math.max(2, Math.min(8, target.size)));
}

function heuristicEvaluation(scenario: RealGermanyScenario, responses: Record<string, string>) {
  const bySkill = new Map<RealGermanySkill, { response: string; reference: string }>();
  for (const step of scenario.steps) {
    const skill = skillForStep(step.kind);
    bySkill.set(skill, {
      response: responses[step.id] ?? "",
      reference: [step.prompt, step.helper, scenario.vocabulary.join(" "), scenario.supportPhrases.join(" ")].filter(Boolean).join(" "),
    });
  }

  const levelTarget: Record<RealGermanyLevel, number> = { A1: 12, A2: 22, B1: 35, B2: 50 };
  const calculate = (skill: RealGermanySkill) => {
    const item = bySkill.get(skill) ?? { response: "", reference: "" };
    const words = item.response.trim() ? item.response.trim().split(/\s+/u).length : 0;
    const lengthRatio = Math.min(1, words / (skill === "WRITING" ? levelTarget[scenario.level] : 8));
    const overlap = overlapScore(item.response, item.reference);
    const structure = Math.min(1, (item.response.match(/[,.!?;:]/gu) || []).length / (skill === "WRITING" ? 3 : 1));
    return clamp(20 + lengthRatio * 38 + overlap * 32 + structure * 10);
  };

  const scores = {
    reading: calculate("READING"),
    listening: calculate("LISTENING"),
    form: calculate("FORM"),
    writing: calculate("WRITING"),
  };
  const weakAreas: RealGermanyWeakArea[] = [];
  const entries: Array<[RealGermanySkill, number, string]> = [
    ["READING", scores.reading, "Okuma ayrıntılarını çıkarma"],
    ["LISTENING", scores.listening, "Dinleme ayrıntılarını yakalama"],
    ["FORM", scores.form, "Formu eksiksiz doldurma"],
    ["WRITING", scores.writing, "Yazılı iletişim"],
  ];
  for (const [skill, score, label] of entries) {
    if (score >= 72) continue;
    weakAreas.push({
      code: skill === "READING" ? "reading_detail" : skill === "LISTENING" ? "listening_detail" : skill === "FORM" ? "form_completeness" : "task_appropriate_writing",
      label,
      skill,
      severity: score < 45 ? "HIGH" : score < 62 ? "MEDIUM" : "LOW",
      explanation: `${skillLabels[skill]} yanıtında görevin istediği bilgi veya ayrıntıların bir bölümü eksik görünüyor.`,
      excerpt: (bySkill.get(skill)?.response ?? "").slice(0, 140),
      nextReviewDays: score < 45 ? 1 : score < 62 ? 2 : 4,
    });
  }
  return {
    scores,
    feedback: {
      reading: `Okuma görevi için ${scores.reading}/100 ön puan hesaplandı.`,
      listening: `Dinleme görevi için ${scores.listening}/100 ön puan hesaplandı.`,
      form: `Form görevi için ${scores.form}/100 ön puan hesaplandı.`,
      writing: `Yazılı iletişim için ${scores.writing}/100 ön puan hesaplandı.`,
    },
    strengths: entries.filter(([, score]) => score >= 72).map(([skill]) => `${skillLabels[skill]} görevinin temel beklentilerini karşıladın.`),
    weakAreas,
    nextStep: weakAreas.length ? "Zayıf alanlarını Akıllı Tekrar kuyruğunda kısa görevlerle pekiştir." : "Benzer bir senaryoyu daha yüksek seviyede tamamlamayı dene.",
  };
}

async function requestAiEvaluation(scenario: RealGermanyScenario, responses: Record<string, string>) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY bulunamadı.");
  const model = process.env.OPENAI_REAL_GERMANY_MODEL || process.env.OPENAI_WRITING_MODEL || "gpt-5.4-mini";
  const taskPayload = scenario.steps.map((step) => ({
    skill: skillForStep(step.kind),
    title: step.title,
    source: step.prompt,
    question: step.helper ?? step.instruction,
    studentResponse: responses[step.id] ?? "",
  }));

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      input: [
        { role: "system", content: systemInstructions },
        {
          role: "user",
          content: JSON.stringify({
            level: scenario.level,
            title: scenario.title,
            category: scenario.category,
            goal: scenario.goal,
            successChecklist: scenario.successChecklist,
            vocabulary: scenario.vocabulary,
            supportPhrases: scenario.supportPhrases,
            tasks: taskPayload,
          }),
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "real_germany_evaluation",
          strict: true,
          schema: feedbackSchema,
        },
      },
      max_output_tokens: 2_400,
    }),
  });

  const payload = await response.json() as unknown;
  if (!response.ok) {
    const error = asRecord(asRecord(payload).error);
    throw new Error(cleanText(error.message, `OpenAI isteği başarısız (${response.status}).`, 500));
  }
  const output = outputTextFromResponse(payload);
  if (!output) throw new Error("AI değerlendirme çıktısı boş döndü.");
  return { model, raw: JSON.parse(output) as unknown };
}

function sanitizeEvaluation(raw: unknown, scenario: RealGermanyScenario, responses: Record<string, string>) {
  const source = asRecord(raw);
  const scoreSource = asRecord(source.scores);
  const feedbackSource = asRecord(source.feedback);
  const reading = clamp(scoreSource.reading);
  const listening = clamp(scoreSource.listening);
  const form = clamp(scoreSource.form);
  const writing = clamp(scoreSource.writing);
  const scoreMap: Record<RealGermanySkill, number> = { READING: reading, LISTENING: listening, FORM: form, WRITING: writing };
  const feedbackMap: Record<RealGermanySkill, string> = {
    READING: cleanText(feedbackSource.reading, "Okuma yanıtını görevdeki bilgiyle daha açık ilişkilendir.", 550),
    LISTENING: cleanText(feedbackSource.listening, "Dinleme mesajındaki ana bilgi ve ayrıntıları birlikte not et.", 550),
    FORM: cleanText(feedbackSource.form, "Formdaki bütün alanları kısa ve açık bilgilerle tamamla.", 550),
    WRITING: cleanText(feedbackSource.writing, "Yazılı cevabında amaç, gerekli bilgiler ve uygun kapanışı birlikte kullan.", 550),
  };
  const allStudentText = Object.values(responses).join("\n");
  const weakAreas = (Array.isArray(source.weakAreas) ? source.weakAreas : [])
    .slice(0, 8)
    .map((item): RealGermanyWeakArea | null => {
      const record = asRecord(item);
      const skill = skills.has(record.skill as RealGermanySkill) ? record.skill as RealGermanySkill : "WRITING";
      const severity = severities.has(record.severity as "LOW" | "MEDIUM" | "HIGH") ? record.severity as "LOW" | "MEDIUM" | "HIGH" : "MEDIUM";
      const rawExcerpt = cleanText(record.excerpt, "", 180);
      const excerpt = rawExcerpt && allStudentText.includes(rawExcerpt) ? rawExcerpt : "";
      return {
        code: codeSlug(record.code),
        label: cleanText(record.label, `${skillLabels[skill]} gelişim alanı`, 120),
        skill,
        severity,
        explanation: cleanText(record.explanation, "Bu öğrenme hedefini benzer bir görevle yeniden çalış.", 600),
        excerpt,
        nextReviewDays: Math.max(1, Math.min(14, Math.round(Number(record.nextReviewDays) || 3))),
      };
    })
    .filter((item): item is RealGermanyWeakArea => Boolean(item));

  const skillScores: RealGermanySkillScore[] = (["READING", "LISTENING", "FORM", "WRITING"] as RealGermanySkill[]).map((skill) => ({
    skill,
    score: scoreMap[skill],
    feedback: feedbackMap[skill],
  }));
  const strengths = (Array.isArray(source.strengths) ? source.strengths : [])
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim().slice(0, 300))
    .filter(Boolean)
    .slice(0, 5);

  return {
    scores: { reading, listening, form, writing },
    skillScores,
    strengths: strengths.length ? strengths : ["Senaryonun bütün aşamalarını tamamlayarak gerçek görev akışını denedin."],
    weakAreas,
    nextStep: cleanText(source.nextStep, "Zayıf alanlarını Akıllı Tekrar üzerinden yeniden çalış.", 500),
    overallScore: Math.round((reading + listening + form + writing) / 4),
    scenarioTitle: scenario.title,
  };
}

function comparison(previous: {
  attemptNumber: number;
  overallScore: number;
  readingScore: number;
  listeningScore: number;
  formScore: number;
  writingScore: number;
} | null, current: { overallScore: number; scores: { reading: number; listening: number; form: number; writing: number } }): RealGermanyComparison {
  return {
    previousAttemptNumber: previous?.attemptNumber ?? null,
    previousOverallScore: previous?.overallScore ?? null,
    overallDelta: previous ? current.overallScore - previous.overallScore : 0,
    readingDelta: previous ? current.scores.reading - previous.readingScore : 0,
    listeningDelta: previous ? current.scores.listening - previous.listeningScore : 0,
    formDelta: previous ? current.scores.form - previous.formScore : 0,
    writingDelta: previous ? current.scores.writing - previous.writingScore : 0,
  };
}

function difficultyValue(scenario: RealGermanyScenario) {
  return scenario.difficulty === "Yoğun" ? 5 : scenario.difficulty === "Orta" ? 4 : scenario.difficulty === "Günlük" ? 3 : 2;
}

function dateAfterDays(days: number) {
  return new Date(Date.now() + days * 86_400_000);
}

async function POSTHandler(request: Request) {
  const user = await getApiUser();
  if (!user) return NextResponse.json({ error: "Oturum gerekli." }, { status: 401 });

  let body: RealGermanyEvaluateRequest;
  try {
    body = await request.json() as RealGermanyEvaluateRequest;
  } catch {
    return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
  }

  if (!levels.has(body.level)) return NextResponse.json({ error: "Geçersiz seviye." }, { status: 400 });
  const scenario = getRealGermanyScenario(body.scenarioId);
  if (!scenario || scenario.level !== body.level) return NextResponse.json({ error: "Senaryo bulunamadı." }, { status: 404 });
  const responses = sanitizeResponses(scenario, body.responses);
  const missing = scenario.steps.filter((step) => !responses[step.id]?.trim());
  if (missing.length) return NextResponse.json({ error: `Değerlendirme için ${missing.length} adımı daha tamamlamalısın.` }, { status: 400 });

  const recentCount = await prisma.realGermanyScenarioAttempt.count({
    where: { userId: user.id, createdAt: { gte: new Date(Date.now() - 10 * 60_000) } },
  });
  if (recentCount >= 12) return NextResponse.json({ error: "On dakika içinde en fazla 12 Gerçek Almanya değerlendirmesi yapılabilir." }, { status: 429 });

  const progress = await prisma.realGermanyScenarioProgress.upsert({
    where: { userId_scenarioId: { userId: user.id, scenarioId: scenario.id } },
    create: {
      userId: user.id,
      scenarioId: scenario.id,
      level: body.level as PrismaLevel,
      status: "IN_PROGRESS",
      currentStep: Math.max(0, scenario.steps.length - 1),
      draftResponses: responses as unknown as Prisma.InputJsonValue,
      startedAt: new Date(),
    },
    update: {
      level: body.level as PrismaLevel,
      status: "IN_PROGRESS",
      currentStep: Math.max(0, scenario.steps.length - 1),
      draftResponses: responses as unknown as Prisma.InputJsonValue,
    },
  });

  const previous = await prisma.realGermanyScenarioAttempt.findFirst({
    where: { progressId: progress.id },
    orderBy: { attemptNumber: "desc" },
  });

  let evaluationMode: RealGermanyEvaluationMode = "AI";
  let model: string | null = null;
  let raw: unknown;
  try {
    const ai = await requestAiEvaluation(scenario, responses);
    model = ai.model;
    raw = ai.raw;
  } catch (error) {
    evaluationMode = "HEURISTIC_FALLBACK";
    raw = heuristicEvaluation(scenario, responses);
    console.warn("V30.2 AI değerlendirmesi kullanılamadı; güvenli ön değerlendirme uygulandı.", error);
  }

  const evaluated = sanitizeEvaluation(raw, scenario, responses);
  const compared = comparison(previous, evaluated);
  const now = new Date();
  const durationSeconds = Math.max(1, Math.min(14_400, Math.round(Number(body.durationSeconds) || 1)));
  const currentCodes = new Set(evaluated.weakAreas.map((area) => codeSlug(area.code)));
  const previousWeakAreas = Array.isArray(previous?.weakAreas) ? previous.weakAreas : [];

  const saved = await prisma.$transaction(async (tx) => {
    const attemptNumber = progress.latestAttemptNumber + 1;
    let smartReviewQueued = 0;

    for (const previousArea of previousWeakAreas) {
      const record = asRecord(previousArea);
      const code = codeSlug(record.code);
      if (currentCodes.has(code)) continue;
      await tx.learningErrorHistory.updateMany({
        where: {
          userId: user.id,
          sourceType: AssessmentSourceType.REAL_GERMANY,
          sourceId: `real-germany:${scenario.id}`,
          objectiveCode: `real_germany.${code}`,
          resolvedAt: null,
        },
        data: { resolvedAt: now, lastOccurredAt: now },
      });
    }

    for (const area of evaluated.weakAreas) {
      const code = codeSlug(area.code);
      const objectiveCode = `real_germany.${code}`;
      const nextReviewAt = dateAfterDays(area.nextReviewDays);
      const sourceId = `real-germany:${scenario.id}`;
      const error = await tx.learningErrorHistory.upsert({
        where: {
          userId_sourceType_sourceId_objectiveCode: {
            userId: user.id,
            sourceType: AssessmentSourceType.REAL_GERMANY,
            sourceId,
            objectiveCode,
          },
        },
        create: {
          userId: user.id,
          sourceType: AssessmentSourceType.REAL_GERMANY,
          sourceId,
          courseId: scenario.level.toLowerCase(),
          level: scenario.level as PrismaLevel,
          skill: skillToAssessment[area.skill],
          objectiveCode,
          topic: area.label,
          userAnswer: { excerpt: area.excerpt, attemptNumber } as unknown as Prisma.InputJsonValue,
          explanation: area.explanation,
          occurrenceCount: 1,
          metadata: {
            severity: area.severity,
            scenarioTitle: scenario.title,
            category: scenario.category,
            nextReviewAt: nextReviewAt.toISOString(),
            smartReviewEligible: true,
          },
        },
        update: {
          topic: area.label,
          skill: skillToAssessment[area.skill],
          userAnswer: { excerpt: area.excerpt, attemptNumber } as unknown as Prisma.InputJsonValue,
          explanation: area.explanation,
          occurrenceCount: { increment: 1 },
          lastOccurredAt: now,
          resolvedAt: null,
          metadata: {
            severity: area.severity,
            scenarioTitle: scenario.title,
            category: scenario.category,
            nextReviewAt: nextReviewAt.toISOString(),
            smartReviewEligible: true,
          },
        },
      });

      const penalty = area.severity === "HIGH" ? 12 : area.severity === "MEDIUM" ? 8 : 4;
      const score = area.skill === "READING" ? evaluated.scores.reading
        : area.skill === "LISTENING" ? evaluated.scores.listening
          : area.skill === "FORM" ? evaluated.scores.form
            : evaluated.scores.writing;
      await tx.competencyRecord.upsert({
        where: { userId_objectiveCode: { userId: user.id, objectiveCode } },
        create: {
          userId: user.id,
          objectiveCode,
          level: scenario.level as PrismaLevel,
          skill: skillToAssessment[area.skill],
          topic: area.label,
          mastery: Math.max(0, score - penalty),
          confidence: Math.max(20, score - 20),
          evidenceCount: 1,
          incorrectCount: 1,
          lapseCount: 1,
          sameErrorStreak: 1,
          difficulty: difficultyValue(scenario),
          stability: 0.7,
          retrievability: 0.45,
          lastEvidenceAt: now,
          nextReviewAt,
        },
        update: {
          level: scenario.level as PrismaLevel,
          skill: skillToAssessment[area.skill],
          topic: area.label,
          mastery: Math.max(0, score - penalty),
          confidence: Math.max(20, score - 20),
          evidenceCount: { increment: 1 },
          incorrectCount: { increment: 1 },
          lapseCount: { increment: 1 },
          sameErrorStreak: { increment: 1 },
          difficulty: difficultyValue(scenario),
          retrievability: 0.45,
          lastEvidenceAt: now,
          nextReviewAt,
        },
      });

      if (area.severity !== "LOW" || error.occurrenceCount >= 2) {
        await tx.adaptiveReviewAttempt.create({
          data: {
            userId: user.id,
            domain: "REAL_GERMANY",
            targetId: `${scenario.id}:${code}`,
            objectiveCode,
            sourceType: "REAL_GERMANY",
            sourceId: scenario.id,
            mode: "ERROR_REPAIR",
            rating: "REPAIR_REQUIRED",
            correct: false,
            responseMs: durationSeconds * 1_000,
            hintUsed: false,
            confidence: "UNSURE",
            difficulty: difficultyValue(scenario),
            repeatedErrorCount: error.occurrenceCount,
            signalScore: area.severity === "HIGH" ? 0.95 : area.severity === "MEDIUM" ? 0.78 : 0.6,
            nextReviewAt,
            metadata: {
              label: area.label,
              skill: area.skill,
              scenarioId: scenario.id,
              scenarioTitle: scenario.title,
              origin: "V30.2_REAL_GERMANY",
            },
          },
        });
        smartReviewQueued += 1;
      }
    }

    for (const skillScore of evaluated.skillScores) {
      await tx.assessmentEvidence.create({
        data: {
          userId: user.id,
          sourceType: AssessmentSourceType.REAL_GERMANY,
          sourceId: `${scenario.id}:${skillScore.skill}:${attemptNumber}`,
          courseId: scenario.level.toLowerCase(),
          level: scenario.level as PrismaLevel,
          skill: skillToAssessment[skillScore.skill],
          difficulty: difficultyValue(scenario),
          cognitiveLevel: CognitiveLevel.APPLY,
          objectiveCodes: [`real_germany.${skillScore.skill.toLowerCase()}`],
          topicTags: [scenario.category, ...scenario.tags],
          correct: skillScore.score >= 70,
          answer: responses as unknown as Prisma.InputJsonValue,
          explanation: skillScore.feedback,
          responseMs: durationSeconds * 1_000,
          attemptNumber,
          pointsPossible: 100,
          pointsEarned: skillScore.score,
        },
      });
    }

    const attempt = await tx.realGermanyScenarioAttempt.create({
      data: {
        progressId: progress.id,
        userId: user.id,
        scenarioId: scenario.id,
        level: scenario.level as PrismaLevel,
        attemptNumber,
        status: "COMPLETED",
        responses: responses as unknown as Prisma.InputJsonValue,
        skillScores: evaluated.skillScores as unknown as Prisma.InputJsonValue,
        overallScore: evaluated.overallScore,
        readingScore: evaluated.scores.reading,
        listeningScore: evaluated.scores.listening,
        formScore: evaluated.scores.form,
        writingScore: evaluated.scores.writing,
        comparison: compared as unknown as Prisma.InputJsonValue,
        weakAreas: evaluated.weakAreas as unknown as Prisma.InputJsonValue,
        feedback: {
          strengths: evaluated.strengths,
          nextStep: evaluated.nextStep,
          scenarioTitle: scenario.title,
        } as unknown as Prisma.InputJsonValue,
        smartReviewQueued,
        evaluationMode,
        aiModel: model,
      },
    });

    await tx.realGermanyScenarioProgress.update({
      where: { id: progress.id },
      data: {
        status: "COMPLETED",
        currentStep: Math.max(0, scenario.steps.length - 1),
        draftResponses: responses as unknown as Prisma.InputJsonValue,
        latestAttemptNumber: attemptNumber,
        latestOverallScore: evaluated.overallScore,
        bestOverallScore: Math.max(progress.bestOverallScore, evaluated.overallScore),
        completedCount: { increment: 1 },
        lastAttemptAt: now,
        completedAt: now,
      },
    });

    await tx.dailyStudyPlan.deleteMany({ where: { userId: user.id, planDate: { gte: now.toISOString().slice(0, 10) } } });
    await tx.userActivityEvent.create({
      data: {
        id: randomUUID(),
        userId: user.id,
        eventType: attemptNumber > 1 ? "REAL_GERMANY_RETRIED" : "REAL_GERMANY_COMPLETED",
        courseId: scenario.level.toLowerCase(),
        itemId: scenario.id,
        metadata: {
          attemptNumber,
          overallScore: evaluated.overallScore,
          readingScore: evaluated.scores.reading,
          listeningScore: evaluated.scores.listening,
          formScore: evaluated.scores.form,
          writingScore: evaluated.scores.writing,
          smartReviewQueued,
          evaluationMode,
        },
        createdAt: now,
      },
    });

    return { attempt, attemptNumber, smartReviewQueued };
  });

  const result: RealGermanyEvaluationResult = {
    attemptId: saved.attempt.id,
    attemptNumber: saved.attemptNumber,
    scenarioId: scenario.id,
    overallScore: evaluated.overallScore,
    readingScore: evaluated.scores.reading,
    listeningScore: evaluated.scores.listening,
    formScore: evaluated.scores.form,
    writingScore: evaluated.scores.writing,
    skillScores: evaluated.skillScores,
    strengths: evaluated.strengths,
    weakAreas: evaluated.weakAreas,
    nextStep: evaluated.nextStep,
    comparison: compared,
    smartReviewQueued: saved.smartReviewQueued,
    evaluationMode,
    aiModel: model,
    createdAt: saved.attempt.createdAt.toISOString(),
  };

  return NextResponse.json({ result });
}

export const POST = withApiMonitoring("/api/real-germany/evaluate", POSTHandler);
