import AdminNav from "@/components/AdminNav";
import HotelExportForm from "@/components/HotelExportForm";

export const dynamic = "force-dynamic";

export default function AdminHotelExportPage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <AdminNav />
      <div className="space-y-6">
        <div className="animate-in space-y-1">
          <p className="eyebrow">Admin</p>
          <h1 className="text-3xl font-bold tracking-tight">Hotel export</h1>
          <p className="text-sm text-muted">
            Builds the file to send to the hotel: only bookings that are new, edited, or cancelled
            since the last pull, color-coded so changes are obvious at a glance.
          </p>
        </div>
        <HotelExportForm />
      </div>
    </main>
  );
}
