export type MemberPermissions = {
  canCreateChores: boolean;
  canAssignChores: boolean;
  canApproveCompletions: boolean;
  canAwardBadges: boolean;
  canManageMembers: boolean;
  canSetExempt: boolean;
};

export function hasPermission(
  member: { role: string; permissions: unknown },
  key: keyof MemberPermissions
): boolean {
  if (member.role === "OWNER" || member.role === "ADMIN") {
    return true;
  }

  let parsed: Partial<MemberPermissions> = {};
  try {
    if (typeof member.permissions === "string") {
      parsed = JSON.parse(member.permissions) as Partial<MemberPermissions>;
    } else if (
      typeof member.permissions === "object" &&
      member.permissions !== null
    ) {
      parsed = member.permissions as Partial<MemberPermissions>;
    }
  } catch {
    // malformed JSON — default to no permissions
  }

  return parsed[key] === true;
}
