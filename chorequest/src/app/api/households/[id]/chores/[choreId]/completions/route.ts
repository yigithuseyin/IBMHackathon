import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Params = { params: { id: string; choreId: string } };

export async function GET(_req: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: householdId, choreId } = params;

  const membership = await prisma.householdMember.findUnique({
    where: { householdId_userId: { householdId, userId: session.user.id } },
  });
  if (!membership) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const chore = await prisma.chore.findUnique({
    where: { id: choreId },
    select: { householdId: true },
  });
  if (!chore || chore.householdId !== householdId) {
    return NextResponse.json({ error: "Chore not found" }, { status: 404 });
  }

  const completions = await prisma.choreCompletion.findMany({
    where: { choreId },
    orderBy: { completedAt: "desc" },
    select: {
      id: true,
      completedByUserId: true,
      completedAt: true,
      pointsAwarded: true,
      wasLate: true,
      wasEarly: true,
      completedBy: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json({ data: completions });
}
