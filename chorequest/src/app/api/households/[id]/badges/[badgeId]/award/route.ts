import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/permissions";

type Params = { params: { id: string; badgeId: string } };

export async function POST(req: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!hasPermission(membership, "canAwardBadges")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const badge = await prisma.badge.findUnique({
    where: { id: params.badgeId },
    select: { id: true, householdId: true },
  });
  if (!badge) {
    return NextResponse.json({ error: "Badge not found" }, { status: 404 });
  }
  // Badge must be a system badge or belong to this household
  if (badge.householdId !== null && badge.householdId !== params.id) {
    return NextResponse.json({ error: "Badge not found" }, { status: 404 });
  }

  const body: { userId?: string; expiresAt?: string } = await req.json();
  if (!body.userId) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 });
  }

  // Confirm the target user is a member of this household
  const targetMembership = await prisma.householdMember.findUnique({
    where: {
      householdId_userId: {
        householdId: params.id,
        userId: body.userId,
      },
    },
    select: { id: true },
  });
  if (!targetMembership) {
    return NextResponse.json(
      { error: "User is not a member of this household" },
      { status: 400 }
    );
  }

  const existing = await prisma.userBadge.findFirst({
    where: {
      userId: body.userId,
      badgeId: params.badgeId,
      householdId: params.id,
    },
    select: { id: true },
  });

  const expiresAt = body.expiresAt ? new Date(body.expiresAt) : null;

  let userBadge;
  if (existing) {
    userBadge = await prisma.userBadge.update({
      where: { id: existing.id },
      data: {
        awardedByUserId: session.user.id,
        awardedAt: new Date(),
        expiresAt,
      },
    });
  } else {
    userBadge = await prisma.userBadge.create({
      data: {
        userId: body.userId,
        badgeId: params.badgeId,
        householdId: params.id,
        awardedByUserId: session.user.id,
        expiresAt,
      },
    });
  }

  return NextResponse.json({ data: userBadge });
}
