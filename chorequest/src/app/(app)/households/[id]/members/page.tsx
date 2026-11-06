import { redirect, notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { InviteCodeCopy } from "@/components/InviteCodeCopy";
import { MemberManagement } from "@/components/MemberManagement";

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
    select: { id: true, name: true, inviteCode: true },
  });
  if (!household) {
    notFound();
  }

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

  const membersData = members.map((m) => ({
    id: m.id,
    role: m.role,
    permissions: m.permissions,
    isExempt: m.isExempt,
    joinedAt: m.joinedAt.toISOString(),
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
        <h1 className="text-2xl font-bold text-gray-900">
          Members — {household.name}
        </h1>
      </div>

      {/* Invite code section */}
      <div className="mb-6 p-4 bg-indigo-50 border border-indigo-100 rounded-lg">
        <p className="text-sm font-medium text-indigo-700 mb-2">
          Invite Code — share this with people you want to join{" "}
          <strong>{household.name}</strong>
        </p>
        <InviteCodeCopy inviteCode={household.inviteCode} />
      </div>

      {/* Members table (client component handles interactivity) */}
      <MemberManagement
        initialMembers={membersData}
        householdId={params.id}
        sessionUserId={session.user.id}
        sessionUserRole={requesterMembership.role}
      />
    </div>
  );
}
