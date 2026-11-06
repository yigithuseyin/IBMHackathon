import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/permissions";
import { awardCustomBadge } from "@/lib/badges";

type Params = { params: { id: string; badgeId: string } };

const awardSchema = z.object({
  userId: z.string(),
  expiresAt: z.string().datetime().optional(),
});

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

  const body: unknown = await req.json();
  const parsed = awardSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.message }, { status: 400 });
  }

  const { userId, expiresAt } = parsed.data;

  // Verify the target user is a member of this household
  const targetMembership = await prisma.householdMember.findUnique({
    where: {
      householdId_userId: { householdId: params.id, userId },
    },
  });
  if (!targetMembership) {
    return NextResponse.json(
      { error: "User is not a member of this household" },
      { status: 400 }
    );
  }

  try {
    await awardCustomBadge(
      userId,
      params.badgeId,
      params.id,
      session.user.id,
      expiresAt ? new Date(expiresAt) : undefined
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  return NextResponse.json({ data: { awarded: true } });
}
