import { prisma } from "@/lib/prisma";

export async function updateStreak(
  userId: string,
  householdId: string,
  completedAt: Date
): Promise<number> {
  const existing = await prisma.userStreak.findUnique({
    where: { userId_householdId: { userId, householdId } },
  });

  let currentStreak = existing?.currentStreak ?? 0;
  const longestStreak = existing?.longestStreak ?? 0;
  const lastCompletionDate = existing?.lastCompletionDate ?? null;

  if (lastCompletionDate === null) {
    currentStreak = 1;
  } else {
    const gapMs = completedAt.getTime() - lastCompletionDate.getTime();
    const gapHours = gapMs / (1000 * 60 * 60);

    if (gapHours > 48) {
      // Gap too large — reset streak
      currentStreak = 1;
    } else if (gapHours >= 1) {
      // Normal next completion — increment streak
      currentStreak = currentStreak + 1;
    }
    // else gapHours < 1: rapid same-session completions — keep streak as-is
  }

  const newLongest = Math.max(currentStreak, longestStreak);

  await prisma.userStreak.upsert({
    where: { userId_householdId: { userId, householdId } },
    create: {
      userId,
      householdId,
      currentStreak,
      longestStreak: newLongest,
      lastCompletionDate: completedAt,
    },
    update: {
      currentStreak,
      longestStreak: newLongest,
      lastCompletionDate: completedAt,
    },
  });

  return currentStreak;
}
