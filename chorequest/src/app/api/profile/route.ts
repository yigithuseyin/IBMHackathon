import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      avatarColour: true,
      totalPoints: true,
      completions: {
        where: { completedByUserId: userId },
        select: { id: true, householdId: true, pointsAwarded: true },
      },
      badges: {
        select: {
          id: true,
          awardedAt: true,
          householdId: true,
          badge: {
            select: {
              name: true,
              icon: true,
              type: true,
              isNegative: true,
            },
          },
          household: {
            select: { name: true },
          },
        },
      },
      streaks: {
        select: {
          householdId: true,
          currentStreak: true,
          longestStreak: true,
          household: { select: { name: true } },
        },
      },
      households: {
        select: {
          householdId: true,
          household: { select: { name: true } },
        },
      },
    },
  });

  if (!user) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const totalChoresCompleted = user.completions.length;
  const longestStreakEver = user.streaks.reduce(
    (max, s) => Math.max(max, s.longestStreak),
    0
  );

  // Build per-household stats
  const householdStats = user.households.map((hm) => {
    const hid = hm.householdId;
    const householdCompletions = user.completions.filter(
      (c) => c.householdId === hid
    );
    const streak = user.streaks.find((s) => s.householdId === hid);
    return {
      householdId: hid,
      householdName: hm.household.name,
      points: householdCompletions.reduce((sum, c) => sum + c.pointsAwarded, 0),
      choresCompleted: householdCompletions.length,
      currentStreak: streak?.currentStreak ?? 0,
      longestStreak: streak?.longestStreak ?? 0,
    };
  });

  const allBadges = user.badges.map((ub) => ({
    id: ub.id,
    icon: ub.badge.icon,
    name: ub.badge.name,
    type: ub.badge.type,
    isNegative: ub.badge.isNegative,
    householdName: ub.household?.name ?? null,
    awardedAt: ub.awardedAt,
  }));

  return NextResponse.json({
    data: {
      name: user.name,
      email: user.email,
      avatarColour: user.avatarColour,
      totalPoints: user.totalPoints,
      totalChoresCompleted,
      longestStreakEver,
      allBadges,
      householdStats,
    },
  });
}
