import { prisma } from "@/lib/prisma";
import { formatShortDate } from "@/lib/format";
import AdminNav from "@/components/AdminNav";
import HotelExportForm from "@/components/HotelExportForm";
import Card from "@/components/ui/Card";

export const dynamic = "force-dynamic";

export default async function AdminHotelExportPage() {
  const log = await prisma.hotelExportLog.findMany({ orderBy: { createdAt: "desc" }, take: 25 });

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-10">
      <AdminNav />
      <div className="space-y-6">
        <div className="animate-in space-y-1">
          <p className="eyebrow">Admin</p>
          <h1 className="text-3xl font-bold tracking-tight">Hotel export</h1>
          <p className="text-sm text-muted">
            Pull to preview only the bookings that are new, edited, or cancelled since the last export,
            color-coded so changes are obvious at a glance - then generate the excel file and a draft
            email for you to send to the hotel yourself (nothing is emailed automatically). Every
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
                  </tr>
                </thead>
                <tbody>
                  {log.map((entry) => (
                    <tr key={entry.id} className="border-b border-hairline last:border-0">
                      <td className="px-3 py-2 whitespace-nowrap">{formatShortDate(entry.createdAt)}</td>
                      <td className="px-3 py-2 font-medium">{entry.pulledBy}</td>
                      <td className="px-3 py-2">{entry.purpose}</td>
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
