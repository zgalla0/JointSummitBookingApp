"use client";

import { useState } from "react";
import Card from "./ui/Card";
import Button from "./ui/Button";
import { Field } from "./BookingFields";

export type StaticContentItem = {
  key: string;
  title: string | null;
  body: string | null;
};

function EntryForm({
  initial,
  onSaved,
}: {
  initial: StaticContentItem;
  onSaved: (item: StaticContentItem) => void;
}) {
  const [key, setKey] = useState(initial.key);
  const [title, setTitle] = useState(initial.title ?? "");
  const [body, setBody] = useState(initial.body ?? "");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const isNew = initial.key === "";

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/static-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, title, body }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error?.formErrors?.[0] ?? "Something went wrong.");
      }
      onSaved({ key, title, body });
      if (isNew) {
        setKey("");
        setTitle("");
        setBody("");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-3">
      {error && <p className="text-sm text-red-700">{error}</p>}
      <Field label="Key (lowercase, hyphens only)">
        <input
          className="field font-mono text-sm"
          value={key}
          disabled={!isNew}
          onChange={(e) => setKey(e.target.value)}
          placeholder="e.g. parking-info"
        />
      </Field>
      <Field label="Title">
        <input className="field" value={title} onChange={(e) => setTitle(e.target.value)} />
      </Field>
      <Field label="Body">
        <textarea
          className="field min-h-24"
          value={body}
          onChange={(e) => setBody(e.target.value)}
        />
      </Field>
      <Button onClick={save} disabled={saving || !key.trim()}>
        {saving ? "Saving..." : isNew ? "Add entry" : "Save changes"}
      </Button>
    </div>
  );
}

export default function StaticContentManager({ initial }: { initial: StaticContentItem[] }) {
  const [items, setItems] = useState(initial);
  const [deleting, setDeleting] = useState<string | null>(null);

  function upsertLocal(item: StaticContentItem) {
    setItems((prev) => {
      const exists = prev.some((i) => i.key === item.key);
      return exists ? prev.map((i) => (i.key === item.key ? item : i)) : [...prev, item];
    });
  }

  async function remove(key: string) {
    setDeleting(key);
    try {
      await fetch(`/api/admin/static-content/${key}`, { method: "DELETE" });
      setItems((prev) => prev.filter((i) => i.key !== key));
    } finally {
      setDeleting(null);
    }
  }

  return (
    <div className="space-y-6">
      {items.map((item) => (
        <Card key={item.key} eyebrow={item.key} title={item.title || "(untitled)"}>
          <div className="space-y-4">
            <EntryForm initial={item} onSaved={upsertLocal} />
            <Button variant="ghost" onClick={() => remove(item.key)} disabled={deleting === item.key}>
              {deleting === item.key ? "Deleting..." : "Delete entry"}
            </Button>
          </div>
        </Card>
      ))}

      <Card eyebrow="New" title="Add a static content entry">
        <EntryForm initial={{ key: "", title: "", body: "" }} onSaved={upsertLocal} />
      </Card>
    </div>
  );
}
