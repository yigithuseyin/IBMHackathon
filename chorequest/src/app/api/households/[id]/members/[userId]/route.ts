import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/permissions";

type Params = { params: { id: string; userId: string } };

export async function PATCH(req: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (
    !hasPermission(requesterMembership, "canManageMembers") &&
    !hasPermission(requesterMembership, "canSetExempt")
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const targetMembership = await prisma.householdMember.findUnique({
    where: {
      householdId_userId: {
        householdId: params.id,
        userId: params.userId,
      },
    },
  });
  if (!targetMembership) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body: unknown = await req.json();
  const { role, permissions, isExempt } = body as {
    role?: string;
    permissions?: object;
    isExempt?: boolean;
  };

  // Cannot demote the Owner
  if (targetMembership.role === "OWNER" && role && role !== "OWNER") {
    return NextResponse.json(
      { error: "Cannot demote the Owner" },
      { status: 403 }
    );
  }

  // Cannot promote to Owner unless requester is Owner
  if (role === "OWNER" && requesterMembership.role !== "OWNER") {
    return NextResponse.json(
      { error: "Only the Owner can transfer ownership" },
      { status: 403 }
    );
  }

  const updated = await prisma.householdMember.update({
    where: {
      householdId_userId: {
        householdId: params.id,
        userId: params.userId,
      },
    },
    data: {
      ...(role !== undefined ? { role } : {}),
      ...(permissions !== undefined
        ? { permissions: JSON.stringify(permissions) }
        : {}),
      ...(isExempt !== undefined ? { isExempt } : {}),
    },
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
        },
      },
    },
  });

  // Handle Exempt badge
  if (isExempt !== undefined) {
    const EXEMPT_BADGE_NAME = "Exempt 🛡️";

    if (isExempt) {
      // Find or create the Exempt badge for this household
      let badge = await prisma.badge.findFirst({
        where: { name: EXEMPT_BADGE_NAME, householdId: params.id },
        select: { id: true },
      });

      if (!badge) {
        badge = await prisma.badge.create({
          data: {
            name: EXEMPT_BADGE_NAME,
            description: "This member is exempt from chore requirements.",
            icon: "🛡️",
            type: "TEMPORARY",
            householdId: params.id,
          },
          select: { id: true },
        });
      }

      // Upsert the UserBadge (find or create)
      const existing = await prisma.userBadge.findFirst({
        where: {
          userId: params.userId,
          badgeId: badge.id,
          householdId: params.id,
        },
        select: { id: true },
      });

      if (!existing) {
        await prisma.userBadge.create({
          data: {
            userId: params.userId,
            badgeId: badge.id,
            householdId: params.id,
            awardedByUserId: session.user.id,
          },
        });
      }
    } else {
      // Remove the Exempt badge UserBadge record
      const badge = await prisma.badge.findFirst({
        where: { name: EXEMPT_BADGE_NAME, householdId: params.id },
        select: { id: true },
      });

      if (badge) {
        await prisma.userBadge.deleteMany({
          where: {
            userId: params.userId,
            badgeId: badge.id,
            householdId: params.id,
          },
        });
      }
    }
  }

  return NextResponse.json({ data: updated });
}

export async function DELETE(_req: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!hasPermission(requesterMembership, "canManageMembers")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const targetMembership = await prisma.householdMember.findUnique({
    where: {
      householdId_userId: {
        householdId: params.id,
        userId: params.userId,
      },
    },
    select: { id: true, role: true },
  });
  if (!targetMembership) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (targetMembership.role === "OWNER") {
    return NextResponse.json(
      { error: "Cannot remove the Owner" },
      { status: 403 }
    );
  }

  await prisma.householdMember.delete({
    where: { id: targetMembership.id },
  });

  return NextResponse.json({ data: { success: true } });
}
