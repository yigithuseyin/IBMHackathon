import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Params = { params: { id: string; choreId: string } };

const choreSelect = {
  id: true,
  title: true,
  description: true,
  difficulty: true,
  basePoints: true,
  dueDate: true,
  status: true,
  isRecurring: true,
  createdAt: true,
  updatedAt: true,
  createdById: true,
  assignedToId: true,
  assignedTo: {
    select: { id: true, name: true, avatarColour: true },
  },
  createdBy: {
    select: { id: true, name: true, avatarColour: true },
  },
} as const;

const patchSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  difficulty: z.enum(["EASY", "MEDIUM", "HARD"]).optional(),
  basePoints: z.number().int().min(1).max(1000).optional(),
  dueDate: z.string().optional(),
  assignedToId: z.string().nullable().optional(),
});

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

  const chore = await prisma.chore.findUnique({
    where: { id: params.choreId },
    select: choreSelect,
  });

  if (!chore || chore.assignedTo === null && false) {
    // just a type-narrowing no-op
  }

  if (!chore) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ data: chore });
}

export async function PATCH(req: Request, { params }: Params) {
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
    select: { id: true, createdById: true, householdId: true },
  });

  if (!chore || chore.householdId !== params.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const canEdit =
    membership.role === "OWNER" ||
    membership.role === "ADMIN" ||
    chore.createdById === session.user.id;

  if (!canEdit) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body: unknown = await req.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const { title, description, difficulty, basePoints, dueDate, assignedToId } =
    parsed.data;

  if (assignedToId) {
    const assigneeMembership = await prisma.householdMember.findUnique({
      where: {
        householdId_userId: {
          householdId: params.id,
          userId: assignedToId,
        },
      },
    });
    if (!assigneeMembership) {
      return NextResponse.json(
        { error: "Assignee is not a member of this household" },
        { status: 400 }
      );
    }
  }

  const updated = await prisma.chore.update({
    where: { id: params.choreId },
    data: {
      ...(title !== undefined ? { title } : {}),
      ...(description !== undefined ? { description } : {}),
      ...(difficulty !== undefined ? { difficulty } : {}),
      ...(basePoints !== undefined ? { basePoints } : {}),
      ...(dueDate !== undefined ? { dueDate: dueDate ? new Date(dueDate) : null } : {}),
      ...(assignedToId !== undefined ? { assignedToId } : {}),
    },
    select: choreSelect,
  });

  return NextResponse.json({ data: updated });
}

export async function DELETE(_req: Request, { params }: Params) {
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

  const chore = await prisma.chore.findUnique({
    where: { id: params.choreId },
    select: { id: true, householdId: true },
  });

  if (!chore || chore.householdId !== params.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.chore.delete({ where: { id: params.choreId } });

  return NextResponse.json({ data: { deleted: true } });
}
