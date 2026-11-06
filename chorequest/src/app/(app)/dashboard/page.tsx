import { getServerSession } from "next-auth";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  const memberships = await prisma.householdMember.findMany({
    where: { userId: session!.user.id },
    include: {
      household: {
        select: {
          id: true,
          name: true,
          _count: { select: { members: true } },
        },
      },
    },
    orderBy: { joinedAt: "asc" },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">
            Welcome back, {session?.user?.name ?? "there"}!
          </h1>
          <p className="text-gray-500 text-sm mt-1">Your households</p>
        </div>
        <div className="flex gap-2">
          <Link href="/households/join">
            <Button variant="secondary" size="sm">Join Household</Button>
          </Link>
          <Link href="/households/new">
            <Button size="sm">New Household</Button>
          </Link>
        </div>
      </div>

      {memberships.length === 0 ? (
        <Card className="flex flex-col items-center gap-4 py-12 text-center">
          <p className="text-gray-500">You are not a member of any household yet.</p>
          <div className="flex gap-3">
            <Link href="/households/join">
              <Button variant="secondary">Join with Invite Code</Button>
            </Link>
            <Link href="/households/new">
              <Button>Create your first household</Button>
            </Link>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {memberships.map(({ household, role }) => (
            <Card key={household.id} className="flex flex-col gap-3">
              <div>
                <h2 className="font-semibold text-lg text-gray-900">{household.name}</h2>
                <p className="text-sm text-gray-500">
                  {household._count.members} member{household._count.members !== 1 ? "s" : ""} · {role}
                </p>
              </div>
              <Link href={`/households/${household.id}`} className="mt-auto">
                <Button variant="secondary" size="sm" className="w-full">
                  Go to Household
                </Button>
              </Link>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
