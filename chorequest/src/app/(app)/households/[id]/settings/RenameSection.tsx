"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

type Props = {
  householdId: string;
  currentName: string;
};

export function RenameSection({ householdId, currentName }: Props) {
  const router = useRouter();
  const [name, setName] = useState(currentName);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSave() {
    if (!name.trim() || name.trim() === currentName) return;
    setSaving(true);
    setError(null);
    setSuccess(false);

    const res = await fetch(`/api/households/${householdId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim() }),
    });
    const json = await res.json();
    setSaving(false);

    if (!res.ok) {
      setError(json.error ?? "Failed to rename household.");
    } else {
      setSuccess(true);
      router.refresh();
    }
  }

  return (
    <section className="bg-white border border-gray-200 rounded-xl p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Household Name</h2>
      <p className="text-sm text-gray-500 mb-4">
        Current name: <span className="font-medium text-gray-800">{currentName}</span>
      </p>
      <div className="flex gap-3">
        <input
          type="text"
          value={name}
          onChange={(e) => { setName(e.target.value); setSuccess(false); }}
          className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder="New household name"
        />
        <Button
          onClick={handleSave}
          disabled={saving || !name.trim() || name.trim() === currentName}
        >
          {saving ? "Saving…" : "Save"}
        </Button>
      </div>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      {success && <p className="mt-2 text-sm text-green-600">Name updated!</p>}
    </section>
  );
}
