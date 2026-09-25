"use client";

import { useState, type FormEvent } from "react";
import Card from "./ui/Card";
import Button from "./ui/Button";

/** Open-ended feedback on the form itself (not a booking action) - shown
 *  below the FAQ so it's the last thing anyone reads before they leave the
 *  page, whether or not they ended up submitting a booking. No email is
 *  sent; suggestions just show up on the admin Suggestions page. */
export default function FormSuggestionBox() {
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "done" | "error">("idle");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!message.trim() || status === "submitting") return;
    setStatus("submitting");
    try {
      const res = await fetch("/api/form-suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });
      if (!res.ok) throw new Error("Request failed");
      setMessage("");
      setStatus("done");
    } catch {
      setStatus("error");
    }
  }

  return (
    <div className="space-y-6">
      <div className="animate-in space-y-1">
        <p className="eyebrow">Feedback</p>
        <h2 className="text-2xl font-bold tracking-tight">
          Any thoughts or suggestions on how we can improve this app?
        </h2>
      </div>
      <Card>
        {status === "done" ? (
          <p className="text-sm font-semibold text-foreground">Thanks for submitting your feedback!</p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <textarea
              className="field"
              rows={4}
              placeholder="Your feedback"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
            {status === "error" && (
              <p className="text-sm font-semibold text-warning">Something went wrong, please try again.</p>
            )}
            <Button type="submit" disabled={status === "submitting" || !message.trim()}>
              Submit
            </Button>
          </form>
        )}
      </Card>
    </div>
  );
}
