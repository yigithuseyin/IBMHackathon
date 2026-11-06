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

  const members = await prisma.householdMember.findMany({
    where: { householdId: params.id },
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
          badges: {
            where: { householdId: params.id },
            select: { id: true },
          },
        },
      },
    },
    orderBy: { joinedAt: "asc" },
  });

  const result = members.map((m) => ({
    ...m,
    badgesCount: m.user.badges.length,
    user: { ...m.user, badges: undefined },
  }));

  return NextResponse.json({ data: result });
}
