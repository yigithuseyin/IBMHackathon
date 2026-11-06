import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/permissions";

type Params = { params: { id: string } };

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
  assignedTo: {
    select: { id: true, name: true, avatarColour: true },
  },
  createdBy: {
    select: { id: true, name: true, avatarColour: true },
  },
} as const;

const createSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  difficulty: z.enum(["EASY", "MEDIUM", "HARD"]),
  basePoints: z.number().int().min(1).max(1000),
  dueDate: z.string().optional(),
  assignedToId: z.string().optional(),
});

export async function GET(req: Request, { params }: Params) {
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

  // Update overdue chores before returning
  const now = new Date();
  await prisma.chore.updateMany({
    where: {
      householdId: params.id,
      status: { in: ["PENDING", "IN_REVIEW"] },
      dueDate: { lt: now },
    },
    data: { status: "OVERDUE" },
  });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") ?? undefined;
  const assignedToId = searchParams.get("assignedToId") ?? undefined;

  const chores = await prisma.chore.findMany({
    where: {
      householdId: params.id,
      ...(status ? { status } : {}),
      ...(assignedToId ? { assignedToId } : {}),
    },
    select: choreSelect,
    orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
  });

  return NextResponse.json({ data: chores });
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

  if (!hasPermission(membership, "canCreateChores")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body: unknown = await req.json();
  const parsed = createSchema.safeParse(body);
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

  const chore = await prisma.chore.create({
    data: {
      householdId: params.id,
      title,
      description,
      difficulty,
      basePoints,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      assignedToId: assignedToId ?? null,
      createdById: session.user.id,
      status: "PENDING",
    },
    select: choreSelect,
  });

  return NextResponse.json({ data: chore }, { status: 201 });
}
