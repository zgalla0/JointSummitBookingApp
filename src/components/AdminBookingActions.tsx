"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Button from "./ui/Button";

export default function AdminBookingActions({
  bookingId,
  status,
  flaggedForReview,
}: {
  bookingId: string;
  status: "ACTIVE" | "CANCELLED";
  flaggedForReview: boolean;
}) {
  const router = useRouter();
  const [confirmingCancel, setConfirmingCancel] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function run(path: string, method: string, onDone?: (data: unknown) => void) {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch(path, { method });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error?.formErrors?.[0] ?? "Something went wrong.");
      onDone?.(data);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  async function cancel() {
    await run(`/api/admin/bookings/${bookingId}/cancel`, "POST", () => {
      setMessage("Booking cancelled.");
      router.refresh();
    });
    setConfirmingCancel(false);
  }

  async function toggleFlag() {
    await run(`/api/admin/bookings/${bookingId}/flag`, "POST", () => {
      router.refresh();
    });
  }

  async function resendLink() {
    await run(`/api/admin/bookings/${bookingId}/resend-link`, "POST", () => {
      setMessage("Magic link resent.");
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-3">
        {status === "ACTIVE" &&
          (confirmingCancel ? (
            <>
              <Button variant="primary" onClick={cancel} disabled={busy}>
                {busy ? "Cancelling..." : "Confirm cancel"}
              </Button>
              <Button variant="ghost" onClick={() => setConfirmingCancel(false)} disabled={busy}>
                Never mind
              </Button>
            </>
          ) : (
            <Button variant="secondary" onClick={() => setConfirmingCancel(true)} disabled={busy}>
              Cancel booking
            </Button>
          ))}
        <Button variant="ghost" onClick={toggleFlag} disabled={busy}>
          {flaggedForReview ? "Clear review flag" : "Flag for review"}
        </Button>
        <Button variant="ghost" onClick={resendLink} disabled={busy}>
          Resend magic link
        </Button>
      </div>
      {message && <p className="text-sm text-muted">{message}</p>}
    </div>
  );
}
