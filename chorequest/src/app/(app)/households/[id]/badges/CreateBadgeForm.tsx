"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";

type Props = {
  householdId: string;
};

export function CreateBadgeForm({ householdId }: Props) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState("");
  const [awardCondition, setAwardCondition] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await fetch(`/api/households/${householdId}/badges`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, description, icon, awardCondition }),
    });

    const json = (await res.json()) as { error?: string };
    setLoading(false);

    if (!res.ok) {
      setError(json.error ?? "Failed to create badge");
      return;
    }

    setName("");
    setDescription("");
    setIcon("");
    setAwardCondition("");
    router.refresh();
  }

  return (
    <Card>
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        Create Custom Badge
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              maxLength={80}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="e.g. Speed Demon"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Icon (1–2 chars / emoji)
            </label>
            <input
              value={icon}
              onChange={(e) => setIcon(e.target.value)}
              required
              maxLength={2}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="🎯"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="What does this badge mean?"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Award condition (optional)
          </label>
          <input
            value={awardCondition}
            onChange={(e) => setAwardCondition(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="e.g. Complete 3 chores in one day"
          />
        </div>
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center justify-center rounded-lg font-medium transition-colors bg-indigo-600 text-white hover:bg-indigo-700 px-4 py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Creating…" : "Create Badge"}
        </button>
      </form>
    </Card>
  );
}
