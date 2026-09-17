import type { ReactNode } from "react";
import { prisma } from "@/lib/prisma";
import { computeAdminStats, computePtoCoverage, type PtoBucketStats } from "@/lib/admin-stats";
import { DIETARY_OPTIONS } from "@/lib/dietary-options";
import { ROOM_TYPES } from "@/lib/room-types";
import { LOCATION_OPTIONS } from "@/lib/location-options";
import { formatMonthDay } from "@/lib/format";
import AdminNav from "@/components/AdminNav";
import FlightReminderButton from "@/components/FlightReminderButton";
import Card from "@/components/ui/Card";

export const dynamic = "force-dynamic";

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <p className="text-2xl font-bold tracking-tight">{value}</p>
      <p className="text-sm text-muted">{label}</p>
    </div>
  );
}

/** Visually clusters a handful of related Stats together (e.g. an event and
 *  its companion count) inside a card that may hold several such clusters -
 *  a "circle within a circle" so related numbers are easy to compare at a
 *  glance, instead of one undifferentiated grid of stats. Stacked
 *  vertically (rather than left-to-right) so every group reads the same
 *  way regardless of how many other groups happen to fit on the same row. */
function StatGroup({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-1 flex-col gap-3 rounded-xl border-2 border-accent/20 bg-background p-3">
      {children}
    </div>
  );
}

function PtoBucketRow({ heading, bucket }: { heading: string; bucket: PtoBucketStats }) {
  return (
    <div>
      <p className="mb-2 text-xs font-semibold tracking-wide text-muted uppercase">{heading}</p>
      <div className="grid grid-cols-3 gap-4">
        <Stat label="Total" value={bucket.total} />
        {LOCATION_OPTIONS.map((loc) => (
          <Stat key={loc.key} label={loc.label} value={bucket.byLocation[loc.key]} />
        ))}
      </div>
    </div>
  );
}

export default async function AdminDashboardPage() {
  const bookings = await prisma.booking.findMany({ include: { guests: true } });
  const stats = computeAdminStats(bookings);
  const pto = computePtoCoverage(bookings);
  const pivotLabel = formatMonthDay(pto.pivotIso);

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <AdminNav />
      <div className="space-y-6">
        <div className="animate-in space-y-1">
          <p className="eyebrow">Admin</p>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        </div>

        <Card eyebrow="Overview" title="Bookings">
          <div className="flex flex-wrap gap-4">
            <StatGroup>
              <Stat label="Active bookings" value={stats.totalActive} />
              <Stat label="Not attending" value={stats.notAttending} />
              <Stat label="Cancelled" value={stats.totalCancelled} />
            </StatGroup>
            <StatGroup>
              <Stat label="Additional adults" value={stats.additionalGuestsAdult} />
              <Stat label="Additional children" value={stats.additionalGuestsChild} />
            </StatGroup>
          </div>
        </Card>

        <Card eyebrow="Attendance" title="Events">
          <div className="flex flex-wrap gap-4">
            <StatGroup>
              <Stat label="Happy Hour" value={stats.happyHour} />
              <Stat label="Happy Hour companion" value={stats.happyHourPlusOne} />
            </StatGroup>
            <StatGroup>
              <Stat label="All Hands" value={stats.allHands} />
            </StatGroup>
            <StatGroup>
              <Stat label="Dinner" value={stats.dinner} />
              <Stat label="Dinner companion" value={stats.dinnerPlusOne} />
            </StatGroup>
          </div>
        </Card>

        <Card eyebrow="Hotel booking" title="Room nights">
          <div className="flex flex-wrap gap-4">
            <StatGroup>
              <Stat label="Company-paid nights" value={stats.companyPaidNights} />
              <Stat label="Self-paid nights" value={stats.selfPaidNights} />
            </StatGroup>
            <StatGroup>
              <Stat label="Nights in discount window" value={stats.discountWindowNights} />
              <Stat label="Nights outside discount window" value={stats.outsideDiscountWindowNights} />
            </StatGroup>
          </div>
          <div className="mt-4 flex flex-wrap gap-4">
            <StatGroup>
              {ROOM_TYPES.map((rt) => (
                <Stat key={rt.key} label={`${rt.label} nights`} value={stats.roomTypeCounts[rt.key]} />
              ))}
            </StatGroup>
          </div>
        </Card>

        <Card eyebrow="Food" title="Dietary breakdown">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {DIETARY_OPTIONS.map((option) => (
              <Stat key={option.key} label={option.label} value={stats.dietaryCounts[option.key]} />
            ))}
          </div>
        </Card>

        <Card eyebrow="Coverage" title="PTO coverage">
          <div className="flex flex-wrap gap-4">
            <StatGroup>
              <PtoBucketRow heading="Total PTO days" bucket={pto.total} />
            </StatGroup>
            <StatGroup>
              <PtoBucketRow heading={`Before the summit (through ${pivotLabel})`} bucket={pto.before} />
            </StatGroup>
            <StatGroup>
              <PtoBucketRow heading={`On/after ${pivotLabel}`} bucket={pto.after} />
            </StatGroup>
          </div>
          <div className="mt-4 border-t border-hairline pt-4">
            <Stat label="Flagged for review" value={stats.flaggedForReview} />
          </div>
        </Card>

        <Card eyebrow="Travel" title="Missing flight details">
          <div className="flex flex-wrap items-center justify-between gap-6">
            <Stat label="Bookings missing flight details" value={stats.missingFlightDetails} />
            <FlightReminderButton missingCount={stats.missingFlightDetails} />
          </div>
        </Card>

        <Card eyebrow="Actions" title="Export">
          <div className="flex flex-wrap items-start gap-6">
            <a
              href="/api/admin/export"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-200 ease-out hover:bg-accent-dark hover:scale-[1.02] active:scale-[0.98]"
            >
              Export bookings (.xlsx)
            </a>
          </div>
        </Card>
      </div>
    </main>
  );
}
