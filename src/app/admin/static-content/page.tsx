import { prisma } from "@/lib/prisma";
import AdminNav from "@/components/AdminNav";
import StaticContentManager from "@/components/StaticContentManager";

export const dynamic = "force-dynamic";

export default async function AdminStaticContentPage() {
  const items = await prisma.staticContent.findMany({ orderBy: { key: "asc" } });

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <AdminNav />
      <div className="space-y-6">
        <div className="animate-in space-y-1">
          <p className="eyebrow">Admin</p>
          <h1 className="text-3xl font-bold tracking-tight">Static content</h1>
          <p className="text-sm text-muted">
            Edits the &quot;Event info, Q&amp;A, and timing&quot; section shown on the public booking form.
          </p>
        </div>
        <StaticContentManager
          initial={items.map((i) => ({ key: i.key, title: i.title, body: i.body }))}
        />
      </div>
    </main>
  );
}
