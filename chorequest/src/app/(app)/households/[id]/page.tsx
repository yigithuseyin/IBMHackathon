import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MemberCard } from "@/components/MemberCard";
import { InviteCodeCopy } from "@/components/InviteCodeCopy";

type Props = { params: { id: string } };

export default async function HouseholdPage({ params }: Props) {
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
    select: {
      id: true,
      name: true,
      inviteCode: true,
      ownerId: true,
      members: {
        select: {
          id: true,
          role: true,
          isExempt: true,
          joinedAt: true,
          user: {
            select: {
              id: true,
              name: true,
              avatarColour: true,
              totalPoints: true,
            },
          },
        },
        orderBy: { joinedAt: "asc" },
      },
    },
  });

  if (!household) {
    notFound();
  }

  // Fetch active UserBadges for all members in this household
  const userBadges = await prisma.userBadge.findMany({
    where: { householdId: params.id },
    select: {
      userId: true,
      badge: { select: { icon: true, name: true, isNegative: true } },
    },
  });

  // Group badges by userId
  const badgesByUserId: Record<
    string,
    { icon: string; name: string; isNegative: boolean }[]
  > = {};
  for (const ub of userBadges) {
    if (!badgesByUserId[ub.userId]) badgesByUserId[ub.userId] = [];
    badgesByUserId[ub.userId].push(ub.badge);
  }

  const isOwner = household.ownerId === session.user.id;
  const isAdminOrOwner = isOwner || membership.role === "ADMIN";

  const navLinks = [
    { href: `/households/${params.id}/chores`, label: "Chores" },
    { href: `/households/${params.id}/members`, label: "Members" },
    { href: `/households/${params.id}/badges`, label: "Badges" },
    { href: `/households/${params.id}/leaderboard`, label: "Leaderboard" },
    ...(isOwner
      ? [{ href: `/households/${params.id}/settings`, label: "Settings" }]
      : []),
  ];

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{household.name}</h1>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-sm text-gray-500">Invite code:</span>
            <InviteCodeCopy inviteCode={household.inviteCode} />
          </div>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/households/${params.id}/leaderboard`}
            className="inline-flex items-center px-4 py-2 bg-white text-indigo-600 text-sm font-medium rounded-lg border border-indigo-200 hover:bg-indigo-50 transition-colors"
          >
            View Leaderboard
          </Link>
          {isAdminOrOwner && (
            <Link
              href={`/households/${params.id}/members`}
              className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Manage Members
            </Link>
          )}
        </div>
      </div>

      {/* Nav links */}
      <nav className="flex gap-1 mb-8 border-b border-gray-200">
        {navLinks.map((link) => (
          <a
            key={link.href}
            href={link.href}
            className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-t-lg transition-colors"
          >
            {link.label}
          </a>
        ))}
      </nav>

      {/* Members grid */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Members ({household.members.length})
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {household.members.map((m) => (
            <MemberCard
              key={m.id}
              member={m.user}
              householdId={household.id}
              badges={badgesByUserId[m.user.id] ?? []}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
