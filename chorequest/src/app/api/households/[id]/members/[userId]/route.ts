import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission, MemberPermissions } from "@/lib/permissions";

type Params = { params: { id: string; userId: string } };

const patchSchema = z.object({
  role: z.enum(["ADMIN", "MEMBER", "OWNER"]).optional(),
  permissions: z
    .object({
      canCreateChores: z.boolean().optional(),
      canAssignChores: z.boolean().optional(),
      canApproveCompletions: z.boolean().optional(),
      canAwardBadges: z.boolean().optional(),
      canManageMembers: z.boolean().optional(),
      canSetExempt: z.boolean().optional(),
    })
    .optional(),
  isExempt: z.boolean().optional(),
});

function parsePermissions(raw: unknown): MemberPermissions {
  const defaults: MemberPermissions = {
    canCreateChores: false,
    canAssignChores: false,
    canApproveCompletions: false,
    canAwardBadges: false,
    canManageMembers: false,
    canSetExempt: false,
  };
  try {
    if (typeof raw === "string") {
      return { ...defaults, ...(JSON.parse(raw) as Partial<MemberPermissions>) };
    }
    if (typeof raw === "object" && raw !== null) {
      return { ...defaults, ...(raw as Partial<MemberPermissions>) };
    }
  } catch {
    // malformed — return defaults
  }
  return defaults;
}

export async function PATCH(req: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const requester = await prisma.householdMember.findUnique({
    where: {
      householdId_userId: { householdId: params.id, userId: session.user.id },
    },
  });
  if (!requester) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!hasPermission(requester, "canManageMembers")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const target = await prisma.householdMember.findUnique({
    where: {
      householdId_userId: { householdId: params.id, userId: params.userId },
    },
  });
  if (!target) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const parsed = patchSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }
  const { role, permissions, isExempt } = parsed.data;

  // Hierarchy rules
  if (target.role === "OWNER" && role !== undefined) {
    return NextResponse.json(
      { error: "Cannot demote the Owner" },
      { status: 403 }
    );
  }
  if (requester.role === "ADMIN" && role === "OWNER") {
    return NextResponse.json(
      { error: "Only the Owner can transfer ownership" },
      { status: 403 }
    );
  }

  // Merge permissions with existing
  let mergedPermissionsJson: string | undefined;
  if (permissions !== undefined) {
    const existing = parsePermissions(target.permissions);
    const merged: MemberPermissions = { ...existing, ...permissions } as MemberPermissions;
    mergedPermissionsJson = JSON.stringify(merged);
  }

  await prisma.householdMember.update({
    where: {
      householdId_userId: { householdId: params.id, userId: params.userId },
    },
    data: {
      ...(role !== undefined ? { role } : {}),
      ...(mergedPermissionsJson !== undefined
        ? { permissions: mergedPermissionsJson }
        : {}),
      ...(isExempt !== undefined ? { isExempt } : {}),
    },
  });

  // Handle Exempt badge (system badge — householdId null)
  if (isExempt !== undefined) {
    const EXEMPT_BADGE_NAME = "Exempt 🛡️";
    const exemptBadge = await prisma.badge.findFirst({
      where: { name: EXEMPT_BADGE_NAME },
      select: { id: true },
    });

    if (exemptBadge) {
      if (isExempt) {
        const existing = await prisma.userBadge.findFirst({
          where: {
            userId: params.userId,
            badgeId: exemptBadge.id,
            householdId: params.id,
          },
          select: { id: true },
        });
        if (!existing) {
          await prisma.userBadge.create({
            data: {
              userId: params.userId,
              badgeId: exemptBadge.id,
              householdId: params.id,
              awardedByUserId: session.user.id,
            },
          });
        }
      } else {
        await prisma.userBadge.deleteMany({
          where: {
            userId: params.userId,
            badgeId: exemptBadge.id,
            householdId: params.id,
          },
        });
      }
    }
  }

  return NextResponse.json({ data: { updated: true } });
}

export async function DELETE(_req: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const requester = await prisma.householdMember.findUnique({
    where: {
      householdId_userId: { householdId: params.id, userId: session.user.id },
    },
  });
  if (!requester) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!hasPermission(requester, "canManageMembers")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Cannot remove yourself
  if (params.userId === session.user.id) {
    return NextResponse.json(
      { error: "Cannot remove yourself" },
      { status: 403 }
    );
  }

  const target = await prisma.householdMember.findUnique({
    where: {
      householdId_userId: { householdId: params.id, userId: params.userId },
    },
    select: { id: true, role: true },
  });
  if (!target) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (target.role === "OWNER") {
    return NextResponse.json(
      { error: "Cannot remove the Owner" },
      { status: 403 }
    );
  }

  await prisma.$transaction([
    prisma.householdMember.delete({ where: { id: target.id } }),
    prisma.userStreak.deleteMany({
      where: { userId: params.userId, householdId: params.id },
    }),
    prisma.userBadge.deleteMany({
      where: { userId: params.userId, householdId: params.id },
    }),
  ]);

  return NextResponse.json({ data: { removed: true } });
}
