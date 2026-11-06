import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const joinSchema = z.object({
  inviteCode: z.string().length(8),
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = joinSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid invite code" }, { status: 400 });
  }

  const { inviteCode } = parsed.data;

  const household = await prisma.household.findUnique({
    where: { inviteCode },
  });
  if (!household) {
    return NextResponse.json({ error: "Household not found" }, { status: 404 });
  }

  const existing = await prisma.householdMember.findUnique({
    where: {
      householdId_userId: {
        householdId: household.id,
        userId: session.user.id,
      },
    },
  });
  if (existing) {
    return NextResponse.json({ error: "Already a member" }, { status: 400 });
  }

  await prisma.$transaction([
    prisma.householdMember.create({
      data: {
        householdId: household.id,
        userId: session.user.id,
        role: "MEMBER",
        permissions: "{}",
        isExempt: false,
      },
    }),
    prisma.userStreak.create({
      data: {
        userId: session.user.id,
        householdId: household.id,
        currentStreak: 0,
        longestStreak: 0,
      },
    }),
  ]);

  return NextResponse.json({ data: { householdId: household.id } });
}
