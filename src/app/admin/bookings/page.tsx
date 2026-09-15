import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatShortDate } from "@/lib/format";
import AdminNav from "@/components/AdminNav";
import Card from "@/components/ui/Card";

export const dynamic = "force-dynamic";

export default async function AdminBookingsPage() {
  const bookings = await prisma.booking.findMany({
    include: { guests: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <AdminNav />
      <div className="space-y-6">
        <div className="animate-in space-y-1">
          <p className="eyebrow">Admin</p>
          <h1 className="text-3xl font-bold tracking-tight">Bookings</h1>
        </div>

        <Card className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-hairline text-xs font-semibold uppercase tracking-wide text-muted">
                <th className="pb-2 pr-4">Name</th>
                <th className="pb-2 pr-4">Email</th>
                <th className="pb-2 pr-4">Stay</th>
                <th className="pb-2 pr-4">Guests</th>
                <th className="pb-2 pr-4">Status</th>
                <th className="pb-2 pr-4">Flagged</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((b) => (
                <tr key={b.id} className="border-b border-hairline/60 last:border-0">
                  <td className="py-2.5 pr-4">
                    <Link href={`/admin/bookings/${b.id}`} className="font-semibold text-accent-dark hover:underline">
                      {b.firstName} {b.lastName}
                    </Link>
                  </td>
                  <td className="py-2.5 pr-4 text-muted">{b.hotelEmail}</td>
                  <td className="py-2.5 pr-4 whitespace-nowrap">
                    {formatShortDate(b.stayStart)} - {formatShortDate(b.stayEnd)}
                  </td>
                  <td className="py-2.5 pr-4">{b.guests.length}</td>
                  <td className="py-2.5 pr-4">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                        b.status === "ACTIVE" ? "bg-accent-soft text-accent-dark" : "bg-black/5 text-muted"
                      }`}
                    >
                      {b.status}
                    </span>
                  </td>
                  <td className="py-2.5 pr-4">{b.flaggedForReview ? "⚠️" : ""}</td>
                </tr>
              ))}
              {bookings.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-muted">
                    No bookings yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </Card>
      </div>
    </main>
  );
}
