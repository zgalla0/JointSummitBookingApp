"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { bookingFormSchema, type BookingFormInput } from "@/lib/booking-schema";
import { HOTEL_EXPORT_PULLER_OPTIONS } from "@/lib/hotel-export-log-options";
import Button from "./ui/Button";
import BookingFields, { needsRoomTypeChoice, hasUndecidedNights, type FormConfig } from "./BookingFields";

/** Full-booking editor for the admin detail page - the same BookingFields
 *  used by the attendee's own magic-link edit, so every field they can set
 *  an admin can set too, through the same validation (keeps data honest -
 *  this isn't where out-of-policy overrides live, that's the separate
 *  Overrides card below it). No attendee-facing emails fire from here. */
export default function AdminEditBookingForm({
  bookingId,
  defaultValues,
  formConfig,
}: {
  bookingId: string;
  defaultValues: BookingFormInput;
  formConfig: FormConfig;
}) {
  const router = useRouter();
  const [editedBy, setEditedBy] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const form = useForm<BookingFormInput>({
    resolver: zodResolver(bookingFormSchema),
    defaultValues,
  });

  async function onSave(values: BookingFormInput) {
    if (!editedBy) {
      setError("Please select who is making this edit.");
      return;
    }
    let hasCustomError = false;
    if (hasUndecidedNights(values, formConfig)) {
      form.setError("selfPayNights", {
        type: "manual",
        message: "Please choose who pays for the optional night(s) above",
      });
      hasCustomError = true;
    }
    if (values.extraNightsRoomType === "" && needsRoomTypeChoice(values)) {
      form.setError("extraNightsRoomType", {
        type: "manual",
        message: "Please choose a room type for the night(s) outside the standard rate",
      });
      hasCustomError = true;
    }
    if (hasCustomError) {
      onSaveInvalid();
      return;
    }
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const res = await fetch(`/api/admin/bookings/${bookingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, editedBy }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error?.formErrors?.[0] ?? "Something went wrong, please try again.");
      }
      setSaved(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  function onSaveInvalid() {
    setError("Some fields are invalid - check the sections highlighted in red.");
  }

  return (
    <form onSubmit={form.handleSubmit(onSave, onSaveInvalid)} className="space-y-5">
      <p className="text-sm text-muted">
        Saving here recomputes company-paid nights from the usual rules (forced + whatever&apos;s
        chosen in the stay-dates picker below) - a one-off override made in the Overrides card gets
        overwritten if you save this form afterward. Re-apply it there if you still need it.
      </p>

      <BookingFields mainForm={form} formConfig={formConfig} />

      <div className="space-y-3 rounded-2xl bg-background p-4">
        <label className="field-label block" htmlFor="admin-edited-by">
          Who is making this edit?
        </label>
        <select
          id="admin-edited-by"
          className="field"
          value={editedBy}
          onChange={(e) => setEditedBy(e.target.value)}
        >
          <option value="">Select a name</option>
          {HOTEL_EXPORT_PULLER_OPTIONS.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>

        {error && <p className="text-sm font-semibold text-red-600">{error}</p>}
        {saved && !error && <p className="text-sm font-semibold text-foreground">Saved.</p>}

        <Button type="submit" disabled={saving}>
          {saving ? "Saving..." : "Save changes"}
        </Button>
      </div>
    </form>
  );
}
