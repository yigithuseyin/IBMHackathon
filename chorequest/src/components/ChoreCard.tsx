"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/BadgeUI";

type Props = {
  chore: {
    id: string;
    title: string;
    difficulty: string;
    status: string;
    basePoints: number;
    dueDate: Date | string | null;
    assignedToId?: string | null;
    assignedTo: { name: string } | null;
  };
  householdId: string;
  currentUserId?: string;
  isAdminOrOwner?: boolean;
  canApprove?: boolean;
};

function difficultyBadge(difficulty: string) {
  if (difficulty === "HARD")
    return <Badge variant="danger">Hard</Badge>;
  if (difficulty === "MEDIUM")
    return <Badge variant="warning">Medium</Badge>;
  return <Badge variant="success">Easy</Badge>;
}

function statusBadge(status: string) {
  if (status === "COMPLETED")
    return <Badge variant="success">Completed</Badge>;
  if (status === "IN_REVIEW")
    return <Badge variant="warning">In Review</Badge>;
  if (status === "OVERDUE")
    return <Badge variant="danger">Overdue</Badge>;
  return <Badge variant="default">Pending</Badge>;
}

function formatDate(dueDate: Date | string | null): string | null {
  if (!dueDate) return null;
  return new Date(dueDate).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function ChoreCard({
  chore,
  householdId,
  currentUserId,
  isAdminOrOwner = false,
  canApprove = false,
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState<"complete" | "approve" | null>(null);

  const due = formatDate(chore.dueDate);

  const canComplete =
    (chore.status === "PENDING" || chore.status === "OVERDUE") &&
    (isAdminOrOwner || chore.assignedToId === currentUserId);

  const canApproveChore = chore.status === "IN_REVIEW" && canApprove;

  async function handleComplete(e: React.MouseEvent) {
    e.preventDefault();
    setLoading("complete");
    try {
      await fetch(
        `/api/households/${householdId}/chores/${chore.id}/complete`,
        { method: "POST" }
      );
      router.refresh();
    } finally {
      setLoading(null);
    }
  }

  async function handleApprove(e: React.MouseEvent) {
    e.preventDefault();
    setLoading("approve");
    try {
      await fetch(
        `/api/households/${householdId}/chores/${chore.id}/approve`,
        { method: "POST" }
      );
      router.refresh();
    } finally {
      setLoading(null);
    }
  }

  return (
    <Link
      href={`/households/${householdId}/chores/${chore.id}`}
      className="block bg-white rounded-xl border border-gray-200 p-4 hover:border-indigo-300 hover:shadow-sm transition-all"
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-sm font-semibold text-gray-900 leading-tight">
          {chore.title}
        </h3>
        <span className="text-sm font-bold text-indigo-600 whitespace-nowrap">
          {chore.basePoints} pts
        </span>
      </div>

      <div className="flex flex-wrap gap-1.5 mt-2">
        {difficultyBadge(chore.difficulty)}
        {statusBadge(chore.status)}
      </div>

      <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
        <span>{chore.assignedTo ? chore.assignedTo.name : "Unassigned"}</span>
        {due && <span>Due {due}</span>}
      </div>

      {(canComplete || canApproveChore) && (
        <div className="mt-3 flex gap-2">
          {canComplete && (
            <button
              onClick={handleComplete}
              disabled={loading !== null}
              className="flex-1 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {loading === "complete" ? "Saving…" : "Mark Complete"}
            </button>
          )}
          {canApproveChore && (
            <button
              onClick={handleApprove}
              disabled={loading !== null}
              className="flex-1 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              {loading === "approve" ? "Saving…" : "Approve"}
            </button>
          )}
        </div>
      )}
    </Link>
  );
}
