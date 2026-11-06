import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Params = { params: { id: string } };

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

  // System badges (householdId = null) + this household's custom badges
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
          userId: true,
          awardedAt: true,
          expiresAt: true,
          user: {
            select: {
              id: true,
              name: true,
              avatarColour: true,
            },
          },
        },
      },
    },
    orderBy: [{ type: "asc" }, { name: "asc" }],
  });

  return NextResponse.json({ data: badges });
}

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

  if (membership.role !== "OWNER" && membership.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body: {
    name?: string;
    description?: string;
    icon?: string;
    awardCondition?: string;
  } = await req.json();

  if (!body.name || !body.description || !body.icon) {
    return NextResponse.json(
      { error: "name, description, and icon are required" },
      { status: 400 }
    );
  }

  const badge = await prisma.badge.create({
    data: {
      name: body.name,
      description: body.description,
      icon: body.icon,
      type: "CUSTOM",
      isNegative: false,
      householdId: params.id,
      awardCondition: body.awardCondition ?? null,
    },
  });

  return NextResponse.json({ data: badge }, { status: 201 });
}

