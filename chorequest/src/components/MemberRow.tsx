"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { MemberPermissions } from "@/lib/permissions";

type Member = {
  id: string;
  role: string;
  permissions: string;
  isExempt: boolean;
  badgesCount: number;
  user: {
    id: string;
    name: string;
    email: string;
    avatarColour: string;
    totalPoints: number;
  };
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
  canCreateChores: "Create",
  canAssignChores: "Assign",
  canApproveCompletions: "Approve",
  canAwardBadges: "Badges",
  canManageMembers: "Manage",
  canSetExempt: "Exempt",
};

function parsePermissions(raw: string): MemberPermissions {
  try {
    return JSON.parse(raw) as MemberPermissions;
  } catch {
    return {
      canCreateChores: false,
      canAssignChores: false,
      canApproveCompletions: false,
      canAwardBadges: false,
      canManageMembers: false,
      canSetExempt: false,
    };
  }
}

type Props = {
  member: Member;
  householdId: string;
  canManage: boolean;
};

export function MemberRow({ member, householdId, canManage }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const perms = parsePermissions(member.permissions);
  const isOwnerOrAdmin = member.role === "OWNER" || member.role === "ADMIN";
  const initial = member.user.name.charAt(0).toUpperCase();

  async function patch(body: object) {
    setBusy(true);
    try {
      await fetch(
        `/api/households/${householdId}/members/${member.user.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      );
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function handleRemove() {
    if (!confirm(`Remove ${member.user.name} from the household?`)) return;
    setBusy(true);
    try {
      await fetch(
        `/api/households/${householdId}/members/${member.user.id}`,
        { method: "DELETE" }
      );
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  function togglePerm(key: keyof MemberPermissions) {
    const next = { ...perms, [key]: !perms[key] };
    void patch({ permissions: next });
  }

  function toggleExempt() {
    void patch({ isExempt: !member.isExempt });
  }

  return (
    <tr className={busy ? "opacity-50 pointer-events-none" : ""}>
      {/* Avatar */}
      <td className="px-4 py-3">
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold"
          style={{ backgroundColor: member.user.avatarColour }}
        >
          {initial}
        </div>
      </td>

      {/* Name + email */}
      <td className="px-4 py-3">
        <p className="text-sm font-medium text-gray-900">{member.user.name}</p>
        <p className="text-xs text-gray-500">{member.user.email}</p>
      </td>

      {/* Role */}
      <td className="px-4 py-3">
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
            member.role === "OWNER"
              ? "bg-yellow-100 text-yellow-800"
              : member.role === "ADMIN"
              ? "bg-indigo-100 text-indigo-800"
              : "bg-gray-100 text-gray-700"
          }`}
        >
          {member.role}
        </span>
      </td>

      {/* Permission toggles */}
      {canManage ? (
        <td className="px-4 py-3">
          <div className="flex flex-wrap gap-1">
            {PERMISSION_KEYS.map((key) => {
              const active = isOwnerOrAdmin || perms[key];
              return (
                <button
                  key={key}
                  onClick={() => !isOwnerOrAdmin && togglePerm(key)}
                  disabled={isOwnerOrAdmin}
                  title={key}
                  className={`px-2 py-0.5 rounded text-xs font-medium transition-colors ${
                    active
                      ? "bg-indigo-600 text-white"
                      : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                  } disabled:cursor-default`}
                >
                  {PERMISSION_LABELS[key]}
                </button>
              );
            })}
          </div>
        </td>
      ) : (
        <td className="px-4 py-3 text-xs text-gray-400">—</td>
      )}

      {/* Exempt toggle */}
      {canManage ? (
        <td className="px-4 py-3 text-center">
          <button
            onClick={toggleExempt}
            title={member.isExempt ? "Remove exempt" : "Set exempt"}
            className={`w-8 h-8 rounded-full text-sm font-bold transition-colors ${
              member.isExempt
                ? "bg-green-100 text-green-700 hover:bg-green-200"
                : "bg-gray-100 text-gray-400 hover:bg-gray-200"
            }`}
          >
            🛡️
          </button>
        </td>
      ) : (
        <td className="px-4 py-3 text-center text-xs text-gray-400">
          {member.isExempt ? "🛡️" : "—"}
        </td>
      )}

      {/* Remove */}
      {canManage ? (
        <td className="px-4 py-3 text-center">
          {member.role !== "OWNER" && (
            <button
              onClick={handleRemove}
              className="text-xs text-red-600 hover:text-red-800 font-medium"
            >
              Remove
            </button>
          )}
        </td>
      ) : (
        <td className="px-4 py-3" />
      )}
    </tr>
  );
}
