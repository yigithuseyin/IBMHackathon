import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Leaderboard } from "@/components/Leaderboard";
import type { LeaderboardEntry } from "@/components/Leaderboard";

type Props = { params: { id: string } };

export default async function LeaderboardPage({ params }: Props) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/login");
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
    notFound();
  }

  const household = await prisma.household.findUnique({
    where: { id: params.id },
    select: { id: true, name: true },
  });
  if (!household) {
    notFound();
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
            select: { currentStreak: true },
          },
          badges: {
            where: { householdId: params.id },
            select: {
              id: true,
              badge: {
                select: { icon: true, name: true, isNegative: true },
              },
            },
            orderBy: { awardedAt: "desc" },
          },
        },
      },
    },
    orderBy: { user: { totalPoints: "desc" } },
  });

  const entries: LeaderboardEntry[] = members.map((m, index) => {
    const streak = m.user.streaks[0];
    return {
      rank: index + 1,
      userId: m.user.id,
      name: m.user.name,
      avatarColour: m.user.avatarColour,
      totalPoints: m.user.totalPoints,
      currentStreak: streak?.currentStreak ?? 0,
      badgeCount: m.user.badges.length,
      topBadges: m.user.badges.slice(0, 3).map((ub) => ({
        icon: ub.badge.icon,
        name: ub.badge.name,
        isNegative: ub.badge.isNegative,
      })),
    };
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link
            href={`/households/${params.id}`}
            className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
          >
            ← Back to Household
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 mt-1">
            Leaderboard — {household.name}
          </h1>
        </div>
        <p className="text-xs text-gray-400">Last updated: now</p>
      </div>

      <Leaderboard entries={entries} currentUserId={session.user.id} />
    </div>
  );
}
