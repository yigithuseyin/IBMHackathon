"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/BadgeUI";

type User = { id: string; name: string; avatarColour: string };
type Member = { id: string; role: string; user: User };

type Chore = {
  id: string;
  title: string;
  description: string | null;
  difficulty: string;
  basePoints: number;
  dueDate: string | null;
  status: string;
  createdById: string;
  assignedToId: string | null;
  assignedTo: { id: string; name: string; avatarColour: string } | null;
  createdBy: { id: string; name: string; avatarColour: string };
  createdAt: string;
  updatedAt: string;
};

type ChoreCompletion = {
  id: string;
  completedByUserId: string;
  completedAt: string;
  pointsAwarded: number;
  wasLate: boolean;
  wasEarly: boolean;
  completedBy: { id: string; name: string };
};

type SessionUser = { id: string };

type Props = { params: { id: string; choreId: string } };

type CompleteResult = {
  finalPoints: number;
  wasLate: boolean;
  wasEarly: boolean;
  newTotalPoints: number;
};

function statusBadge(status: string) {
  if (status === "COMPLETED") return <Badge variant="success">Completed</Badge>;
  if (status === "IN_REVIEW") return <Badge variant="warning">In Review</Badge>;
  if (status === "OVERDUE") return <Badge variant="danger">Overdue</Badge>;
  return <Badge variant="default">Pending</Badge>;
}

function difficultyLabel(d: string) {
  if (d === "HARD") return "Hard";
  if (d === "MEDIUM") return "Medium";
  return "Easy";
}

function difficultyMultiplierLabel(d: string) {
  if (d === "HARD") return "×2.0";
  if (d === "MEDIUM") return "×1.5";
  return "×1.0";
}

