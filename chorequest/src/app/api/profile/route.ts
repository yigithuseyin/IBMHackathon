import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      avatarColour: true,
      totalPoints: true,
      completions: {
        where: { completedByUserId: session.user.id },
        select: { id: true },
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
        select: { longestStreak: true },
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
  const badgesEarned = user.badges.length;

  return NextResponse.json({
    data: {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatarColour: user.avatarColour,
        totalPoints: user.totalPoints,
      },
      stats: {
        totalChoresCompleted,
        totalPointsAllTime: user.totalPoints,
        longestStreakEver,
        badgesEarned,
      },
      badges: user.badges,
    },
  });
}
