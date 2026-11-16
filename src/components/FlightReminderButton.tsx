"use client";

import { useState } from "react";
import { defaultFlightReminderTemplate } from "@/lib/flight-reminder-email";
import Button from "./ui/Button";

export default function FlightReminderButton({ missingCount }: { missingCount: number }) {
  const [reviewing, setReviewing] = useState(false);
  const [template, setTemplate] = useState(defaultFlightReminderTemplate);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  function startReview() {
    setResult(null);
    setTemplate(defaultFlightReminderTemplate());
    setReviewing(true);
  }

  async function send() {
    setSending(true);
    setResult(null);
    try {
      const res = await fetch("/api/admin/flight-reminder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ template }),
      });
      const data = await res.json();
      setResult(`Sent ${data.sent} reminder${data.sent === 1 ? "" : "s"}.`);
      setReviewing(false);
    } catch {
      setResult("Something went wrong.");
    } finally {
      setSending(false);
    }
  }

  if (reviewing) {
    return (
      <div className="max-w-lg space-y-3 rounded-xl border-2 border-warning bg-warning-soft p-3">
        <p className="text-sm font-semibold text-warning">
          This will email everyone missing complete flight details ({missingCount}). Review or edit
          the message below before sending.
        </p>
        <div>
          <label className="field-label" htmlFor="flight-reminder-template">
            Email text
          </label>
          <textarea
            id="flight-reminder-template"
            className="field h-56 resize-y font-mono text-xs"
            value={template}
            onChange={(e) => setTemplate(e.target.value)}
          />
          <p className="mt-1.5 text-xs text-muted">
            <code className="rounded bg-background px-1 py-0.5">{"{{first_name}}"}</code> and{" "}
            <code className="rounded bg-background px-1 py-0.5">{"{{magic_link}}"}</code> are replaced
            per recipient when sent.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="primary" onClick={send} disabled={sending || !template.trim()}>
            {sending ? "Sending..." : `Send to ${missingCount}`}
          </Button>
          <Button variant="ghost" onClick={() => setReviewing(false)} disabled={sending}>
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Button variant="secondary" onClick={startReview} disabled={sending || missingCount === 0}>
        {`Send flight-details reminder (${missingCount})`}
      </Button>
      {result && <p className="text-sm text-muted">{result}</p>}
    </div>
  );
}
