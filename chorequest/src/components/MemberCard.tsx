import { Card } from "@/components/ui/Card";

type BadgeSummary = {
  icon: string;
  name: string;
  isNegative: boolean;
};

type Props = {
  member: {
    id: string;
    name: string;
    avatarColour: string;
    totalPoints: number;
  };
  householdId: string;
  badges?: BadgeSummary[];
};

export function MemberCard({ member, badges = [] }: Props) {
  const initial = member.name.charAt(0).toUpperCase();
  const displayed = badges.slice(0, 3);
  const overflow = badges.length - displayed.length;

  return (
    <Card className="flex flex-col items-center gap-2 py-6">
      <div
        className="w-14 h-14 rounded-full flex items-center justify-center text-white text-xl font-bold"
        style={{ backgroundColor: member.avatarColour }}
      >
        {initial}
      </div>
      <p className="font-semibold text-gray-900 text-sm text-center">{member.name}</p>
      <p className="text-indigo-600 text-sm font-medium">{member.totalPoints} pts</p>

      {badges.length > 0 ? (
        <div className="flex items-center gap-1 flex-wrap justify-center">
          {displayed.map((badge, idx) => (
            <span
              key={idx}
              title={badge.name}
              className={`text-base leading-none ${
                badge.isNegative
                  ? "bg-red-100 rounded px-0.5"
                  : "bg-gray-100 rounded px-0.5"
              }`}
            >
              {badge.icon}
            </span>
          ))}
          {overflow > 0 && (
            <span className="text-xs text-gray-500 font-medium">
              +{overflow}
            </span>
          )}
        </div>
      ) : (
        <p className="text-gray-400 text-xs">No badges yet</p>
      )}
    </Card>
  );
}
