"use client";

import { useState } from "react";
import { MemberPermissions } from "@/lib/permissions";

type Member = {
  id: string;
  role: string;
  permissions: string;
  isExempt: boolean;
  joinedAt: string;
  badgesCount: number;
  user: {
    id: string;
    name: string;
    email: string;
    avatarColour: string;
    totalPoints: number;
  };
};

type Props = {
  initialMembers: Member[];
  householdId: string;
  sessionUserId: string;
  sessionUserRole: string;
};

const PERMISSION_KEYS: (keyof MemberPermissions)[] = [
  "canCreateChores",
  "canAssignChores",
  "canApproveCompletions",
  "canAwardBadges",
  "canManageMembers",
  "canSetExempt",
];

const PERMISSION_LABELS: Record<keyof MemberPermissions, string> = {
  canCreateChores: "Create Chores",
  canAssignChores: "Assign Chores",
  canApproveCompletions: "Approve Completions",
  canAwardBadges: "Award Badges",
  canManageMembers: "Manage Members",
  canSetExempt: "Set Exempt",
};

function parsePermissions(raw: string): MemberPermissions {
  const defaults: MemberPermissions = {
    canCreateChores: false,
    canAssignChores: false,
    canApproveCompletions: false,
    canAwardBadges: false,
    canManageMembers: false,
    canSetExempt: false,
  };
  try {
    return { ...defaults, ...(JSON.parse(raw) as Partial<MemberPermissions>) };
  } catch {
    return defaults;
  }
}

