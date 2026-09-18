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

        <Card eyebrow="Legend" title="Per-night rooms, headcount, and PTO coverage">
          <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center">
            <ul className="list-disc space-y-2 pl-5 text-sm text-muted">
              <li>
                The <span className="font-bold text-accent-dark">blue number</span> is rooms booked
                that night (one per booking, regardless of guests)
              </li>
              <li>
                The <span className="font-bold text-emerald-700">green number</span> is total people
                staying that night (attendee + guests)
              </li>
              <li>
                PTO = attendees marked PTO that day, broken down by location (
                {LOCATION_OPTIONS.map((o) => o.label).join(" / ")})
              </li>
              <li>A light-blue box marks a summit event day (Happy Hour, All Hands, or Dinner).</li>
            </ul>
            <div className="flex flex-shrink-0 flex-col items-center gap-1.5">
              <p className="text-xs font-semibold tracking-wide text-muted uppercase">Example</p>
              <LegendExampleTile />
            </div>
          </div>
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
        <span className="text-sm font-bold text-emerald-700">{stats.people}</span>
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

/** A larger, static stand-in for a real day tile, shown next to the
 *  legend's bullet list with made-up numbers - so what each part of a
 *  tile means is obvious at a glance, not just described in text. Bigger
 *  than the actual calendar tiles on purpose, so it reads as a labeled
 *  example rather than blending into the grid below. */
function LegendExampleTile() {
  return (
    <div className="flex flex-col items-center gap-2 rounded-2xl border-2 border-accent bg-accent-soft px-6 py-5 text-center shadow-sm">
      <span className="font-mono text-lg font-semibold">22</span>
      <div className="flex items-baseline gap-5">
        <span className="text-2xl font-bold text-accent-dark">4</span>
        <span className="text-2xl font-bold text-emerald-700">7</span>
      </div>
      <span className="text-xs font-semibold text-warning">PTO 2</span>
      <span className="text-[11px] leading-tight text-muted">
        {LOCATION_OPTIONS.map((o) => `${o.label.split(" ")[0]}: 1`).join(" · ")}
      </span>
    </div>
  );
}
