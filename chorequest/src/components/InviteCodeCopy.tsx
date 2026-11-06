"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";

type Props = {
  inviteCode: string;
};

export function InviteCodeCopy({ inviteCode }: Props) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex items-center gap-3">
      <span className="font-mono text-lg font-semibold tracking-widest text-gray-800 bg-gray-100 px-4 py-2 rounded-lg">
        {inviteCode}
      </span>
      <Button variant="secondary" size="sm" onClick={handleCopy}>
        {copied ? "Copied!" : "Copy"}
      </Button>
    </div>
  );
}