function RoleBadge({ role }: { role: string }) {
  const classes =
    role === "OWNER"
      ? "bg-purple-100 text-purple-800"
      : role === "ADMIN"
      ? "bg-blue-100 text-blue-800"
      : "bg-gray-100 text-gray-700";
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${classes}`}
    >
      {role}
    </span>
  );
}

function PermissionsSummary({
  role,
  permissions,
}: {
  role: string;
  permissions: MemberPermissions;
}) {
  if (role === "OWNER" || role === "ADMIN") {
    return <span className="text-xs text-gray-400">All (by role)</span>;
  }
  const granted = PERMISSION_KEYS.filter((k) => permissions[k]);
  if (granted.length === 0) {
    return <span className="text-xs text-gray-400">Default (none)</span>;
  }
  return (
    <div className="flex flex-wrap gap-1">
      {granted.map((k) => (
        <span
          key={k}
          className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-indigo-50 text-indigo-700"
        >
          {PERMISSION_LABELS[k]}
        </span>
      ))}
    </div>
  );
}

export function MemberManagement({
  initialMembers,
  householdId,
  sessionUserId,
  sessionUserRole,
}: Props) {
  const [members, setMembers] = useState<Member[]>(initialMembers);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [editRole, setEditRole] = useState<"ADMIN" | "MEMBER">("MEMBER");
  const [editPermissions, setEditPermissions] = useState<MemberPermissions>(
    parsePermissions("{}")
  );
  const [editIsExempt, setEditIsExempt] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canViewEditModal =
    sessionUserRole === "OWNER" || sessionUserRole === "ADMIN";

  async function refreshMembers() {
    const res = await fetch(`/api/households/${householdId}/members`);
    if (res.ok) {
      const json = (await res.json()) as { data: Member[] };
      setMembers(json.data);
    }
  }

  function openEdit(member: Member) {
    setEditingMember(member);
    setEditRole(
      member.role === "ADMIN" || member.role === "MEMBER"
        ? (member.role as "ADMIN" | "MEMBER")
        : "MEMBER"
    );
    setEditPermissions(parsePermissions(member.permissions));
    setEditIsExempt(member.isExempt);
    setError(null);
  }

  function closeEdit() {
    setEditingMember(null);
    setError(null);
  }

  async function handleSave() {
    if (!editingMember) return;
    setSaving(true);
    setError(null);
    try {
      const body: {
        role?: "ADMIN" | "MEMBER";
        permissions?: MemberPermissions;
        isExempt?: boolean;
      } = {};

      // Only include role if target is not OWNER
      if (editingMember.role !== "OWNER") {
        body.role = editRole;
      }
      // Only include permissions for MEMBER role
      if (editRole === "MEMBER") {
        body.permissions = editPermissions;
      }
      body.isExempt = editIsExempt;

      const res = await fetch(
        `/api/households/${householdId}/members/${editingMember.user.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      );

      if (!res.ok) {
        const json = (await res.json()) as { error?: string };
        setError(json.error ?? "Failed to save changes");
        return;
      }

      closeEdit();
      await refreshMembers();
    } finally {
      setSaving(false);
    }
  }

  async function handleRemove(member: Member) {
    if (!window.confirm(`Remove ${member.user.name} from the household?`)) {
      return;
    }
    const res = await fetch(
      `/api/households/${householdId}/members/${member.user.id}`,
      { method: "DELETE" }
    );
    if (res.ok) {
      await refreshMembers();
    }
  }

  return (
    <>
      {/* Members table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Member
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
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {members.map((m) => {
                const perms = parsePermissions(m.permissions);
                const initial = m.user.name.charAt(0).toUpperCase();
                const isCurrentUser = m.user.id === sessionUserId;
                return (
                  <tr key={m.id}>
                    {/* Member */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                          style={{ backgroundColor: m.user.avatarColour }}
                        >
                          {initial}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {m.user.name}
                            {isCurrentUser && (
                              <span className="ml-1 text-xs text-gray-400">
                                (you)
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-gray-500">{m.user.email}</p>
                        </div>
                      </div>
                    </td>

                    {/* Role */}
                    <td className="px-4 py-3">
                      <RoleBadge role={m.role} />
                    </td>

                    {/* Permissions */}
                    <td className="px-4 py-3">
                      <PermissionsSummary role={m.role} permissions={perms} />
                    </td>

                    {/* Exempt */}
                    <td className="px-4 py-3 text-center text-sm">
                      {m.isExempt ? (
                        <span title="Exempt">✓</span>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {canViewEditModal && m.role !== "OWNER" && (
                          <button
                            onClick={() => openEdit(m)}
                            className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                          >
                            Edit
                          </button>
                        )}
                        {m.role !== "OWNER" && !isCurrentUser && (
                          <button
                            onClick={() => handleRemove(m)}
                            className="text-xs text-red-600 hover:text-red-800 font-medium"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit modal */}
      {editingMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Edit Member —{" "}
              <span className="text-indigo-600">{editingMember.user.name}</span>
            </h2>

            {error && (
              <p className="mb-4 text-sm text-red-600 bg-red-50 rounded px-3 py-2">
                {error}
              </p>
            )}

            {/* Role select */}
            {editingMember.role !== "OWNER" && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role
                </label>
                <select
                  value={editRole}
                  onChange={(e) =>
                    setEditRole(e.target.value as "ADMIN" | "MEMBER")
                  }
                  className="block w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="ADMIN">ADMIN</option>
                  <option value="MEMBER">MEMBER</option>
                </select>
              </div>
            )}

            {/* Permissions — only for MEMBER role */}
            {editRole === "MEMBER" && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Permissions
                </label>
                <div className="space-y-2">
                  {PERMISSION_KEYS.map((key) => (
                    <label key={key} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={editPermissions[key]}
                        onChange={() =>
                          setEditPermissions((prev) => ({
                            ...prev,
                            [key]: !prev[key],
                          }))
                        }
                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="text-gray-700">
                        {PERMISSION_LABELS[key]}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Exempt toggle */}
            <div className="mb-6">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={editIsExempt}
                  onChange={() => setEditIsExempt((prev) => !prev)}
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="font-medium text-gray-700">Exempt from chores</span>
              </label>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3">
              <button
                onClick={closeEdit}
                disabled={saving}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
              >
                {saving ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
