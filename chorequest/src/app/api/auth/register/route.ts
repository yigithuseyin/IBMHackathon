import { NextResponse } from "next/server";
import { z } from "zod";
import bcryptjs from "bcryptjs";
import { prisma } from "@/lib/prisma";

const AVATAR_COLOURS = [
  "#6366f1",
  "#8b5cf6",
  "#ec4899",
  "#f59e0b",
  "#10b981",
  "#3b82f6",
  "#ef4444",
  "#14b8a6",
];

const registerSchema = z
  .object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export async function POST(req: Request) {
  const body = await req.json();
  const result = registerSchema.safeParse(body);

  if (!result.success) {
    const message = result.error.errors[0]?.message ?? "Invalid input";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const { name, email, password } = result.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "Email already in use" }, { status: 400 });
  }

  const passwordHash = await bcryptjs.hash(password, 12);
  const avatarColour =
    AVATAR_COLOURS[Math.floor(Math.random() * AVATAR_COLOURS.length)];

  const user = await prisma.user.create({
    data: { name, email, passwordHash, avatarColour },
    select: { id: true, name: true, email: true },
  });

  return NextResponse.json({ data: user }, { status: 201 });
}
