"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { bookingFormSchema, type BookingFormInput } from "@/lib/booking-schema";
import { NoticeBannerFull, NoticeBannerShort } from "./ui/NoticeBanner";
import Card from "./ui/Card";
import Button from "./ui/Button";
import BookingFields, { needsRoomTypeChoice, type FormConfig } from "./BookingFields";

type Step = "edit" | "confirmCancel" | "cancelled" | "saved";

export default function EditBookingForm({
  token,
  defaultValues,
  formConfig,
  isCancelled,
  lockedIn,
}: {
  token: string;
  defaultValues: BookingFormInput;
  formConfig: FormConfig;
  isCancelled: boolean;
  lockedIn: boolean;
}) {
  const [step, setStep] = useState<Step>(isCancelled ? "cancelled" : "edit");
  const [saving, setSaving] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<BookingFormInput>({
    resolver: zodResolver(bookingFormSchema),
    defaultValues,
  });

  async function onSave(values: BookingFormInput) {
    if (values.extraNightsRoomType === "" && needsRoomTypeChoice(values)) {
      form.setError("extraNightsRoomType", {
        type: "manual",
        message: "Please choose a room type for the night(s) outside the standard rate",
      });
      onSaveInvalid();
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/bookings/${token}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error?.formErrors?.[0] ?? "Something went wrong, please try again.");
      }
      setStep("saved");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  function onSaveInvalid() {
    setError("You're missing some required items above, check the sections highlighted in red.");
  }

  async function onCancelConfirmed() {
    setCancelling(true);
    setError(null);
    try {
      const res = await fetch(`/api/bookings/${token}/cancel`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error?.formErrors?.[0] ?? "Something went wrong, please try again.");
      }
      setStep("cancelled");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setCancelling(false);
    }
  }

  const header = (
    <div className="animate-in space-y-1">
      <div className="flex items-center justify-between gap-4">
        <p className="eyebrow">Manage your booking</p>
        <Link
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-semibold text-accent-dark hover:underline"
        >
          Agenda &amp; FAQ →
        </Link>
      </div>
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Summit attendance &amp; booking form</h1>
    </div>
  );

  if (lockedIn && step === "edit") {
    return (
      <div className="space-y-6">
        {header}
        <Card title="Reservations are locked in">
          <p className="text-muted">
            We locked in reservations with the hotel one month before the event, so this page can no
            longer make automatic changes. Please reach out to the planning team directly if you
            need to update or cancel your booking.
          </p>
        </Card>
      </div>
    );
  }

  if (step === "cancelled") {
    return (
      <div className="space-y-6">
        {header}
        <Card title="Booking cancelled">
          <div className="space-y-3">
            <p className="text-muted">
              This booking has been cancelled. If that was a mistake, or you&apos;d like to rejoin,
              just submit the form again with your details.
            </p>
            <Link href="/" className="font-semibold text-accent-dark hover:underline">
              Go to the booking form →
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  if (step === "saved") {
    return (
      <div className="space-y-6">
        {header}
        <Card title="Changes saved">
          <div className="space-y-3">
            <p className="text-muted">
              Your booking has been updated. A confirmation email is on its way.
            </p>
            <NoticeBannerShort />
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {header}
      <NoticeBannerFull />

      {step !== "edit" && error && (
        <div className="animate-in rounded-2xl bg-red-50 p-4 text-sm text-red-700">{error}</div>
      )}

      {step === "confirmCancel" ? (
        <Card eyebrow="Cancel" title="Cancel your booking?">
          <div className="space-y-4">
            <p className="text-muted">
              This will cancel your entire hotel booking for the Summit. You can always submit the
              form again later if you change your mind.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button variant="primary" onClick={onCancelConfirmed} disabled={cancelling}>
                {cancelling ? "Cancelling..." : "Yes, cancel my booking"}
              </Button>
              <Button variant="ghost" onClick={() => setStep("edit")} disabled={cancelling}>
                Never mind, keep my booking
              </Button>
            </div>
          </div>
        </Card>
      ) : (
        <form onSubmit={form.handleSubmit(onSave, onSaveInvalid)} className="space-y-5">
          <BookingFields mainForm={form} formConfig={formConfig} />

          <NoticeBannerShort />

          {error && (
            <div className="animate-in rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-700">
              {error}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit" disabled={saving}>
              {saving ? "Saving..." : "Save changes"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setStep("confirmCancel")}
              disabled={saving}
            >
              Cancel my booking
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
