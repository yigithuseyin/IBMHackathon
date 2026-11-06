import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calculatePoints } from "@/lib/scoring";
import { updateStreak } from "@/lib/streaks";
import { checkAndAwardBadges } from "@/lib/badges";

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

  const chore = await prisma.chore.findUnique({
    where: { id: params.choreId },
    select: {
      id: true,
      householdId: true,
      assignedToId: true,
      status: true,
      basePoints: true,
      difficulty: true,
      dueDate: true,
    },
  });

  if (!chore || chore.householdId !== params.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const isAdminOrOwner =
    membership.role === "OWNER" || membership.role === "ADMIN";

  if (!isAdminOrOwner && chore.assignedToId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (chore.status === "IN_REVIEW" || chore.status === "COMPLETED") {
    return NextResponse.json(
      { error: "Chore is already in review or completed" },
      { status: 400 }
    );
  }

  const completedAt = new Date();

  const existingStreak = await prisma.userStreak.findUnique({
    where: {
      userId_householdId: { userId: session.user.id, householdId: params.id },
    },
    select: { currentStreak: true },
  });
  const currentStreak = existingStreak?.currentStreak ?? 0;

  const { finalPoints, wasLate, wasEarly } = calculatePoints({
    basePoints: chore.basePoints,
    difficulty: chore.difficulty,
    dueDate: chore.dueDate,
    completedAt,
    currentStreak,
    isExempt: membership.isExempt,
  });

  const newStreak = await updateStreak(session.user.id, params.id, completedAt);

  const newStatus = isAdminOrOwner ? "COMPLETED" : "IN_REVIEW";

  const [completion] = await prisma.$transaction(async (tx) => {
    const created = await tx.choreCompletion.create({
      data: {
        choreId: chore.id,
        completedByUserId: session.user.id,
        householdId: params.id,
        pointsAwarded: finalPoints,
        completedAt,
        wasLate,
        wasEarly,
        streakAtCompletion: newStreak,
      },
    });

    await tx.chore.update({
      where: { id: chore.id },
      data: { status: newStatus },
    });

    if (isAdminOrOwner) {
      await tx.user.update({
        where: { id: session.user.id },
        data: { totalPoints: { increment: finalPoints } },
      });
    }

    return [created];
  });

  // Award badges after the transaction — non-blocking, errors are silently swallowed
  // so a badge failure never breaks the completion response.
  void checkAndAwardBadges(session.user.id, params.id).catch(() => {});

  return NextResponse.json({ data: { completion, pointsAwarded: finalPoints } });
}
