import { prisma } from "@/lib/prisma";

/** Idempotently create a UserBadge record if it doesn't already exist. */
async function ensureUserBadge(
  userId: string,
  badgeId: string,
  householdId: string
): Promise<void> {
  const existing = await prisma.userBadge.findFirst({
    where: { userId, badgeId, householdId },
    select: { id: true },
  });
  if (existing) return;
  await prisma.userBadge.create({
    data: { userId, badgeId, householdId },
  });
}

/**
 * Called after every scoring event (chore completion/approval).
 * Checks milestone and behaviour badges and awards any that are newly earned.
 */
export async function checkAndAwardBadges(
  userId: string,
  householdId: string
): Promise<void> {
  const [completionCount, earlyCount, user, streak] = await Promise.all([
    prisma.choreCompletion.count({
      where: { completedByUserId: userId, householdId },
    }),
    prisma.choreCompletion.count({
      where: { completedByUserId: userId, householdId, wasEarly: true },
    }),
    prisma.user.findUnique({
      where: { id: userId },
      select: { totalPoints: true },
    }),
    prisma.userStreak.findUnique({
      where: { userId_householdId: { userId, householdId } },
      select: { currentStreak: true },
    }),
  ]);

  const totalPoints = user?.totalPoints ?? 0;
  const currentStreak = streak?.currentStreak ?? 0;

  // Build list of badge names this user now qualifies for
  const qualifiedNames: string[] = [];
  if (completionCount >= 1) qualifiedNames.push("First Step 🌟");
  if (completionCount >= 10) qualifiedNames.push("Getting Started 🚀");
  if (completionCount >= 50) qualifiedNames.push("Chore Champion 👑");
  if (totalPoints >= 100) qualifiedNames.push("Century 💯");
  if (totalPoints >= 500) qualifiedNames.push("High Scorer 🏆");
  if (totalPoints >= 1000) qualifiedNames.push("Centurion ⚔️");
  if (currentStreak >= 3) qualifiedNames.push("On a Roll 🔥");
  if (currentStreak >= 7) qualifiedNames.push("Hot Streak 🌶️");
  if (currentStreak >= 14) qualifiedNames.push("Unstoppable ⚡");
  if (earlyCount >= 5) qualifiedNames.push("Early Bird 🐦");

  if (qualifiedNames.length === 0) return;

  // Fetch badge IDs and existing UserBadge records in parallel
  const [badges, existingBadges] = await Promise.all([
    prisma.badge.findMany({
      where: { name: { in: qualifiedNames } },
      select: { id: true, name: true },
    }),
    prisma.userBadge.findMany({
      where: { userId, householdId },
      select: { badgeId: true },
    }),
  ]);

  const awardedBadgeIds = new Set(existingBadges.map((ub) => ub.badgeId));

  await Promise.all(
    badges
      .filter((b) => !awardedBadgeIds.has(b.id))
      .map((b) =>
        prisma.userBadge
          .create({ data: { userId, badgeId: b.id, householdId } })
          .catch(() => {
            // Swallow duplicate errors (race condition safety)
          })
      )
  );
}

/**
 * Called on household page load to apply/remove temporary badges for all members.
 * Manages "Overdue ⚠️" and "Slacker 😴" badges only.
 * "Exempt 🛡️" is managed separately in the member management route.
 */
export async function applyTemporaryBadges(householdId: string): Promise<void> {
  const members = await prisma.householdMember.findMany({
    where: { householdId },
    select: { userId: true },
  });

  const [overdueBadge, slackerBadge] = await Promise.all([
    prisma.badge.findUnique({
      where: { name: "Overdue ⚠️" },
      select: { id: true },
    }),
    prisma.badge.findUnique({
      where: { name: "Slacker 😴" },
      select: { id: true },
    }),
  ]);

  if (!overdueBadge || !slackerBadge) return;

  const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);

  await Promise.all(
    members.map(async ({ userId }) => {
      // --- Overdue badge ---
      const overdueCount = await prisma.chore.count({
        where: { householdId, assignedToId: userId, status: "OVERDUE" },
      });

      if (overdueCount > 0) {
        await ensureUserBadge(userId, overdueBadge.id, householdId);
      } else {
        await prisma.userBadge.deleteMany({
          where: { userId, badgeId: overdueBadge.id, householdId },
        });
      }

      // --- Slacker badge ---
      const recentCompletion = await prisma.choreCompletion.findFirst({
        where: {
          completedByUserId: userId,
          householdId,
          completedAt: { gte: threeDaysAgo },
        },
        select: { id: true },
      });

      const pendingChoreCount = await prisma.chore.count({
        where: { householdId, assignedToId: userId, status: "PENDING" },
      });

      if (!recentCompletion && pendingChoreCount > 0) {
        await ensureUserBadge(userId, slackerBadge.id, householdId);
      } else {
        await prisma.userBadge.deleteMany({
          where: { userId, badgeId: slackerBadge.id, householdId },
        });
      }
    })
  );
}
