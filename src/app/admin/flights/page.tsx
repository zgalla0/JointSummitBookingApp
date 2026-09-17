import { prisma } from "@/lib/prisma";
import { computeFlightGroups, type FlightGroup } from "@/lib/flight-groups";
import { terminalLabel } from "@/lib/airport-terminals";
import { formatMonthDay } from "@/lib/format";
import AdminNav from "@/components/AdminNav";
import Card from "@/components/ui/Card";

export const dynamic = "force-dynamic";

export default async function AdminFlightsPage() {
  const bookings = await prisma.booking.findMany();
  const { arrivals, departures } = computeFlightGroups(bookings);

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <AdminNav />
      <div className="space-y-6">
        <div className="animate-in space-y-1">
          <p className="eyebrow">Admin</p>
          <h1 className="text-3xl font-bold tracking-tight">Flights</h1>
        </div>

        <Card eyebrow="Legend" title="How these are grouped" className="text-sm text-muted">
          <p>
            Attending, active bookings only, split into arrivals and departures. Within each, grouped
            by date and terminal so flights that land or leave around the same time and place are easy
            to compare - the exact carpool groups are still up to you to work out from here.
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
