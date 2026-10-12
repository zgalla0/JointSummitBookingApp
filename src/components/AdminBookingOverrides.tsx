"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatShortDate } from "@/lib/format";
import { HOTEL_EXPORT_PULLER_OPTIONS } from "@/lib/hotel-export-log-options";
import Button from "./ui/Button";
import Checkbox from "./ui/Checkbox";

/** Admin-only overrides that fall outside the booking form's normal rules -
 *  e.g. covering an extra night that isn't one of the two configured
 *  optional nights, or leaving a free-text note for the hotel (early
 *  check-in, a reservation issue, etc.). The attendee never sees either of
 *  these; they're set here and here only. */
export default function AdminBookingOverrides({
  bookingId,
  nights,
  companyPaidNights,
  hotelNote,
}: {
  bookingId: string;
  /** Every night of this booking's stay (not just the ones config normally
   *  allows to be company-paid) - any of them can be toggled here. */
  nights: string[];
  companyPaidNights: string[];
  hotelNote: string;
}) {
  const router = useRouter();
  const [selected, setSelected] = useState(new Set(companyPaidNights));
  const [note, setNote] = useState(hotelNote);
  const [editedBy, setEditedBy] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  function toggle(night: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(night)) next.delete(night);
      else next.add(night);
      return next;
    });
  }

  async function save() {
    if (!editedBy) {
      setMessage("Please select who is making this edit.");
      return;
    }
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/bookings/${bookingId}/override`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyPaidNights: [...selected], hotelNote: note, editedBy }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error?.formErrors?.[0] ?? "Something went wrong.");
      setMessage("Saved.");
      router.refresh();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="field-label mb-2">Company-paid nights (overrides the usual rules)</p>
        {nights.length === 0 ? (
          <p className="text-sm text-muted">Not attending, or no stay on file.</p>
        ) : (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {nights.map((night) => (
              <Checkbox
                key={night}
                label={formatShortDate(night)}
                checked={selected.has(night)}
                onChange={() => toggle(night)}
              />
            ))}
          </div>
        )}
      </div>

      <div>
        <label className="field-label mb-2 block" htmlFor="hotel-note">
          Note for the hotel
        </label>
        <textarea
          id="hotel-note"
          className="field"
          rows={3}
          placeholder="e.g. Arriving the morning after check-in, please hold the room from the night before."
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
        <p className="mt-1 text-xs text-muted">Shown on the Hotel Export - the hotel will see this.</p>
      </div>

      <div>
        <label className="field-label mb-2 block" htmlFor="override-edited-by">
          Who is making this edit?
        </label>
        <select
          id="override-edited-by"
          className="field max-w-xs"
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
      </div>

      <div className="flex items-center gap-3">
        <Button variant="secondary" onClick={save} disabled={saving}>
          {saving ? "Saving..." : "Save overrides"}
        </Button>
        {message && <p className="text-sm text-muted">{message}</p>}
      </div>
    </div>
  );
}
