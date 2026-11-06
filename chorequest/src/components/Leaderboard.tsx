export type LeaderboardEntry = {
  rank: number;
  userId: string;
  name: string;
  avatarColour: string;
  totalPoints: number;
  badgeCount: number;
  currentStreak: number;
  topBadges: { icon: string; name: string; isNegative: boolean }[];
};

type Props = { entries: LeaderboardEntry[]; currentUserId?: string };

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) {
    return (
      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-yellow-400 text-white text-xs font-bold">
        1
      </span>
    );
  }
  if (rank === 2) {
    return (
      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gray-400 text-white text-xs font-bold">
        2
      </span>
    );
  }
  if (rank === 3) {
    return (
      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-amber-600 text-white text-xs font-bold">
        3
      </span>
    );
  }
  return (
    <span className="inline-flex items-center justify-center w-8 h-8 text-sm font-medium text-gray-500">
      {rank}
    </span>
  );
}

export function Leaderboard({ entries, currentUserId }: Props) {
  if (entries.length === 0) {
    return (
      <p className="text-sm text-gray-500 py-8 text-center">
        No members yet.
      </p>
    );
  }

  return (
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
            <th className="px-4 py-3 text-left font-semibold text-gray-600 hidden sm:table-cell">
              Badges
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {entries.map((entry) => {
            const isCurrentUser = entry.userId === currentUserId;
            return (
              <tr
                key={entry.userId}
                className={
                  isCurrentUser ? "bg-indigo-50" : "hover:bg-gray-50"
                }
              >
                <td className="px-4 py-3">
                  <RankBadge rank={entry.rank} />
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                      style={{ backgroundColor: entry.avatarColour }}
                    >
                      {entry.name.charAt(0).toUpperCase()}
                    </div>
                    <span
                      className={
                        isCurrentUser
                          ? "font-semibold text-indigo-700"
                          : "text-gray-900"
                      }
                    >
                      {entry.name}
                      {isCurrentUser && (
                        <span className="ml-2 text-xs text-indigo-500 font-medium">
                          (you)
                        </span>
                      )}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3 text-right font-medium text-gray-900">
                  ★ {entry.totalPoints.toLocaleString()}
                </td>
                <td className="px-4 py-3 text-right text-gray-700">
                  {entry.currentStreak > 0
                    ? `🔥 ${entry.currentStreak}`
                    : "—"}
                </td>
                <td className="px-4 py-3 hidden sm:table-cell">
                  {entry.topBadges.length > 0 ? (
                    <div className="flex items-center gap-1">
                      {entry.topBadges.map((b, idx) => (
                        <span
                          key={idx}
                          title={b.name}
                          className={`text-base leading-none px-0.5 rounded ${
                            b.isNegative ? "bg-red-100" : "bg-gray-100"
                          }`}
                        >
                          {b.icon}
                        </span>
                      ))}
                      {entry.badgeCount > entry.topBadges.length && (
                        <span className="text-xs text-gray-400 font-medium">
                          +{entry.badgeCount - entry.topBadges.length}
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-gray-400">—</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
