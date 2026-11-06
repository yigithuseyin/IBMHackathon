import { Card } from "@/components/ui/Card";

type Props = {
  member: {
    id: string;
    name: string;
    avatarColour: string;
    totalPoints: number;
  };
  householdId: string;
};

export function MemberCard({ member }: Props) {
  const initial = member.name.charAt(0).toUpperCase();

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
      <p className="text-gray-400 text-xs">(0 badges)</p>
    </Card>
  );
}
