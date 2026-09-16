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
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Stat label="Active bookings" value={stats.totalActive} />
            <Stat label="Not attending" value={stats.notAttending} />
            <Stat label="Cancelled" value={stats.totalCancelled} />
            <Stat label="Additional adults" value={stats.additionalGuestsAdult} />
            <Stat label="Additional children" value={stats.additionalGuestsChild} />
          </div>
        </Card>

        <Card eyebrow="Attendance" title="Events">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Stat label="Happy Hour" value={stats.happyHour} />
            <Stat label="Happy Hour companion" value={stats.happyHourPlusOne} />
            <Stat label="All Hands" value={stats.allHands} />
            <Stat label="Dinner" value={stats.dinner} />
            <Stat label="Dinner companion" value={stats.dinnerPlusOne} />
          </div>
        </Card>

        <Card eyebrow="Hotel booking" title="Room nights">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Stat label="Company-paid nights" value={stats.companyPaidNights} />
            <Stat label="Self-paid nights" value={stats.selfPaidNights} />
            <Stat label="Nights in discount window" value={stats.discountWindowNights} />
            <Stat label="Nights outside discount window" value={stats.outsideDiscountWindowNights} />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {ROOM_TYPES.map((rt) => (
              <Stat key={rt.key} label={`${rt.label} nights`} value={stats.roomTypeCounts[rt.key]} />
            ))}
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
          <div className="space-y-5">
            <PtoBucketRow heading="Total PTO days" bucket={pto.total} />
            <PtoBucketRow heading={`Before the summit (through ${pivotLabel})`} bucket={pto.before} />
            <PtoBucketRow heading={`On/after ${pivotLabel}`} bucket={pto.after} />
            <div className="border-t border-hairline pt-4">
              <Stat label="Flagged for review" value={stats.flaggedForReview} />
            </div>
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
              Export bookings (CSV)
            </a>
          </div>
        </Card>
      </div>
    </main>
  );
}
