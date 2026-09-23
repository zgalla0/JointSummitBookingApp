"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { emailLookupSchema, type EmailLookupInput } from "@/lib/booking-schema";
import { Field } from "./BookingFields";
import Card from "./ui/Card";
import Button from "./ui/Button";

export default function ResendLinkForm() {
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const form = useForm<EmailLookupInput>({
    resolver: zodResolver(emailLookupSchema),
    defaultValues: { email: "" },
  });

  async function onSubmit(values: EmailLookupInput) {
    setSubmitting(true);
    try {
      await fetch("/api/bookings/resend-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      setSent(true);
    } finally {
      setSubmitting(false);
    }
  }

  if (sent) {
    return (
      <Card title="Check your email">
        <p className="text-muted">
          If we found a booking under that email, we&apos;ve emailed a link to you to manage your
          existing booking. Give it a minute to arrive.
        </p>
      </Card>
    );
  }

  return (
    <Card eyebrow="Find your booking" title="Resend my link">
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <Field label="Cuesta email" error={form.formState.errors.email?.message}>
          <input className="field" placeholder="you@cuestapartners.com" {...form.register("email")} />
        </Field>
        <Button type="submit" disabled={submitting}>
          {submitting ? "Sending..." : "Send my link"}
        </Button>
      </form>
    </Card>
  );
}
