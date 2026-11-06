"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

type Props = {
  householdId: string;
  householdName: string;
};

export function DangerZoneSection({ householdId, householdName }: Props) {
  const router = useRouter();
  const [confirmation, setConfirmation] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canDelete = confirmation === householdName;

  async function handleDelete() {
    if (!canDelete) return;
    setDeleting(true);
    setError(null);

    const res = await fetch(`/api/households/${householdId}`, {
      method: "DELETE",
    });
    const json = await res.json();

    if (!res.ok) {
      setDeleting(false);
      setError(json.error ?? "Failed to delete household.");
    } else {
      router.push("/dashboard");
    }
  }

  return (
    <section className="bg-white border border-red-200 rounded-xl p-6">
      <h2 className="text-lg font-semibold text-red-700 mb-2">Danger Zone</h2>
      <p className="text-sm text-gray-500 mb-4">
        Deleting the household is permanent and cannot be undone. All chores,
        members, badges, and completions will be removed.
      </p>
      <p className="text-sm text-gray-700 mb-2">
        Type <span className="font-semibold">{householdName}</span> to confirm:
      </p>
      <div className="flex gap-3">
        <input
          type="text"
          value={confirmation}
          onChange={(e) => setConfirmation(e.target.value)}
          placeholder={householdName}
          className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
        />
        <Button
          variant="danger"
          onClick={handleDelete}
          disabled={!canDelete || deleting}
        >
          {deleting ? "Deleting…" : "Delete Household"}
        </Button>
      </div>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </section>
  );
}
