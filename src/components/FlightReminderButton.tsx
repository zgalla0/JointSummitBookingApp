"use client";

import { useState } from "react";
import Button from "./ui/Button";

export default function FlightReminderButton({ missingCount }: { missingCount: number }) {
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  async function send() {
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

  return (
    <div className="space-y-2">
      <Button variant="secondary" onClick={send} disabled={sending || missingCount === 0}>
        {sending ? "Sending..." : `Send flight-details reminder (${missingCount})`}
      </Button>
      {result && <p className="text-sm text-muted">{result}</p>}
    </div>
  );
}
