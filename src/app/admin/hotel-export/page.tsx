import { prisma } from "@/lib/prisma";
import { formatShortDate } from "@/lib/format";
import AdminNav from "@/components/AdminNav";
import HotelExportForm from "@/components/HotelExportForm";
import Card from "@/components/ui/Card";

export const dynamic = "force-dynamic";

export default async function AdminHotelExportPage() {
  const log = await prisma.hotelExportLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 25,
    select: { id: true, pulledBy: true, purpose: true, createdAt: true, filename: true, draftEmail: true },
  });

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-10">
      <AdminNav />
      <div className="space-y-6">
        <div className="animate-in space-y-1">
          <p className="eyebrow">Admin</p>
          <h1 className="text-3xl font-bold tracking-tight">Hotel export</h1>
        </div>

        <Card eyebrow="Actions" title="Export">
          <div className="space-y-4">
            <div>
              <a
                href="/api/admin/export"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-200 ease-out hover:bg-accent-dark hover:scale-[1.02] active:scale-[0.98]"
              >
                View All Data (.xlsx)
              </a>
              <p className="mt-2 text-sm text-muted">
                The full dataset, no filtering or highlighting - for internal reference and
                troubleshooting, not for the hotel.
              </p>
            </div>

            <div className="rounded-xl border-2 border-warning bg-warning-soft p-3">
              <p className="text-sm font-semibold text-warning">
                For everyday internal use, use &quot;View All Data&quot; above. Only use the Hotel Export
                below when you actually need to send an updated roster to the hotel - it&apos;s logged
                every time, and pulling it re-bases what counts as changed on the next send.
              </p>
            </div>
          </div>
        </Card>

        <div className="animate-in space-y-1">
          <h2 className="text-2xl font-bold tracking-tight">Send to hotel</h2>
          <p className="text-sm text-muted">
            Pull to preview the full current roster, color-coded so what&apos;s new, changed, or
            cancelled since the last export is obvious at a glance - then generate the excel file and a
            draft email for you to send to the hotel yourself (nothing is emailed automatically). Every
            export you generate is logged below.
          </p>
        </div>
        <HotelExportForm />

        <Card eyebrow="Log" title="Recent hotel exports">
          {log.length === 0 ? (
            <p className="text-sm text-muted">No hotel exports generated yet.</p>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-hairline">
              <table className="w-full min-w-[500px] text-sm">
                <thead>
                  <tr className="border-b border-hairline bg-background text-left text-xs text-muted uppercase">
                    <th className="px-3 py-2 font-semibold">When</th>
                    <th className="px-3 py-2 font-semibold">Who</th>
                    <th className="px-3 py-2 font-semibold">Purpose</th>
                    <th className="px-3 py-2 font-semibold">This pull</th>
                  </tr>
                </thead>
                <tbody>
                  {log.map((entry) => (
                    <tr key={entry.id} className="border-b border-hairline last:border-0">
                      <td className="px-3 py-2 whitespace-nowrap">{formatShortDate(entry.createdAt)}</td>
                      <td className="px-3 py-2 font-medium">{entry.pulledBy}</td>
                      <td className="px-3 py-2">{entry.purpose}</td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        {entry.filename || entry.draftEmail ? (
                          <div className="flex gap-2">
                            {entry.filename && (
                              <a
                                href={`/api/admin/hotel-export/${entry.id}/file`}
                                className="rounded-lg border border-hairline bg-white px-2.5 py-1 text-xs font-semibold text-foreground hover:bg-black/[0.03]"
                              >
                                Excel
                              </a>
                            )}
                            {entry.draftEmail && (
                              <a
                                href={`/api/admin/hotel-export/${entry.id}/email`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="rounded-lg border border-hairline bg-white px-2.5 py-1 text-xs font-semibold text-foreground hover:bg-black/[0.03]"
                              >
                                Email
                              </a>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-muted">Not saved</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </main>
  );
}
