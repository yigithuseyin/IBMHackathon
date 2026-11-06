import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateInviteCode } from "@/lib/utils";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const memberships = await prisma.householdMember.findMany({
    where: { userId: session.user.id },
    include: {
      household: {
        select: {
          id: true,
          name: true,
          inviteCode: true,
          _count: { select: { members: true } },
        },
      },
    },
  });

  const data = memberships.map((m) => ({
    id: m.household.id,
    name: m.household.name,
    inviteCode: m.household.inviteCode,
    memberCount: m.household._count.members,
    role: m.role,
  }));

  return NextResponse.json({ data });
}

const createSchema = z.object({
  name: z.string().min(1).max(50),
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const { name } = parsed.data;
  const inviteCode = generateInviteCode();

  const result = await prisma.$transaction(async (tx) => {
    const household = await tx.household.create({
      data: {
        name,
        inviteCode,
        ownerId: session.user.id,
      },
    });
    await tx.householdMember.create({
      data: {
        householdId: household.id,
        userId: session.user.id,
        role: "OWNER",
        permissions: "{}",
        isExempt: false,
      },
    });
    return household;
  });

  return NextResponse.json(
    { data: { id: result.id, name: result.name, inviteCode: result.inviteCode } },
    { status: 201 }
  );
}
