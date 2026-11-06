import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/permissions";
import { applyTemporaryBadges } from "@/lib/badges";
import { Card } from "@/components/ui/Card";
import { CreateBadgeForm } from "./CreateBadgeForm";

type Props = { params: { id: string } };

export default async function BadgesPage({ params }: Props) {
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

  // Refresh temporary badge state on page load
  await applyTemporaryBadges(params.id);

  const canManage = hasPermission(membership, "canAwardBadges");

  const badges = await prisma.badge.findMany({
    where: {
      OR: [{ householdId: null }, { householdId: params.id }],
    },
    select: {
      id: true,
      name: true,
      description: true,
      icon: true,
      type: true,
      isNegative: true,
      householdId: true,
      userBadges: {
        where: { householdId: params.id },
        select: {
          id: true,
          user: { select: { id: true, name: true, avatarColour: true } },
          awardedAt: true,
        },
      },
    },
    orderBy: [{ type: "asc" }, { name: "asc" }],
  });

  const typeOrder: Record<string, number> = {
    MILESTONE: 0,
    BEHAVIOUR: 1,
    TEMPORARY: 2,
    CUSTOM: 3,
  };

  const groupedBadges = badges
    .slice()
    .sort(
      (a, b) =>
        (typeOrder[a.type] ?? 99) - (typeOrder[b.type] ?? 99) ||
        a.name.localeCompare(b.name)
    );

  const typeLabels: Record<string, string> = {
    MILESTONE: "Milestone Badges",
    BEHAVIOUR: "Behaviour Badges",
    TEMPORARY: "Temporary Badges",
    CUSTOM: "Custom Badges",
  };

  const sections = ["MILESTONE", "BEHAVIOUR", "TEMPORARY", "CUSTOM"] as const;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Household Badges</h1>
        <p className="text-sm text-gray-500 mt-1">
          Badges earned by members of this household
        </p>
      </div>

      {sections.map((type) => {
        const sectionBadges = groupedBadges.filter((b) => b.type === type);
        if (sectionBadges.length === 0) return null;

        return (
          <section key={type}>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">
              {typeLabels[type]}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {sectionBadges.map((badge) => (
                <Card key={badge.id} className="flex flex-col gap-3">
                  <div className="flex items-start gap-3">
                    <span className="text-3xl leading-none">{badge.icon}</span>
                    <div>
                      <p
                        className={`font-semibold text-sm ${
                          badge.isNegative
                            ? "text-red-700"
                            : "text-gray-900"
                        }`}
                      >
                        {badge.name}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {badge.description}
                      </p>
                    </div>
                  </div>

                  {badge.userBadges.length > 0 ? (
                    <div>
                      <p className="text-xs font-medium text-gray-500 mb-1.5">
                        Earned by
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {badge.userBadges.map((ub) => (
                          <span
                            key={ub.id}
                            className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 text-xs font-medium px-2 py-0.5 rounded-full"
                          >
                            <span
                              className="w-4 h-4 rounded-full flex-shrink-0 flex items-center justify-center text-white text-[8px] font-bold"
                              style={{ backgroundColor: ub.user.avatarColour }}
                            >
                              {ub.user.name.charAt(0).toUpperCase()}
                            </span>
                            {ub.user.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400 italic">
                      Not yet earned
                    </p>
                  )}
                </Card>
              ))}
            </div>
          </section>
        );
      })}

      {canManage && (
        <div>
          <CreateBadgeForm householdId={params.id} />
        </div>
      )}
    </div>
  );
}