function formatDate(d: string | null): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatDateTime(d: string): string {
  return new Date(d).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function ChoreDetailPage({ params }: Props) {
  const router = useRouter();
  const [chore, setChore] = useState<Chore | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [session, setSession] = useState<SessionUser | null>(null);
  const [memberRole, setMemberRole] = useState<string>("MEMBER");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [completions, setCompletions] = useState<ChoreCompletion[]>([]);

  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [completing, setCompleting] = useState(false);
  const [completeError, setCompleteError] = useState<string | null>(null);
  const [completeResult, setCompleteResult] = useState<CompleteResult | null>(null);

  // edit form state
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editDifficulty, setEditDifficulty] = useState("EASY");
  const [editBasePoints, setEditBasePoints] = useState(10);
  const [editDueDate, setEditDueDate] = useState("");
  const [editAssignedToId, setEditAssignedToId] = useState("");

  const loadCompletions = useCallback(async () => {
    const res = await fetch(
      `/api/households/${params.id}/chores/${params.choreId}/completions`
    );
    if (res.ok) {
      const body = (await res.json()) as { data?: ChoreCompletion[] };
      setCompletions(body.data ?? []);
    }
  }, [params.id, params.choreId]);

  const loadData = useCallback(async () => {
    try {
      const [choreRes, householdRes, sessionRes] = await Promise.all([
        fetch(`/api/households/${params.id}/chores/${params.choreId}`),
        fetch(`/api/households/${params.id}`),
        fetch("/api/auth/session"),
      ]);

      const choreBody = (await choreRes.json()) as { data?: Chore; error?: string };
      if (!choreRes.ok || !choreBody.data) {
        setLoadError(choreBody.error ?? "Chore not found");
        return;
      }

      const householdBody = (await householdRes.json()) as {
        data?: { members?: Member[] };
      };
      const sessionBody = (await sessionRes.json()) as {
        user?: SessionUser;
      };

      const c = choreBody.data;
      setChore(c);

      const mems = householdBody.data?.members ?? [];
      setMembers(mems);

      const userId = sessionBody.user?.id ?? null;
      if (userId) {
        setSession({ id: userId });
        const myMember = mems.find((m) => m.user.id === userId);
        if (myMember) setMemberRole(myMember.role);
      }

      setEditTitle(c.title);
      setEditDescription(c.description ?? "");
      setEditDifficulty(c.difficulty);
      setEditBasePoints(c.basePoints);
      setEditDueDate(
        c.dueDate ? new Date(c.dueDate).toISOString().split("T")[0] : ""
      );
      setEditAssignedToId(c.assignedToId ?? "");
    } catch {
      setLoadError("Failed to load chore");
    }
  }, [params.id, params.choreId]);

  useEffect(() => {
    void loadData();
    void loadCompletions();
  }, [loadData, loadCompletions]);

  async function handleComplete() {
    setCompleteError(null);
    setCompleting(true);

    try {
      const res = await fetch(
        `/api/households/${params.id}/chores/${params.choreId}/complete`,
        { method: "POST" }
      );

      const body = (await res.json()) as {
        data?: CompleteResult;
        error?: string;
      };

      if (!res.ok) {
        setCompleteError(body.error ?? "Failed to complete chore");
        return;
      }

      setCompleteResult(body.data!);
      // Reload chore and completions to reflect new status
      await Promise.all([loadData(), loadCompletions()]);
    } catch {
      setCompleteError("An unexpected error occurred");
    } finally {
      setCompleting(false);
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaveError(null);
    setSaving(true);

    try {
      const res = await fetch(
        `/api/households/${params.id}/chores/${params.choreId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: editTitle,
            description: editDescription || undefined,
            difficulty: editDifficulty,
            basePoints: editBasePoints,
            dueDate: editDueDate || undefined,
            assignedToId: editAssignedToId || null,
          }),
        }
      );

      const body = (await res.json()) as { data?: Chore; error?: string };
      if (!res.ok) {
        setSaveError(body.error ?? "Failed to save");
        return;
      }

      setChore(body.data!);
      setEditing(false);
    } catch {
      setSaveError("An unexpected error occurred");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Delete this chore? This cannot be undone.")) return;
    setDeleting(true);

    try {
      const res = await fetch(
        `/api/households/${params.id}/chores/${params.choreId}`,
        { method: "DELETE" }
      );

      if (!res.ok) {
        const body = (await res.json()) as { error?: string };
        alert(body.error ?? "Failed to delete chore");
        return;
      }

      router.push(`/households/${params.id}/chores`);
    } catch {
      alert("An unexpected error occurred");
    } finally {
      setDeleting(false);
    }
  }

  if (loadError) {
    return (
      <div className="text-center py-12 text-red-600">
        <p>{loadError}</p>
        <Link
          href={`/households/${params.id}/chores`}
          className="mt-4 inline-block text-sm text-indigo-600 hover:underline"
        >
          ← Back to Chores
        </Link>
      </div>
    );
  }

  if (!chore) {
    return (
      <div className="text-center py-12 text-gray-400">Loading…</div>
    );
  }

  const isOwnerOrAdmin = memberRole === "OWNER" || memberRole === "ADMIN";
  const isCreator = session?.id === chore.createdById;
  const canEdit = isOwnerOrAdmin || isCreator;
  const isAssigned =
    chore.assignedToId === session?.id ||
    (!chore.assignedToId && session?.id);
  const canComplete =
    isAssigned && (chore.status === "PENDING" || chore.status === "OVERDUE");

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div className="mb-2">
        <Link
          href={`/households/${params.id}/chores`}
          className="text-sm text-gray-500 hover:text-indigo-600 mb-1 block"
        >
          ← Back to Chores
        </Link>
        <div className="flex items-center gap-3 mt-1">
          <h1 className="text-2xl font-bold text-gray-900">{chore.title}</h1>
          {statusBadge(chore.status)}
        </div>
      </div>

      {/* Completion success banner */}
      {completeResult && (
        <div className="rounded-xl border border-green-200 bg-green-50 px-5 py-4 space-y-1">
          <p className="text-sm font-semibold text-green-800">
            🎉 Chore completed! You earned{" "}
            <span className="text-green-700">{completeResult.finalPoints} points</span>.
          </p>
          <p className="text-xs text-green-700">
            Total points: {completeResult.newTotalPoints}
          </p>
          <div className="flex gap-2 mt-1">
            {completeResult.wasEarly && (
              <Badge variant="success">Early bonus</Badge>
            )}
            {completeResult.wasLate && (
              <Badge variant="danger">Late penalty</Badge>
            )}
          </div>
        </div>
      )}

      {!editing ? (
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          {chore.description && (
            <p className="text-sm text-gray-700">{chore.description}</p>
          )}

          <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
            <div>
              <dt className="text-gray-500">Difficulty</dt>
              <dd className="font-medium text-gray-900">
                {difficultyLabel(chore.difficulty)}{" "}
                <span className="text-gray-400 text-xs">
                  {difficultyMultiplierLabel(chore.difficulty)}
                </span>
              </dd>
            </div>
            <div>
              <dt className="text-gray-500">Base Points</dt>
              <dd className="font-medium text-indigo-600">
                {chore.basePoints} pts
              </dd>
            </div>
            <div>
              <dt className="text-gray-500">Due Date</dt>
              <dd className="font-medium text-gray-900">
                {formatDate(chore.dueDate)}
              </dd>
            </div>
            <div>
              <dt className="text-gray-500">Assigned To</dt>
              <dd className="font-medium text-gray-900">
                {chore.assignedTo ? chore.assignedTo.name : "Unassigned"}
              </dd>
            </div>
            <div>
              <dt className="text-gray-500">Created By</dt>
              <dd className="font-medium text-gray-900">
                {chore.createdBy.name}
              </dd>
            </div>
            <div>
              <dt className="text-gray-500">Created</dt>
              <dd className="font-medium text-gray-900">
                {formatDate(chore.createdAt)}
              </dd>
            </div>
          </dl>

          {completeError && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {completeError}
            </div>
          )}

          <div className="flex flex-wrap gap-3 pt-2">
            {canComplete && (
              <Button
                variant="primary"
                onClick={handleComplete}
                disabled={completing}
              >
                {completing ? "Completing…" : "Mark Complete"}
              </Button>
            )}

            {canEdit && (
              <Button variant="secondary" onClick={() => setEditing(true)}>
                Edit
              </Button>
            )}

            {isOwnerOrAdmin && (
              <Button
                variant="danger"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? "Deleting…" : "Delete"}
              </Button>
            )}
          </div>
        </div>
      ) : (
        <form
          onSubmit={handleSave}
          className="bg-white rounded-xl border border-gray-200 p-6 space-y-5"
        >
          {saveError && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {saveError}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title <span className="text-red-500">*</span>
            </label>
            <Input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Difficulty <span className="text-red-500">*</span>
            </label>
            <select
              value={editDifficulty}
              onChange={(e) => setEditDifficulty(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="EASY">Easy</option>
              <option value="MEDIUM">Medium</option>
              <option value="HARD">Hard</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Base Points <span className="text-red-500">*</span>
            </label>
            <Input
              type="number"
              min={1}
              max={1000}
              value={editBasePoints}
              onChange={(e) => setEditBasePoints(Number(e.target.value))}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Due Date
            </label>
            <Input
              type="date"
              value={editDueDate}
              onChange={(e) => setEditDueDate(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Assign To
            </label>
            <select
              value={editAssignedToId}
              onChange={(e) => setEditAssignedToId(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="">Unassigned</option>
              {members.map((m) => (
                <option key={m.user.id} value={m.user.id}>
                  {m.user.name} ({m.role})
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={saving} className="flex-1">
              {saving ? "Saving…" : "Save Changes"}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setEditing(false)}
            >
              Cancel
            </Button>
          </div>
        </form>
      )}

      {/* Completion history */}
      {completions.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">
            Completion History
          </h2>
          <ul className="space-y-3">
            {completions.map((c) => (
              <li
                key={c.id}
                className="flex items-start justify-between gap-3 text-sm"
              >
                <div>
                  <p className="font-medium text-gray-900">
                    {c.completedBy.name}
                  </p>
                  <p className="text-gray-500">{formatDateTime(c.completedAt)}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="font-semibold text-indigo-600">
                    +{c.pointsAwarded} pts
                  </span>
                  {c.wasEarly && <Badge variant="success">Early</Badge>}
                  {c.wasLate && <Badge variant="danger">Late</Badge>}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
