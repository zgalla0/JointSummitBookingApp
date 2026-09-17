import { prisma } from "@/lib/prisma";
import AdminNav from "@/components/AdminNav";
import StaticContentManager from "@/components/StaticContentManager";
import Card from "@/components/ui/Card";
import { INTERNAL_STATIC_CONTENT_KEYS } from "@/lib/internal-static-content";

export const dynamic = "force-dynamic";

export default async function AdminStaticContentPage() {
  const items = await prisma.staticContent.findMany({
    where: { key: { notIn: INTERNAL_STATIC_CONTENT_KEYS } },
    orderBy: { key: "asc" },
  });

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-10">
      <AdminNav />
      <div className="space-y-6">
        <div className="animate-in space-y-1">
          <p className="eyebrow">Admin</p>
          <h1 className="text-3xl font-bold tracking-tight">Static content</h1>
        </div>

        <Card eyebrow="Where this goes" title="What is this used for?" className="text-sm text-muted">
          <p>
            Every entry you add here shows up as its own title-and-paragraph block in the{" "}
            <strong className="text-foreground">&quot;Event info, Q&amp;A, and timing&quot;</strong> card
            on the public booking form - the same page attendees fill out, right next to the FAQ. It&apos;s
            for anything you want every attendee to see without them having to ask, that isn&apos;t already
            covered by the form fields or FAQ.
          </p>
          <p className="mt-3">Some examples of entries you might add:</p>
          <ul className="mt-1 list-disc space-y-1 pl-5">
            <li>
              <span className="font-semibold text-foreground">Key:</span> &quot;wifi&quot; -{" "}
              <span className="font-semibold text-foreground">Title:</span> &quot;Hotel wifi&quot; -{" "}
              <span className="font-semibold text-foreground">Body:</span> the network name and password
            </li>
            <li>
              <span className="font-semibold text-foreground">Key:</span> &quot;hotel-address&quot; -{" "}
              <span className="font-semibold text-foreground">Title:</span> &quot;Hotel address&quot; -{" "}
              <span className="font-semibold text-foreground">Body:</span> the full address and a note
              on getting there from the airport
            </li>
            <li>
              <span className="font-semibold text-foreground">Key:</span> &quot;weather&quot; -{" "}
              <span className="font-semibold text-foreground">Title:</span> &quot;What to pack&quot; -{" "}
              <span className="font-semibold text-foreground">Body:</span> expected weather and a
              packing suggestion
            </li>
          </ul>
          <p className="mt-3">
            The key is just an internal label (lowercase, hyphens) and is never shown to attendees -
            only the title and body appear on the public page. An entry with no title or body left
            blank simply omits that part.
          </p>
        </Card>

        <StaticContentManager
          initial={items.map((i) => ({ key: i.key, title: i.title, body: i.body }))}
        />
      </div>
    </main>
  );
}
