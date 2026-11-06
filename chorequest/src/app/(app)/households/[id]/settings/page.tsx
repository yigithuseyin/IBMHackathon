import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { RenameSection } from "./RenameSection";
import { InviteCodeSection } from "./InviteCodeSection";
import { DangerZoneSection } from "./DangerZoneSection";

type Props = { params: { id: string } };

export default async function HouseholdSettingsPage({ params }: Props) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/login");
  }

  const household = await prisma.household.findUnique({
    where: { id: params.id },
    select: { id: true, name: true, inviteCode: true, ownerId: true },
  });

  if (!household) {
    notFound();
  }

  if (household.ownerId !== session.user.id) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
        <p className="text-gray-500 mb-4">Only the household owner can access settings.</p>
        <Link
          href={`/households/${params.id}`}
          className="inline-flex items-center px-4 py-2 rounded-lg border border-indigo-600 text-indigo-600 text-sm font-medium hover:bg-indigo-50 transition-colors"
        >
          ← Back
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <Link
          href={`/households/${params.id}`}
          className="text-indigo-600 hover:underline text-sm"
        >
          ← Back to {household.name}
        </Link>
      </div>

      <h1 className="text-2xl font-bold text-gray-900">Household Settings</h1>

      <RenameSection householdId={params.id} currentName={household.name} />

      <InviteCodeSection householdId={params.id} currentCode={household.inviteCode} />

      <DangerZoneSection householdId={params.id} householdName={household.name} />
    </div>
  );
}
