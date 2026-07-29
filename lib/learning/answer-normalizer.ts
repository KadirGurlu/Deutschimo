export function normalizeAnswer(value: unknown): string {
  if (typeof value === "boolean") return value ? "true" : "false";
  if (Array.isArray(value)) return value.map(normalizeAnswer).sort().join("|");
  return String(value ?? "")
    .trim()
    .toLocaleLowerCase("de-DE")
    .replace(/[.!?;,:'\"()]/g, "")
    .replace(/\s+/g, " ");
}

export function answersMatch(answer: unknown, correctAnswer: unknown, acceptedAnswers: string[] = []): boolean {
  const normalized = normalizeAnswer(answer);
  const accepted = [correctAnswer, ...acceptedAnswers].map(normalizeAnswer);
  return accepted.includes(normalized);
}
