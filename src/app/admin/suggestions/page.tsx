import { prisma } from "@/lib/prisma";
import { formatShortDate } from "@/lib/format";
import AdminNav from "@/components/AdminNav";
import Card from "@/components/ui/Card";

export const dynamic = "force-dynamic";

export default async function AdminSuggestionsPage() {
  const suggestions = await prisma.formSuggestion.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-10">
      <AdminNav />
      <div className="space-y-6">
        <div className="animate-in space-y-1">
          <p className="eyebrow">Admin</p>
          <h1 className="text-3xl font-bold tracking-tight">Suggestions</h1>
          <p className="text-sm text-muted">
            Anonymous feedback submitted from the &quot;Ideas for the form?&quot; box on the public
            page. Not tied to any booking, and nothing is emailed - this is the only place these show
            up.
          </p>
        </div>

        <Card>
          {suggestions.length === 0 ? (
            <p className="text-sm text-muted">No suggestions yet.</p>
          ) : (
            <div className="divide-y divide-hairline">
              {suggestions.map((s) => (
                <div key={s.id} className="py-4 first:pt-0 last:pb-0">
                  <p className="text-xs font-semibold text-muted">{formatShortDate(s.createdAt)}</p>
                  <p className="mt-1 text-sm whitespace-pre-wrap text-foreground">{s.message}</p>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </main>
  );
}
