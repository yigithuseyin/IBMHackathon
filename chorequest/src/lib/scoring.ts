export type ScoreInput = {
  basePoints: number;
  difficulty: string; // "EASY" | "MEDIUM" | "HARD"
  dueDate: Date | null;
  completedAt: Date;
  currentStreak: number; // streak BEFORE this completion
  isExempt: boolean;
};

export type ScoreResult = {
  finalPoints: number;
  wasLate: boolean;
  wasEarly: boolean;
};

export function calculatePoints(input: ScoreInput): ScoreResult {
  const { basePoints, difficulty, dueDate, completedAt, currentStreak, isExempt } = input;

  if (isExempt) {
    return { finalPoints: 0, wasLate: false, wasEarly: false };
  }

  const difficultyMultiplier =
    difficulty === "HARD" ? 2.0 : difficulty === "MEDIUM" ? 1.5 : 1.0;

  const streakMultiplier = 1 + 0.1 * Math.min(currentStreak, 10);

  let wasEarly = false;
  let wasLate = false;

  if (dueDate !== null) {
    const earlyThreshold = new Date(dueDate.getTime() - 24 * 60 * 60 * 1000);
    wasEarly = completedAt < earlyThreshold;
    wasLate = completedAt > dueDate;
  }

  const earlyBonus = wasEarly ? Math.floor(basePoints * 0.2) : 0;
  const latePenalty = wasLate ? Math.floor(basePoints * 0.25) : 0;

  const finalPoints = Math.max(
    1,
    Math.floor(basePoints * difficultyMultiplier * streakMultiplier) +
      earlyBonus -
      latePenalty
  );

  return { finalPoints, wasLate, wasEarly };
}
