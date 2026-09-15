import { prisma } from "@/lib/prisma";
import { computeAdminStats } from "@/lib/admin-stats";
import { DIETARY_OPTIONS } from "@/lib/dietary-options";
import { ROOM_TYPES } from "@/lib/room-types";
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

export default async function AdminDashboardPage() {
  const bookings = await prisma.booking.findMany({ include: { guests: true } });
  const stats = computeAdminStats(bookings);

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
            <Stat label="Cancelled" value={stats.totalCancelled} />
            <Stat label="Additional adults" value={stats.additionalGuestsAdult} />
            <Stat label="Additional children" value={stats.additionalGuestsChild} />
          </div>
        </Card>

        <Card eyebrow="Attendance" title="Events">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Stat label="Happy Hour" value={stats.happyHour} />
            <Stat label="Happy Hour +1" value={stats.happyHourPlusOne} />
            <Stat label="All Hands" value={stats.allHands} />
            <Stat label="Dinner" value={stats.dinner} />
            <Stat label="Dinner +1" value={stats.dinnerPlusOne} />
          </div>
        </Card>

        <Card eyebrow="Lodging" title="Room nights">
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

        <Card eyebrow="Coverage" title="PTO & review">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Stat label="PTO days claimed" value={stats.ptoDatesCount} />
            <Stat label="Flagged for review" value={stats.flaggedForReview} />
            <Stat label="Missing flight details" value={stats.missingFlightDetails} />
          </div>
        </Card>

        <Card eyebrow="Actions" title="Export & reminders">
          <div className="flex flex-wrap items-start gap-6">
            <a
              href="/api/admin/export"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-200 ease-out hover:bg-accent-dark hover:scale-[1.02] active:scale-[0.98]"
            >
              Export bookings (CSV)
            </a>
            <FlightReminderButton missingCount={stats.missingFlightDetails} />
          </div>
        </Card>
      </div>
    </main>
  );
}
