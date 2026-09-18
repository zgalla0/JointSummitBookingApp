"use client";

import { useState } from "react";
import { defaultRosterReminderTemplate } from "@/lib/roster-reminder-email";
import Button from "./ui/Button";

export type ReminderRecipient = { email: string; firstName: string };

export default function RosterReminderButton({ recipients }: { recipients: ReminderRecipient[] }) {
  const [reviewing, setReviewing] = useState(false);
  const [template, setTemplate] = useState(defaultRosterReminderTemplate);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  function startReview() {
    setResult(null);
    setTemplate(defaultRosterReminderTemplate());
    setReviewing(true);
  }

  async function send() {
    setSending(true);
    setResult(null);
    try {
      const res = await fetch("/api/admin/roster-reminder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipients, template }),
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
          This will email everyone in the table above ({recipients.length}{" "}
          {recipients.length === 1 ? "person" : "people"}). Review or edit the message below before
          sending.
        </p>
        <div>
          <label className="field-label" htmlFor="reminder-template">
            Email text
          </label>
          <textarea
            id="reminder-template"
            className="field h-56 resize-y font-mono text-xs"
            value={template}
            onChange={(e) => setTemplate(e.target.value)}
          />
          <p className="mt-1.5 text-xs text-muted">
            <code className="rounded bg-background px-1 py-0.5">{"{{first_name}}"}</code> is replaced
            with each person&apos;s first name when sent.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="primary" onClick={send} disabled={sending || !template.trim()}>
            {sending ? "Sending..." : `Send to ${recipients.length}`}
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
      <Button variant="secondary" onClick={startReview} disabled={sending || recipients.length === 0}>
        {`Send reminder email (${recipients.length})`}
      </Button>
      {result && <p className="text-sm text-muted">{result}</p>}
    </div>
  );
}
