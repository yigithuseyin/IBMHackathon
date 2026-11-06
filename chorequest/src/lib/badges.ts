import { prisma } from "@/lib/prisma";

/**
 * Called after every scoring event (chore completion/approval).
 * Checks milestone and behaviour badges and upserts any that are newly earned.
 */
export async function checkAndAwardBadges(
  userId: string,
  householdId: string
): Promise<void> {
  // Fetch data in parallel
  const [completionCount, earlyCount, user, streak, existingBadges] =
    await Promise.all([
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
      prisma.userBadge.findMany({
        where: { userId, householdId },
        select: { badge: { select: { name: true } } },
      }),
    ]);

  const totalPoints = user?.totalPoints ?? 0;
  const currentStreak = streak?.currentStreak ?? 0;
  const awardedNames = new Set(existingBadges.map((ub) => ub.badge.name));

  // Build list of badge names this user qualifies for
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

  // Only process names not already awarded
  const newNames = qualifiedNames.filter((n) => !awardedNames.has(n));
  if (newNames.length === 0) return;

  // Fetch badge records for the new ones
  const badges = await prisma.badge.findMany({
    where: { name: { in: newNames } },
    select: { id: true, name: true },
  });

  // Upsert a UserBadge for each
  await Promise.all(
    badges.map((badge) =>
      prisma.userBadge.upsert({
        where: {
          // UserBadge has no unique constraint on (userId, badgeId, householdId),
          // so we use findFirst + create pattern via upsert on id (always new id path)
          // Fall back to create if the record doesn't exist yet.
          id: "never-matches",
        },
        update: {},
        create: {
          userId,
          badgeId: badge.id,
          householdId,
        },
      }).catch(async () => {
        // If upsert fails, try a plain create (ignore duplicate errors)
        await prisma.userBadge
          .create({ data: { userId, badgeId: badge.id, householdId } })
          .catch(() => {});
      })
    )
  );
}

/**
 * Called on household page load to apply/remove temporary badges for all members.
 */
export async function applyTemporaryBadges(householdId: string): Promise<void> {
  const members = await prisma.householdMember.findMany({
    where: { householdId },
    select: { userId: true },
  });

  const [overdueBadge, slackerBadge] = await Promise.all([
    prisma.badge.findUnique({ where: { name: "Overdue ⚠️" }, select: { id: true } }),
    prisma.badge.findUnique({ where: { name: "Slacker 😴" }, select: { id: true } }),
  ]);

  if (!overdueBadge || !slackerBadge) return;

  const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);

  await Promise.all(
    members.map(async ({ userId }) => {
      // --- Overdue badge ---
      const overdueCount = await prisma.chore.count({
        where: {
          householdId,
          assignedToId: userId,
          status: "OVERDUE",
        },
      });

      if (overdueCount > 0) {
        await prisma.userBadge.upsert({
          where: { id: "never-matches" },
          update: {},
          create: { userId, badgeId: overdueBadge.id, householdId },
        }).catch(async () => {
          await prisma.userBadge
            .create({ data: { userId, badgeId: overdueBadge.id, householdId } })
            .catch(() => {});
        });
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

      const hasPendingChore = await prisma.chore.count({
        where: { householdId, assignedToId: userId, status: "PENDING" },
      });

      if (!recentCompletion && hasPendingChore > 0) {
        await prisma.userBadge.upsert({
          where: { id: "never-matches" },
          update: {},
          create: { userId, badgeId: slackerBadge.id, householdId },
        }).catch(async () => {
          await prisma.userBadge
            .create({ data: { userId, badgeId: slackerBadge.id, householdId } })
            .catch(() => {});
        });
      } else {
        await prisma.userBadge.deleteMany({
          where: { userId, badgeId: slackerBadge.id, householdId },
        });
      }
    })
  );
}
