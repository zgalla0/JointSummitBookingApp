import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { config, defaultCompanyPaidNights, optionalCompanyPaidNights } from "@/lib/config";
import { toISODate, formatShortDate } from "@/lib/format";
import { parseJsonArray, bookingNights } from "@/lib/admin-stats";
import { bookingToFormInput } from "@/lib/booking-to-form";
import { magicLinkUrl } from "@/lib/magic-link";
import { LOCATION_OPTIONS } from "@/lib/location-options";
import AdminNav from "@/components/AdminNav";
import AdminBookingActions from "@/components/AdminBookingActions";
import AdminBookingOverrides from "@/components/AdminBookingOverrides";
import AdminEditBookingForm from "@/components/AdminEditBookingForm";
import Card from "@/components/ui/Card";

export const dynamic = "force-dynamic";

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4 border-b border-hairline/60 py-2 text-sm last:border-0">
      <span className="text-muted">{label}</span>
      <span className="text-right font-medium">{value || "—"}</span>
    </div>
  );
}

export default async function AdminBookingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [booking, editLog] = await Promise.all([
    prisma.booking.findUnique({ where: { id }, include: { guests: true } }),
    prisma.bookingEditLog.findMany({ where: { bookingId: id }, orderBy: { createdAt: "desc" } }),
  ]);
  if (!booking) notFound();

  const companyPaid = new Set(parseJsonArray(booking.companyPaidNights));
  const nights = bookingNights(booking);

  const formConfig = {
    bookableStart: toISODate(config.bookableStart),
    bookableEnd: toISODate(config.bookableEnd),
    discountStart: toISODate(config.discountStart),
    discountEnd: toISODate(config.discountEnd),
    happyHourDate: toISODate(config.happyHourDate),
    allHandsDate: toISODate(config.allHandsDate),
    dinnerDate: toISODate(config.dinnerDate),
    defaultCompanyPaidNights: defaultCompanyPaidNights().map(toISODate),
    optionalCompanyPaidNights: optionalCompanyPaidNights().map(toISODate),
  };

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-10">
      <AdminNav />
      <div className="space-y-6">
        <div className="animate-in space-y-1">
          <p className="eyebrow">Admin</p>
          <h1 className="text-3xl font-bold tracking-tight">
            {booking.firstName} {booking.lastName}
          </h1>
        </div>

        <Card eyebrow="Actions" title="Manage this booking">
          <AdminBookingActions
            bookingId={booking.id}
            status={booking.status}
            flaggedForReview={booking.flaggedForReview}
          />
        </Card>

        {booking.flaggedForReview && (
          <div className="rounded-2xl bg-amber-50 p-4 text-sm text-amber-800">
            Flagged for review{booking.flagReason ? `: ${booking.flagReason}` : ""}
          </div>
        )}

        <Card eyebrow="Status" title="Overview">
          <Row label="Status" value={booking.status} />
          <Row
            label="Location"
            value={LOCATION_OPTIONS.find((o) => o.key === booking.location)?.label ?? booking.location}
          />
          <Row
            label="Cancelled"
            value={
              booking.cancelledAt
                ? `${booking.cancelledAt.toISOString().slice(0, 10)} (${booking.cancelledByAdmin ? "by admin" : "by attendee"})`
                : null
            }
          />
          <Row label="Magic link" value={<span className="break-all">{magicLinkUrl(booking.magicLinkToken)}</span>} />
        </Card>

        <Card eyebrow="Hotel booking" title="Stay (at a glance)">
          <Row label="Check in" value={booking.isAttending ? formatShortDate(booking.stayStart) : null} />
          <Row label="Check out" value={booking.isAttending ? formatShortDate(booking.stayEnd) : null} />
          <Row label="Nights" value={nights.length} />
          <Row label="Company-paid nights" value={nights.filter((n) => companyPaid.has(n)).join(", ") || "None"} />
        </Card>

        <Card eyebrow="Edit" title="Booking details">
          <AdminEditBookingForm
            bookingId={booking.id}
            defaultValues={bookingToFormInput(booking, formConfig.optionalCompanyPaidNights)}
            formConfig={formConfig}
          />
        </Card>

        <Card eyebrow="Admin only" title="Overrides">
          <p className="mb-4 text-sm text-muted">
            Changes here fall outside the booking form&apos;s normal rules (e.g. which nights are
            eligible to be company-paid) and aren&apos;t visible to the attendee. Saving the edit form
            above resets company-paid nights to the usual rules, so re-apply an override here if you
            still need it afterward.
          </p>
          <AdminBookingOverrides
            bookingId={booking.id}
            nights={nights}
            companyPaidNights={nights.filter((n) => companyPaid.has(n))}
            hotelNote={booking.hotelNote ?? ""}
          />
        </Card>

        <Card eyebrow="Audit trail" title="Edit history">
          {editLog.length === 0 ? (
            <p className="text-sm text-muted">No admin edits recorded yet.</p>
          ) : (
            <div className="divide-y divide-hairline">
              {editLog.map((entry) => (
                <div key={entry.id} className="py-3 first:pt-0 last:pb-0">
                  <p className="text-xs font-semibold text-muted">
                    {entry.createdAt.toISOString().slice(0, 16).replace("T", " ")} UTC · {entry.editedBy}
                  </p>
                  <ul className="mt-1 list-disc space-y-0.5 pl-5 text-sm text-foreground">
                    {entry.changes.split("\n").map((line, i) => (
                      <li key={i}>{line}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </main>
  );
}
