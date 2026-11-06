import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/permissions";

type Params = { params: { id: string } };

// GET /api/households/[id]/badges
// Returns all system badges + household custom badges with their winners
export async function GET(_req: Request, { params }: Params) {
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

  const badges = await prisma.badge.findMany({
    where: {
      OR: [{ householdId: null }, { householdId: params.id }],
    },
    select: {
      id: true,
      name: true,
      description: true,
      icon: true,
      type: true,
      isNegative: true,
      householdId: true,
      awardCondition: true,
      userBadges: {
        where: { householdId: params.id },
        select: {
          id: true,
          awardedAt: true,
          expiresAt: true,
          user: { select: { id: true, name: true } },
        },
      },
    },
    orderBy: [{ type: "asc" }, { name: "asc" }],
  });

  const data = badges.map((badge) => ({
    id: badge.id,
    name: badge.name,
    description: badge.description,
    icon: badge.icon,
    type: badge.type,
    isNegative: badge.isNegative,
    householdId: badge.householdId,
    awardCondition: badge.awardCondition,
    winners: badge.userBadges.map((ub) => ({
      userId: ub.user.id,
      userName: ub.user.name,
      awardedAt: ub.awardedAt,
      expiresAt: ub.expiresAt,
    })),
  }));

  return NextResponse.json({ data });
}

const createBadgeSchema = z.object({
  name: z.string().min(1),
  description: z.string(),
  icon: z.string().max(2),
  awardCondition: z.string().optional(),
});

// POST /api/households/[id]/badges
// Create a custom badge for this household (OWNER/ADMIN or canAwardBadges)
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
  const parsed = createBadgeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.message }, { status: 400 });
  }

  const { name, description, icon, awardCondition } = parsed.data;

  const badge = await prisma.badge.create({
    data: {
      name,
      description,
      icon,
      type: "CUSTOM",
      householdId: params.id,
      awardCondition: awardCondition ?? null,
    },
  });

  return NextResponse.json({ data: badge }, { status: 201 });
}
