import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Params = { params: { id: string } };

export async function GET(_req: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const membership = await prisma.householdMember.findUnique({
    where: {
      householdId_userId: {
        householdId: params.id,
        userId: session.user.id,
      },
    },
  });
  if (!membership) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const members = await prisma.householdMember.findMany({
    where: { householdId: params.id },
    select: {
      user: {
        select: {
          id: true,
          name: true,
          avatarColour: true,
          totalPoints: true,
          streaks: {
            where: { householdId: params.id },
            select: { currentStreak: true, longestStreak: true },
          },
          badges: {
            where: { householdId: params.id },
            select: { id: true },
          },
        },
      },
    },
    orderBy: { user: { totalPoints: "desc" } },
  });

  const data = members.map((m, index) => {
    const streak = m.user.streaks[0];
    return {
      rank: index + 1,
      userId: m.user.id,
      name: m.user.name,
      avatarColour: m.user.avatarColour,
      totalPoints: m.user.totalPoints,
      currentStreak: streak?.currentStreak ?? 0,
      longestStreak: streak?.longestStreak ?? 0,
      badgeCount: m.user.badges.length,
    };
  });

  return NextResponse.json({ data });
}
