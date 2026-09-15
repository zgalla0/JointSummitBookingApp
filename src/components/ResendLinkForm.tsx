"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { identitySchema, type IdentityInput } from "@/lib/booking-schema";
import { Field } from "./BookingFields";
import Card from "./ui/Card";
import Button from "./ui/Button";

export default function ResendLinkForm() {
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const form = useForm<IdentityInput>({
    resolver: zodResolver(identitySchema),
    defaultValues: { firstName: "", lastName: "", email: "" },
  });

  async function onSubmit(values: IdentityInput) {
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
          If we found a booking under that name, we&apos;ve emailed a link to the email
          associated with your original form (note this may not be your Cuesta email) to manage
          your existing booking. Give it a minute to arrive.
        </p>
      </Card>
    );
  }

  return (
    <Card eyebrow="Find your booking" title="Resend my link">
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="First name" error={form.formState.errors.firstName?.message}>
            <input className="field" {...form.register("firstName")} />
          </Field>
          <Field label="Last name" error={form.formState.errors.lastName?.message}>
            <input className="field" {...form.register("lastName")} />
          </Field>
        </div>
        <Field label="Email" error={form.formState.errors.email?.message}>
          <input className="field" {...form.register("email")} />
        </Field>
        <Button type="submit" disabled={submitting}>
          {submitting ? "Sending..." : "Send my link"}
        </Button>
      </form>
    </Card>
  );
}
