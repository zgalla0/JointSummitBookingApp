import AdminNav from "@/components/AdminNav";
import RosterCheckForm from "@/components/RosterCheckForm";

export const dynamic = "force-dynamic";

export default function AdminRosterPage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <AdminNav />
      <div className="space-y-6">
        <div className="animate-in space-y-1">
          <p className="eyebrow">Admin</p>
          <h1 className="text-3xl font-bold tracking-tight">Roster check</h1>
        </div>
        <RosterCheckForm />
      </div>
    </main>
  );
}
