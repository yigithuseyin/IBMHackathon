import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const BADGE_TYPE_LABELS: Record<string, string> = {
  MILESTONE: "Milestone",
  BEHAVIOUR: "Behaviour",
  CUSTOM: "Custom",
  TEMPORARY: "Temporary",
};

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/login");
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
        orderBy: { awardedAt: "desc" },
      },
      streaks: {
        select: {
          householdId: true,
          currentStreak: true,
          longestStreak: true,
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
    redirect("/login");
  }

  const totalChoresCompleted = user.completions.length;
  const longestStreakEver = user.streaks.reduce(
    (max, s) => Math.max(max, s.longestStreak),
    0
  );
  const badgesEarned = user.badges.length;

  // Per-household stats
  const householdStats = user.households.map((hm) => {
    const hid = hm.householdId;
    const hCompletions = user.completions.filter((c) => c.householdId === hid);
    const streak = user.streaks.find((s) => s.householdId === hid);
    return {
      householdId: hid,
      householdName: hm.household.name,
      points: hCompletions.reduce((sum, c) => sum + c.pointsAwarded, 0),
      choresCompleted: hCompletions.length,
      currentStreak: streak?.currentStreak ?? 0,
      longestStreak: streak?.longestStreak ?? 0,
    };
  });

  // Group badges by type
  const badgesByType: Record<string, typeof user.badges> = {};
  for (const ub of user.badges) {
    const type = ub.badge.type;
    if (!badgesByType[type]) badgesByType[type] = [];
    badgesByType[type].push(ub);
  }

  const statCards = [
    { label: "Total Points", value: user.totalPoints.toLocaleString() },
    { label: "Chores Completed", value: totalChoresCompleted.toLocaleString() },
    {
      label: "Longest Streak",
      value: longestStreakEver > 0 ? `${longestStreakEver} days` : "—",
    },
    { label: "Households", value: user.households.length.toLocaleString() },
  ];

  return (
    <div className="max-w-2xl mx-auto">
      {/* Avatar + name */}
      <div className="flex items-center gap-5 mb-8">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl font-bold flex-shrink-0"
          style={{ backgroundColor: user.avatarColour }}
        >
          {user.name.charAt(0).toUpperCase()}
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{user.name}</h1>
          <p className="text-sm text-gray-500">{user.email}</p>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
        {statCards.map((stat) => (
          <div
            key={stat.label}
            className="bg-white rounded-xl border border-gray-200 p-4 text-center"
          >
            <div className="text-2xl font-bold text-indigo-600">
              {stat.value}
            </div>
            <div className="text-xs text-gray-500 mt-1">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Household Breakdown */}
      {householdStats.length > 0 && (
        <div className="mb-10">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Household Breakdown
          </h2>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">
                    Household
                  </th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-600">
                    Points
                  </th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-600">
                    Chores
                  </th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-600">
                    Streak
                  </th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-600">
                    Best Streak
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {householdStats.map((hs) => (
                  <tr key={hs.householdId} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {hs.householdName}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-700">
                      {hs.points.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-700">
                      {hs.choresCompleted}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-700">
                      {hs.currentStreak > 0 ? `🔥 ${hs.currentStreak}` : "—"}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-700">
                      {hs.longestStreak > 0 ? `${hs.longestStreak} days` : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Badges */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          My Badges {badgesEarned > 0 && `(${badgesEarned})`}
        </h2>

        {badgesEarned === 0 ? (
          <p className="text-sm text-gray-500">
            No badges earned yet. Complete chores to earn your first badge!
          </p>
        ) : (
          <div className="space-y-6">
            {Object.entries(badgesByType).map(([type, badges]) => (
              <div key={type}>
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                  {BADGE_TYPE_LABELS[type] ?? type}
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {badges.map((ub) => (
                    <div
                      key={ub.id}
                      className={`bg-white rounded-xl border p-4 flex flex-col gap-1 ${
                        ub.badge.isNegative
                          ? "border-red-200 bg-red-50"
                          : "border-gray-200"
                      }`}
                    >
                      <div className="text-2xl">{ub.badge.icon}</div>
                      <div className="font-medium text-gray-900 text-sm">
                        {ub.badge.name}
                      </div>
                      {ub.household && (
                        <div className="text-xs text-gray-500">
                          {ub.household.name}
                        </div>
                      )}
                      <div className="text-xs text-gray-400">
                        {new Date(ub.awardedAt).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
