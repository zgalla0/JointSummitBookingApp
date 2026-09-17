"use client";

import { useState } from "react";
import Button from "./ui/Button";

export type ReminderRecipient = { email: string; firstName: string };

export default function RosterReminderButton({ recipients }: { recipients: ReminderRecipient[] }) {
  const [confirming, setConfirming] = useState(false);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  async function send() {
    setConfirming(false);
    setSending(true);
    setResult(null);
    try {
      const res = await fetch("/api/admin/roster-reminder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipients }),
      });
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
          This will email everyone in the table above a reminder to fill out the form. Are you sure
          you want to do this?
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
        disabled={sending || recipients.length === 0}
      >
        {`Send reminder email (${recipients.length})`}
      </Button>
      {result && <p className="text-sm text-muted">{result}</p>}
    </div>
  );
}
