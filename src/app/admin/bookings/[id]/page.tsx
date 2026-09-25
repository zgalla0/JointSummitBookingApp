import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatShortDate } from "@/lib/format";
import { parseJsonArray, bookingNights } from "@/lib/admin-stats";
import { magicLinkUrl } from "@/lib/magic-link";
import { LOCATION_OPTIONS } from "@/lib/location-options";
import AdminNav from "@/components/AdminNav";
import AdminBookingActions from "@/components/AdminBookingActions";
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
  const booking = await prisma.booking.findUnique({ where: { id }, include: { guests: true } });
  if (!booking) notFound();

  const companyPaid = new Set(parseJsonArray(booking.companyPaidNights));
  const nights = bookingNights(booking);

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
          <Row label="Attending the summit" value={booking.isAttending ? "Yes" : "No"} />
          <Row
            label="Location"
            value={LOCATION_OPTIONS.find((o) => o.key === booking.location)?.label ?? booking.location}
          />
          <Row label="Hotel reservation name" value={`${booking.reservationFirstName} ${booking.reservationLastName}`} />
          <Row label="Name tag" value={booking.nameTag} />
          <Row label="Hotel booking email" value={booking.hotelEmail} />
          <Row label="Details email" value={booking.detailsEmail} />
          <Row label="Cuesta email" value={booking.cuestaEmail} />
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

        <Card eyebrow="Events" title="Attendance">
          <Row label="Happy Hour" value={booking.attendingHappyHour ? "Yes" : "No"} />
          <Row label="All Hands" value={booking.attendingAllHands ? "Yes" : "No"} />
          <Row label="Dinner" value={booking.attendingDinner ? "Yes" : "No"} />
        </Card>

        <Card eyebrow="Hotel booking" title="Stay">
          <Row label="Check in" value={booking.isAttending ? formatShortDate(booking.stayStart) : null} />
          <Row label="Check out" value={booking.isAttending ? formatShortDate(booking.stayEnd) : null} />
          <Row label="Nights" value={nights.length} />
          <Row label="Company-paid nights" value={nights.filter((n) => companyPaid.has(n)).join(", ") || "None"} />
          <Row label="Extra-nights room type" value={booking.extraNightsRoomType} />
          <Row label="PTO dates" value={parseJsonArray(booking.ptoDates).join(", ")} />
        </Card>

        <Card eyebrow="Companion" title="Additional guests">
          {booking.guests.length === 0 ? (
            <p className="text-sm text-muted">None</p>
          ) : (
            booking.guests.map((g, i) => (
              <div key={g.id} className={i > 0 ? "mt-3 border-t border-hairline pt-3" : ""}>
                <Row label={g.type} value={`${g.firstName} ${g.lastName}`} />
                <Row label="Joining Happy Hour" value={g.attendingHappyHour ? "Yes" : "No"} />
                <Row label="Joining Dinner" value={g.attendingDinner ? "Yes" : "No"} />
                <Row label="Dietary" value={parseJsonArray(g.dietaryOptions).join(", ")} />
                <Row label="Dietary (other)" value={g.dietaryOther} />
              </div>
            ))
          )}
        </Card>

        <Card eyebrow="Food" title="Dietary">
          <Row label="Options" value={parseJsonArray(booking.dietaryOptions).join(", ")} />
          <Row label="Other" value={booking.dietaryOther} />
        </Card>

        <Card eyebrow="Activity" title="Activity interest">
          <Row label="Options" value={parseJsonArray(booking.activityOptions).join(", ")} />
          <Row label="Other" value={booking.activityOther} />
        </Card>

        <Card eyebrow="Travel" title="Flight details">
          <Row label="Arrival airline" value={booking.flightArrivalAirline} />
          <Row label="Arrival flight #" value={booking.flightArrivalNumber} />
          <Row label="Arrival" value={booking.flightArrival?.toISOString()} />
          <Row label="Departure airline" value={booking.flightDepartureAirline} />
          <Row label="Departure flight #" value={booking.flightDepartureNumber} />
          <Row label="Departure" value={booking.flightDeparture?.toISOString()} />
        </Card>

        <Card eyebrow="Anything else" title="Note for the planning team">
          <p className="whitespace-pre-wrap text-sm">{booking.additionalNotes || "None"}</p>
        </Card>
      </div>
    </main>
  );
}
