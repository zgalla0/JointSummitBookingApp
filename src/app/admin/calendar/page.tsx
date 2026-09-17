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

  const summitEventDates = new Map<string, string[]>();
  for (const [date, label] of [
    [config.happyHourDate, "Happy Hour"],
    [config.allHandsDate, "All Hands"],
    [config.dinnerDate, "Dinner"],
  ] as const) {
    const iso = toISODate(date);
    const labels = summitEventDates.get(iso) ?? [];
    if (!labels.includes(label)) labels.push(label);
    summitEventDates.set(iso, labels);
  }

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-10">
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
            The <span className="font-bold text-accent-dark">blue number</span> is rooms booked
            that night (one per booking, regardless of guests); the{" "}
            <span className="font-bold text-foreground">dark number</span> is total people staying
            that night (attendee + guests). PTO = attendees marked PTO that day, broken down by
            location ({LOCATION_OPTIONS.map((o) => o.label).join(" / ")}). A light-blue box marks a
            summit event day (Happy Hour, All Hands, or Dinner).
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
                    <CalendarDayTile key={day} stats={dayStats[day]} eventLabels={summitEventDates.get(day)} />
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

function CalendarDayTile({ stats, eventLabels }: { stats: CalendarDayStats; eventLabels?: string[] }) {
  const day = stats.date.slice(-2);
  const isSummitDay = Boolean(eventLabels);
  return (
    <div
      title={eventLabels?.join(" · ")}
      className={`flex flex-col items-center gap-1 rounded-xl border px-1 py-2 text-center ${
        isSummitDay ? "border-accent bg-accent-soft" : "border-hairline bg-surface"
      }`}
    >
      <span className="font-mono text-sm font-semibold">{day}</span>
      <div className="flex items-baseline gap-3">
        <span className="text-sm font-bold text-accent-dark">{stats.rooms}</span>
        <span className="text-sm font-bold text-foreground">{stats.people}</span>
      </div>
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
