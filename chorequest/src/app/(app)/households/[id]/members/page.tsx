import { redirect, notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/permissions";
import { MemberRow } from "@/components/MemberRow";

type Props = { params: { id: string } };

export default async function MembersPage({ params }: Props) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/login");
  }

  const requesterMembership = await prisma.householdMember.findUnique({
    where: {
      householdId_userId: {
        householdId: params.id,
        userId: session.user.id,
      },
    },
  });
  if (!requesterMembership) {
    notFound();
  }

  const household = await prisma.household.findUnique({
    where: { id: params.id },
    select: { id: true, name: true },
  });
  if (!household) {
    notFound();
  }

  // Fetch members directly via prisma (server component — no HTTP round-trip needed)
  const members = await prisma.householdMember.findMany({
    where: { householdId: params.id },
    select: {
      id: true,
      role: true,
      permissions: true,
      isExempt: true,
      joinedAt: true,
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          avatarColour: true,
          totalPoints: true,
          badges: {
            where: { householdId: params.id },
            select: { id: true },
          },
        },
      },
    },
    orderBy: { joinedAt: "asc" },
  });

  const canManage = hasPermission(requesterMembership, "canManageMembers");

  const membersWithBadgeCount = members.map((m) => ({
    ...m,
    badgesCount: m.user.badges.length,
    user: {
      id: m.user.id,
      name: m.user.name,
      email: m.user.email,
      avatarColour: m.user.avatarColour,
      totalPoints: m.user.totalPoints,
    },
  }));

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{household.name}</h1>
        <p className="text-sm text-gray-500 mt-1">Members</p>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                  Avatar
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Permissions
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                  Exempt
                </th>
                {canManage && (
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                    Remove
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {membersWithBadgeCount.map((m) => (
                <MemberRow
                  key={m.id}
                  member={m}
                  householdId={params.id}
                  canManage={canManage}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
