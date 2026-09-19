import { prisma } from "@/lib/prisma";
import { config } from "@/lib/config";
import { toISODate } from "@/lib/format";
import { computeCalendarStats, type CalendarDayStats } from "@/lib/admin-stats";
import { buildCalendarGrid, WEEKDAY_HEADER_SUN_FIRST } from "@/lib/stay-tiles-client";
import { LOCATION_OPTIONS, type LocationKey } from "@/lib/location-options";
import AdminNav from "@/components/AdminNav";
import Card from "@/components/ui/Card";

export const dynamic = "force-dynamic";

function ptoBreakdownText(ptoByLocation: Record<LocationKey, number>): string {
  return LOCATION_OPTIONS.map((o) => `${o.label.split(" ")[0]}: ${ptoByLocation[o.key] ?? 0}`).join(" · ");
}

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
                The <span className="font-bold text-accent-dark">darker blue block</span> is rooms
                booked that night (one per booking, regardless of guests)
              </li>
              <li>
                The <span className="font-bold text-accent-dark">lighter blue block</span> is total people
                staying that night (attendee + guests)
              </li>
              <li>
                PTO = attendees marked PTO that day, broken down by location (
                {LOCATION_OPTIONS.map((o) => o.label).join(" / ")})
              </li>
              <li>A light-blue day number marks a summit event day (Happy Hour, All Hands, or Dinner).</li>
            </ul>
            <div className="flex flex-shrink-0 flex-col items-center gap-1.5">
              <p className="text-xs font-semibold tracking-wide text-muted uppercase">Example</p>
              <SplitStatTile
                day="22"
                rooms={4}
                people={7}
                ptoTotal={2}
                ptoBreakdown={ptoBreakdownText({ US_CAN_IRE: 1, LATAM: 1 })}
                isSummitDay
                size="lg"
              />
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
  return (
    <div title={eventLabels?.join(" · ")}>
      <SplitStatTile
        day={stats.date.slice(-2)}
        rooms={stats.rooms}
        people={stats.people}
        ptoTotal={stats.ptoTotal}
        ptoBreakdown={stats.ptoTotal > 0 ? ptoBreakdownText(stats.ptoByLocation) : undefined}
        isSummitDay={Boolean(eventLabels)}
      />
    </div>
  );
}

/** Rooms and people each get their own solid block instead of a colored
 *  number, so which is which never depends on remembering a color - the
 *  block itself is captioned at the larger ("lg") size used for the
 *  legend's example. The day number's strip picks up the app's existing
 *  "light-blue = summit day" marking; the two stat blocks underneath stay
 *  the same color either way, since that distinction already lives in the
 *  day strip and doesn't need repeating. */
function SplitStatTile({
  day,
  rooms,
  people,
  ptoTotal,
  ptoBreakdown,
  isSummitDay,
  size = "sm",
}: {
  day: string;
  rooms: number;
  people: number;
  ptoTotal: number;
  ptoBreakdown?: string;
  isSummitDay: boolean;
  size?: "sm" | "lg";
}) {
  const big = size === "lg";
  return (
    <div
      className={`overflow-hidden rounded-xl border ${big ? "w-64 shadow-sm" : ""} ${
        isSummitDay ? "border-accent" : "border-hairline"
      }`}
    >
      <div
        className={`text-center font-mono font-semibold ${big ? "py-2 text-lg" : "py-1 text-xs"} ${
          isSummitDay ? "bg-accent-soft text-accent-dark" : "bg-background text-muted"
        }`}
      >
        {day}
      </div>
      <div className="flex">
        <div className={`flex-1 bg-accent-dark text-center text-white ${big ? "py-3" : "py-1.5"}`}>
          <span className={`block font-mono leading-none font-bold ${big ? "text-2xl" : "text-sm"}`}>
            {rooms}
          </span>
          {big && <span className="mt-1 block text-[10px] tracking-wide uppercase opacity-80">rooms</span>}
        </div>
        <div className={`flex-1 bg-accent text-center text-foreground ${big ? "py-3" : "py-1.5"}`}>
          <span className={`block font-mono leading-none font-bold ${big ? "text-2xl" : "text-sm"}`}>
            {people}
          </span>
          {big && <span className="mt-1 block text-[10px] tracking-wide uppercase opacity-80">people</span>}
        </div>
      </div>
      <div className={`bg-warning-soft text-center font-bold text-warning ${big ? "py-1.5 text-xs" : "py-0.5 text-[9px]"}`}>
        PTO {ptoTotal}
      </div>
      {ptoBreakdown && (
        <div className={`text-center leading-tight text-muted ${big ? "py-1.5 text-[11px]" : "py-0.5 text-[7px]"}`}>
          {ptoBreakdown}
        </div>
      )}
    </div>
  );
}
