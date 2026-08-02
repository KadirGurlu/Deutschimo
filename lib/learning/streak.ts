export type StudyStreak = {
  current: number;
  best: number;
  activeDays: number;
  lastActiveDate?: string;
};

function localDayKey(value: string | Date) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function dateFromDayKey(key: string) {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function previousDayKey(key: string) {
  const date = dateFromDayKey(key);
  date.setDate(date.getDate() - 1);
  return localDayKey(date)!;
}

export function calculateStudyStreak(
  values: Array<string | Date | null | undefined>,
  now: Date = new Date(),
): StudyStreak {
  const uniqueDays = [...new Set(values.map((value) => value ? localDayKey(value) : null).filter((value): value is string => Boolean(value)))];
  uniqueDays.sort((a, b) => a.localeCompare(b));

  if (!uniqueDays.length) return { current: 0, best: 0, activeDays: 0 };

  let best = 1;
  let running = 1;
  for (let index = 1; index < uniqueDays.length; index += 1) {
    if (uniqueDays[index - 1] === previousDayKey(uniqueDays[index])) {
      running += 1;
      best = Math.max(best, running);
    } else {
      running = 1;
    }
  }

  const todayKey = localDayKey(now)!;
  const yesterdayKey = previousDayKey(todayKey);
  const latest = uniqueDays.at(-1)!;
  let current = 0;

  if (latest === todayKey || latest === yesterdayKey) {
    current = 1;
    let cursor = latest;
    for (let index = uniqueDays.length - 2; index >= 0; index -= 1) {
      const expected = previousDayKey(cursor);
      if (uniqueDays[index] !== expected) break;
      current += 1;
      cursor = uniqueDays[index];
    }
  }

  return {
    current,
    best,
    activeDays: uniqueDays.length,
    lastActiveDate: latest,
  };
}
