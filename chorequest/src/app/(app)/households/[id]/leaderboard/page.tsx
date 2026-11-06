import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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

  const rows = members.map((m, index) => {
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

  const rankMedal = (rank: number) => {
    if (rank === 1) return "🥇";
    if (rank === 2) return "🥈";
    if (rank === 3) return "🥉";
    return `#${rank}`;
  };

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
            {household.name} — Leaderboard
          </h1>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-gray-600 w-16">
                Rank
              </th>
              <th className="px-4 py-3 text-left font-semibold text-gray-600">
                Member
              </th>
              <th className="px-4 py-3 text-right font-semibold text-gray-600">
                Points
              </th>
              <th className="px-4 py-3 text-right font-semibold text-gray-600">
                Streak
              </th>
              <th className="px-4 py-3 text-right font-semibold text-gray-600">
                Badges
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map((row) => {
              const isCurrentUser = row.userId === session.user.id;
              return (
                <tr
                  key={row.userId}
                  className={
                    isCurrentUser
                      ? "bg-indigo-50 font-semibold"
                      : "hover:bg-gray-50"
                  }
                >
                  <td className="px-4 py-3 text-gray-700 font-medium">
                    {rankMedal(row.rank)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                        style={{ backgroundColor: row.avatarColour }}
                      >
                        {row.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-gray-900">
                        {row.name}
                        {isCurrentUser && (
                          <span className="ml-2 text-xs text-indigo-600 font-medium">
                            (you)
                          </span>
                        )}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right text-gray-900">
                    {row.totalPoints.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-700">
                    {row.currentStreak > 0 ? `🔥 ${row.currentStreak}` : "—"}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-700">
                    {row.badgeCount > 0 ? `🏅 ${row.badgeCount}` : "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
