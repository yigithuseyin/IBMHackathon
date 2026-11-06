"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

type Props = {
  householdId: string;
  currentCode: string;
};

export function InviteCodeSection({ householdId, currentCode }: Props) {
  const router = useRouter();
  const [code, setCode] = useState(currentCode);
  const [copied, setCopied] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCopy() {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleRegenerate() {
    const confirmed = window.confirm(
      "Regenerate the invite code? The current code will stop working immediately."
    );
    if (!confirmed) return;

    setRegenerating(true);
    setError(null);

    const res = await fetch(`/api/households/${householdId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ regenerateInviteCode: true }),
    });
    const json = await res.json();
    setRegenerating(false);

    if (!res.ok) {
      setError(json.error ?? "Failed to regenerate invite code.");
    } else {
      setCode(json.data.inviteCode);
      router.refresh();
    }
  }

  return (
    <section className="bg-white border border-gray-200 rounded-xl p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Invite Code</h2>
      <p className="text-sm text-gray-500 mb-4">
        Share this code with people you want to invite to your household.
      </p>
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <span className="font-mono text-lg font-semibold tracking-widest text-gray-800 bg-gray-100 px-4 py-2 rounded-lg">
          {code}
        </span>
        <Button variant="secondary" size="sm" onClick={handleCopy}>
          {copied ? "Copied!" : "Copy"}
        </Button>
      </div>
      <Button
        variant="secondary"
        size="sm"
        onClick={handleRegenerate}
        disabled={regenerating}
      >
        {regenerating ? "Regenerating…" : "Regenerate Code"}
      </Button>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </section>
  );
}
