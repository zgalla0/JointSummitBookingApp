import { prisma } from "@/lib/prisma";
import { computeFlightGroups, type FlightGroup } from "@/lib/flight-groups";
import { computeFlightStatusList, type FlightStatus } from "@/lib/admin-stats";
import { terminalLabel } from "@/lib/airport-terminals";
import { formatMonthDay } from "@/lib/format";
import AdminNav from "@/components/AdminNav";
import FlightReminderButton from "@/components/FlightReminderButton";
import Card from "@/components/ui/Card";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<FlightStatus, string> = {
  complete: "Complete",
  partial: "Partial",
  none: "Not booked yet",
};

const STATUS_CLASS: Record<FlightStatus, string> = {
  complete: "bg-accent-soft text-accent-dark",
  partial: "bg-warning-soft text-warning",
  none: "bg-red-50 text-red-700",
};

export default async function AdminFlightsPage() {
  const bookings = await prisma.booking.findMany();
  const { arrivals, departures } = computeFlightGroups(bookings);
  const statusList = computeFlightStatusList(bookings);
  const incomplete = statusList.filter((row) => row.status !== "complete");
  const complete = statusList.filter((row) => row.status === "complete");

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-10">
      <AdminNav />
      <div className="space-y-6">
        <div className="animate-in flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1">
            <p className="eyebrow">Admin</p>
            <h1 className="text-3xl font-bold tracking-tight">Flights</h1>
          </div>
          <a
            href="/api/admin/flights/export"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-200 ease-out hover:bg-accent-dark hover:scale-[1.02] active:scale-[0.98]"
          >
            Export (.xlsx)
          </a>
        </div>

        <Card
          eyebrow="Status"
          title={`Missing or incomplete flight details (${incomplete.length})`}
        >
          <div className="space-y-4">
            <p className="text-sm text-muted">
              &quot;Partial&quot; means they&apos;ve started entering one leg but not the other -
              nudge them to finish. &quot;Not booked yet&quot; means nothing&apos;s on file at all -
              nudge them to actually book, not just fill in the form.
            </p>
            {incomplete.length === 0 ? (
              <p className="text-sm text-muted">Everyone attending has complete flight details.</p>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-hairline">
                <table className="w-full min-w-[500px] text-sm">
                  <thead>
                    <tr className="border-b border-hairline bg-background text-left text-xs text-muted uppercase">
                      <th className="px-3 py-2 font-semibold">Name</th>
                      <th className="px-3 py-2 font-semibold">Email</th>
                      <th className="px-3 py-2 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {incomplete.map((row) => (
                      <tr key={row.bookingId} className="border-b border-hairline last:border-0">
                        <td className="px-3 py-2 font-medium">{row.name}</td>
                        <td className="px-3 py-2">{row.email}</td>
                        <td className="px-3 py-2">
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_CLASS[row.status]}`}
                          >
                            {STATUS_LABEL[row.status]}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <FlightReminderButton missingCount={incomplete.length} />
          </div>
        </Card>

        <Card eyebrow="Status" title={`Have complete flight details (${complete.length})`}>
          {complete.length === 0 ? (
            <p className="text-sm text-muted">Nobody attending has complete flight details yet.</p>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-hairline">
              <table className="w-full min-w-[400px] text-sm">
                <thead>
                  <tr className="border-b border-hairline bg-background text-left text-xs text-muted uppercase">
                    <th className="px-3 py-2 font-semibold">Name</th>
                    <th className="px-3 py-2 font-semibold">Email</th>
                  </tr>
                </thead>
                <tbody>
                  {complete.map((row) => (
                    <tr key={row.bookingId} className="border-b border-hairline last:border-0">
                      <td className="px-3 py-2 font-medium">{row.name}</td>
                      <td className="px-3 py-2">{row.email}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <Card eyebrow="Legend" title="How these are grouped" className="text-sm text-muted">
          <p>
            Attending, active bookings only, split into arrivals and departures. Within each, grouped
            by date and terminal so flights that land or leave around the same time and place are easy
            to compare - the exact carpool groups are still up to you to work out from here. The
            export above is grouped the exact same way.
          </p>
        </Card>

        <FlightSection title="Arrivals" groups={arrivals} />
        <FlightSection title="Departures" groups={departures} />
      </div>
    </main>
  );
}

function FlightSection({ title, groups }: { title: string; groups: FlightGroup[] }) {
  return (
    <Card eyebrow="Groups" title={title}>
      {groups.length === 0 ? (
        <p className="text-sm text-muted">No flight details on file yet.</p>
      ) : (
        <div className="space-y-5">
          {groups.map((group) => (
            <div key={`${group.dateIso}__${group.terminal}`}>
              <p className="mb-2 text-xs font-semibold tracking-wide text-muted uppercase">
                {formatMonthDay(group.dateIso)} · {terminalLabel(group.terminal)} · {group.entries.length}{" "}
                {group.entries.length === 1 ? "person" : "people"}
              </p>
              <div className="overflow-x-auto rounded-xl border border-hairline">
                <table className="w-full min-w-[500px] text-sm">
                  <thead>
                    <tr className="border-b border-hairline bg-background text-left text-xs text-muted uppercase">
                      <th className="px-3 py-2 font-semibold">Name</th>
                      <th className="px-3 py-2 font-semibold">Airline</th>
                      <th className="px-3 py-2 font-semibold">Flight #</th>
                      <th className="px-3 py-2 font-semibold">Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.entries.map((entry) => (
                      <tr key={entry.bookingId} className="border-b border-hairline last:border-0">
                        <td className="px-3 py-2 font-medium">{entry.name}</td>
                        <td className="px-3 py-2">{entry.airline}</td>
                        <td className="px-3 py-2">{entry.flightNumber || "-"}</td>
                        <td className="px-3 py-2">
                          {entry.dateTime.toISOString().slice(11, 16)} UTC
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
