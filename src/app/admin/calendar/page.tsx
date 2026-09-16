import { prisma } from "@/lib/prisma";
import { config } from "@/lib/config";
import { toISODate } from "@/lib/format";
import { computeCalendarStats, type CalendarDayStats } from "@/lib/admin-stats";
import { buildCalendarGrid, WEEKDAY_HEADER_SUN_FIRST } from "@/lib/stay-tiles-client";
import { LOCATION_OPTIONS } from "@/lib/location-options";
import AdminNav from "@/components/AdminNav";
import Card from "@/components/ui/Card";

export const dynamic = "force-dynamic";

export default async function AdminCalendarPage() {
  const bookings = await prisma.booking.findMany({ include: { guests: true } });

  const startIso = toISODate(config.bookableStart);
  const endIso = toISODate(config.bookableEnd);
  const dayStats = computeCalendarStats(bookings, startIso, endIso);
  const calendarRows = buildCalendarGrid(startIso, endIso);

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <AdminNav />
      <div className="space-y-6">
        <div className="animate-in space-y-1">
          <p className="eyebrow">Admin</p>
          <h1 className="text-3xl font-bold tracking-tight">Calendar</h1>
        </div>

        <Card
          eyebrow="Legend"
          title="Per-night rooms, headcount, and PTO coverage"
          className="text-sm text-muted"
        >
          <p>
            🛏️ = rooms booked that night (one per booking, regardless of guests). 👥 = total
            people staying that night (attendee + guests). PTO = attendees marked PTO that day,
            broken down by location ({LOCATION_OPTIONS.map((o) => o.label).join(" / ")}).
          </p>
        </Card>

        <Card className="overflow-x-auto">
          <div className="min-w-[900px] space-y-2">
            <div className="grid grid-cols-7 gap-2">
              {WEEKDAY_HEADER_SUN_FIRST.map((label) => (
                <div
                  key={label}
                  className="text-center text-[10px] font-semibold tracking-wide text-muted uppercase"
                >
                  {label}
                </div>
              ))}
            </div>
            {calendarRows.map((row, i) => (
              <div key={i} className="grid grid-cols-7 gap-2">
                {row.map((day, j) =>
                  day ? (
                    <CalendarDayTile key={day} stats={dayStats[day]} />
                  ) : (
                    <div key={j} />
                  ),
                )}
              </div>
            ))}
          </div>
        </Card>
      </div>
    </main>
  );
}

function CalendarDayTile({ stats }: { stats: CalendarDayStats }) {
  const day = stats.date.slice(-2);
  return (
    <div className="flex flex-col items-center gap-1 rounded-xl border border-hairline bg-surface px-1 py-2 text-center">
      <span className="font-mono text-sm font-semibold">{day}</span>
      <span className="text-sm font-bold text-accent-dark">🛏️ {stats.rooms}</span>
      <span className="text-[10px] text-muted">👥 {stats.people}</span>
      <span className="text-[10px] font-semibold text-warning">PTO {stats.ptoTotal}</span>
      {stats.ptoTotal > 0 && (
        <span className="text-[9px] leading-tight text-muted">
          {LOCATION_OPTIONS.map((o) => `${o.label.split(" ")[0]}: ${stats.ptoByLocation[o.key] ?? 0}`).join(
            " · ",
          )}
        </span>
      )}
    </div>
  );
}
