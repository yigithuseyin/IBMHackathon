import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/permissions";
import { ChoreCard } from "@/components/ChoreCard";

type Props = {
  params: { id: string };
  searchParams: { filter?: string };
};

const FILTERS = ["all", "mine", "unassigned", "overdue", "completed"] as const;
type Filter = (typeof FILTERS)[number];

const FILTER_LABELS: Record<Filter, string> = {
  all: "All",
  mine: "Mine",
  unassigned: "Unassigned",
  overdue: "Overdue",
  completed: "Completed",
};

const EMPTY_MESSAGES: Record<Filter, string> = {
  all: "No chores yet. Add one to get started.",
  mine: "No chores assigned to you.",
  unassigned: "No unassigned chores.",
  overdue: "No overdue chores. Nice work!",
  completed: "No completed chores yet.",
};

export default async function ChoresPage({ params, searchParams }: Props) {
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

  // Update overdue chores
  const now = new Date();
  await prisma.chore.updateMany({
    where: {
      householdId: params.id,
      status: { in: ["PENDING", "IN_REVIEW"] },
      dueDate: { lt: now },
    },
    data: { status: "OVERDUE" },
  });

  const rawFilter = searchParams.filter ?? "all";
  const filter: Filter = FILTERS.includes(rawFilter as Filter)
    ? (rawFilter as Filter)
    : "all";

  type WhereClause = {
    householdId: string;
    assignedToId?: string | null;
    status?: string;
  };

  const where: WhereClause = { householdId: params.id };
  if (filter === "mine") where.assignedToId = session.user.id;
  if (filter === "unassigned") where.assignedToId = null;
  if (filter === "overdue") where.status = "OVERDUE";
  if (filter === "completed") where.status = "COMPLETED";

  const chores = await prisma.chore.findMany({
    where,
    select: {
      id: true,
      title: true,
      difficulty: true,
      status: true,
      basePoints: true,
      dueDate: true,
      assignedToId: true,
      assignedTo: { select: { id: true, name: true, avatarColour: true } },
    },
    orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
  });

  const canCreate = hasPermission(membership, "canCreateChores");
  const canApprove = hasPermission(membership, "canApproveCompletions");
  const isAdminOrOwner =
    membership.role === "OWNER" || membership.role === "ADMIN";

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link
            href={`/households/${params.id}`}
            className="text-sm text-gray-500 hover:text-indigo-600 mb-1 block"
          >
            ← {household.name}
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Chores</h1>
        </div>
        {canCreate && (
          <Link
            href={`/households/${params.id}/chores/new`}
            className="inline-flex items-center justify-center rounded-lg font-medium transition-colors bg-indigo-600 text-white hover:bg-indigo-700 px-4 py-2 text-sm"
          >
            + Add Chore
          </Link>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 mb-6 border-b border-gray-200 overflow-x-auto">
        {FILTERS.map((f) => (
          <Link
            key={f}
            href={`/households/${params.id}/chores?filter=${f}`}
            className={`px-4 py-2 text-sm font-medium whitespace-nowrap rounded-t-lg transition-colors ${
              filter === f
                ? "text-indigo-600 border-b-2 border-indigo-600"
                : "text-gray-600 hover:text-indigo-600 hover:bg-indigo-50"
            }`}
          >
            {FILTER_LABELS[f]}
          </Link>
        ))}
      </div>

      {/* Chore list */}
      {chores.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p>{EMPTY_MESSAGES[filter]}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {chores.map((chore) => (
            <ChoreCard
              key={chore.id}
              chore={chore}
              householdId={params.id}
              currentUserId={session.user.id}
              isAdminOrOwner={isAdminOrOwner}
              canApprove={canApprove}
            />
          ))}
        </div>
      )}
    </div>
  );
}
