"use client";

import { useState } from "react";
import Button from "./ui/Button";

export default function FlightReminderButton({ missingCount }: { missingCount: number }) {
  const [confirming, setConfirming] = useState(false);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  async function send() {
    setConfirming(false);
    setSending(true);
    setResult(null);
    try {
      const res = await fetch("/api/admin/flight-reminder", { method: "POST" });
      const data = await res.json();
      setResult(`Sent ${data.sent} reminder${data.sent === 1 ? "" : "s"}.`);
    } catch {
      setResult("Something went wrong.");
    } finally {
      setSending(false);
    }
  }

  if (confirming) {
    return (
      <div className="max-w-sm space-y-3 rounded-xl border-2 border-warning bg-warning-soft p-3">
        <p className="text-sm font-semibold text-warning">
          This will email everyone with a missing flight to add in their details. Are you sure you
          want to do this?
        </p>
        <div className="flex flex-wrap gap-2">
          <Button variant="primary" onClick={send} disabled={sending}>
            {sending ? "Sending..." : "Yes, send it"}
          </Button>
          <Button variant="ghost" onClick={() => setConfirming(false)} disabled={sending}>
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Button
        variant="secondary"
        onClick={() => setConfirming(true)}
        disabled={sending || missingCount === 0}
      >
        {`Send flight-details reminder (${missingCount})`}
      </Button>
      {result && <p className="text-sm text-muted">{result}</p>}
    </div>
  );
}
