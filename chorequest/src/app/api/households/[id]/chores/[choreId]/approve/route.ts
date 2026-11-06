import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/permissions";

type Params = { params: { id: string; choreId: string } };

export async function POST(_req: Request, { params }: Params) {
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

  if (!hasPermission(membership, "canApproveCompletions")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const chore = await prisma.chore.findUnique({
    where: { id: params.choreId },
    select: { id: true, householdId: true, status: true },
  });

  if (!chore || chore.householdId !== params.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (chore.status !== "IN_REVIEW") {
    return NextResponse.json(
      { error: "Chore is not in review" },
      { status: 400 }
    );
  }

  const pendingCompletion = await prisma.choreCompletion.findFirst({
    where: { choreId: params.choreId, approvedAt: null },
    orderBy: { completedAt: "desc" },
  });

  if (!pendingCompletion) {
    return NextResponse.json(
      { error: "No pending completion found" },
      { status: 400 }
    );
  }

  const now = new Date();

  const [completion] = await prisma.$transaction(async (tx) => {
    const updated = await tx.choreCompletion.update({
      where: { id: pendingCompletion.id },
      data: {
        approvedById: session.user.id,
        approvedAt: now,
      },
    });

    await tx.chore.update({
      where: { id: params.choreId },
      data: { status: "COMPLETED" },
    });

    await tx.user.update({
      where: { id: pendingCompletion.completedByUserId },
      data: { totalPoints: { increment: pendingCompletion.pointsAwarded } },
    });

    return [updated];
  });

  return NextResponse.json({ data: { completion } });
}
