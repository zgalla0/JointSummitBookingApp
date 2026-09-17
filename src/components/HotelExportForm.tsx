"use client";

import { useEffect, useState } from "react";
import { formatShortDate } from "@/lib/format";
import Button from "./ui/Button";
import Card from "./ui/Card";

type ExportResult = {
  since: string | null;
  generatedAt: string;
  counts: { newCount: number; editedCount: number; cancelledCount: number };
  summary: string;
  filename: string;
  fileBase64: string;
};

function downloadBase64File(base64: string, filename: string) {
  const bytes = atob(base64);
  const buffer = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) buffer[i] = bytes.charCodeAt(i);
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function HotelExportForm() {
  const [lastExportAt, setLastExportAt] = useState<string | null>(null);
  const [loadingLast, setLoadingLast] = useState(true);
  const [sinceOverride, setSinceOverride] = useState("");
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ExportResult | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch("/api/admin/hotel-export")
      .then((res) => res.json())
      .then((data) => setLastExportAt(data.lastExportAt ?? null))
      .catch(() => {})
      .finally(() => setLoadingLast(false));
  }, []);

  async function generate() {
    setGenerating(true);
    setError(null);
    setResult(null);
    setCopied(false);
    try {
      const res = await fetch("/api/admin/hotel-export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ since: sinceOverride || undefined }),
      });
      if (!res.ok) throw new Error("Something went wrong, please try again.");
      const data: ExportResult = await res.json();
      setResult(data);
      setLastExportAt(data.generatedAt);
      downloadBase64File(data.fileBase64, data.filename);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setGenerating(false);
    }
  }

  async function copySummary() {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result.summary);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard access can fail silently (permissions, insecure context) -
      // the summary is still right there in the textarea to select by hand.
    }
  }

  return (
    <div className="space-y-6">
      <Card eyebrow="Pull" title="Generate the hotel export">
        <div className="space-y-4">
          <p className="text-sm text-muted">
            {loadingLast
              ? "Loading last export date..."
              : lastExportAt
                ? `Last pulled ${formatShortDate(lastExportAt)}. By default, this includes only what's changed since then.`
                : "This will be the first pull - everything currently active and attending will be included as new."}
          </p>

          <div>
            <label className="field-label" htmlFor="since-override">
              Only include changes since (optional - overrides the default above for this pull)
            </label>
            <input
              id="since-override"
              type="date"
              className="field max-w-xs"
              value={sinceOverride}
              onChange={(e) => setSinceOverride(e.target.value)}
            />
          </div>

          <Button onClick={generate} disabled={generating}>
            {generating ? "Generating..." : "Generate hotel export"}
          </Button>
        </div>
      </Card>

      {error && <div className="animate-in rounded-2xl bg-red-50 p-4 text-sm text-red-700">{error}</div>}

      {result && (
        <Card eyebrow="Result" title="Summary">
          <div className="space-y-4">
            <div className="flex flex-wrap gap-4 text-sm">
              <span className="rounded-lg bg-[#e2f5e6] px-3 py-1.5 font-semibold text-[#1f7a3d]">
                {result.counts.newCount} new
              </span>
              <span className="rounded-lg bg-warning-soft px-3 py-1.5 font-semibold text-warning">
                {result.counts.editedCount} edited
              </span>
              <span className="rounded-lg bg-[#fde2e4] px-3 py-1.5 font-semibold text-[#b3261e]">
                {result.counts.cancelledCount} cancelled
              </span>
            </div>

            <div>
              <label className="field-label" htmlFor="summary-text">
                Paste this into your email to the hotel
              </label>
              <textarea
                id="summary-text"
                readOnly
                className="field h-20 resize-none font-mono text-xs"
                value={result.summary}
              />
              <div className="mt-2">
                <Button type="button" variant="secondary" onClick={copySummary}>
                  {copied ? "Copied!" : "Copy summary"}
                </Button>
              </div>
            </div>

            <p className="text-sm text-muted">
              {result.filename} has been downloaded. Green rows are new, yellow are edited, red are
              cancelled.
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}
