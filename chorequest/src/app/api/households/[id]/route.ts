import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

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

  const household = await prisma.household.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      name: true,
      inviteCode: true,
      ownerId: true,
      createdAt: true,
      members: {
        select: {
          id: true,
          role: true,
          isExempt: true,
          joinedAt: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              avatarColour: true,
              totalPoints: true,
            },
          },
        },
      },
    },
  });

  if (!household) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ data: household });
}

export async function PATCH(req: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const household = await prisma.household.findUnique({
    where: { id: params.id },
    select: { ownerId: true },
  });
  if (!household) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (household.ownerId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body: { name?: string; regenerateInviteCode?: boolean } =
    await req.json();

  const data: { name?: string; inviteCode?: string } = {};
  if (body.name) {
    data.name = body.name;
  }
  if (body.regenerateInviteCode === true) {
    data.inviteCode = crypto.randomBytes(4).toString("hex");
  }

  const updated = await prisma.household.update({
    where: { id: params.id },
    data,
    select: {
      id: true,
      name: true,
      inviteCode: true,
      ownerId: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ data: updated });
}

export async function DELETE(_req: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const household = await prisma.household.findUnique({
    where: { id: params.id },
    select: { ownerId: true },
  });
  if (!household) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (household.ownerId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.household.delete({ where: { id: params.id } });

  return NextResponse.json({ data: { success: true } });
}
