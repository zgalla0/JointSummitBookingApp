"use client";

import { useEffect, useState } from "react";
import { formatShortDate } from "@/lib/format";
import type { HotelExportPreviewRow } from "@/lib/hotel-export-rows";
import {
  HOTEL_EXPORT_PULLER_OPTIONS,
  HOTEL_EXPORT_PURPOSE_DEFAULT,
  HOTEL_EXPORT_PURPOSE_OPTIONS,
} from "@/lib/hotel-export-log-options";
import Button from "./ui/Button";
import Card from "./ui/Card";

type PreviewResult = {
  since: string | null;
  counts: { newCount: number; editedCount: number; cancelledCount: number };
  rows: HotelExportPreviewRow[];
};

type SendResult = {
  since: string | null;
  generatedAt: string;
  counts: { newCount: number; editedCount: number; cancelledCount: number };
  summary: string;
  filename: string;
  fileBase64: string;
};

const CATEGORY_BG: Record<HotelExportPreviewRow["category"], string> = {
  New: "#e2f5e6",
  Edited: "#fff6dc",
  Cancelled: "#fde2e4",
};

const CELL_BG: Record<HotelExportPreviewRow["category"], string> = {
  New: "#c6efce",
  Edited: "#fff2cc",
  Cancelled: "#ffc7ce",
};

const PREVIEW_COLUMNS: { key: keyof HotelExportPreviewRow["data"]; label: string }[] = [
  { key: "whatChanged", label: "What changed" },
  { key: "reservationFirstName", label: "First name" },
  { key: "reservationLastName", label: "Last name" },
  { key: "nameTag", label: "Name tag" },
  { key: "checkIn", label: "Check in" },
  { key: "checkOut", label: "Check out" },
  { key: "nights", label: "Nights" },
  { key: "nightsCompanyPaid", label: "Co. paid" },
  { key: "nightsSelfPaid", label: "Self paid" },
  { key: "roomType", label: "Room type" },
  { key: "totalOccupants", label: "Occupants" },
  { key: "additionalGuestNames", label: "Guests" },
  { key: "contactEmail", label: "Email" },
];

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

function PreviewTable({ preview }: { preview: PreviewResult }) {
  if (preview.rows.length === 0) {
    return <p className="text-sm text-muted">No new, edited, or cancelled bookings in this window.</p>;
  }
  return (
    <div className="overflow-x-auto rounded-xl border border-hairline">
      <table className="w-full min-w-[900px] text-sm">
        <thead>
          <tr className="border-b border-hairline bg-background text-left text-xs text-muted uppercase">
            <th className="px-3 py-2 font-semibold">Status</th>
            {PREVIEW_COLUMNS.map((col) => (
              <th key={col.key} className="px-3 py-2 font-semibold">
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {preview.rows.map((row, i) => {
            const wholeRow = row.highlightFields.length === 0;
            return (
              <tr key={i} className="border-b border-hairline last:border-0">
                <td className="px-3 py-2 font-semibold" style={{ background: CATEGORY_BG[row.category] }}>
                  {row.category}
                </td>
                {PREVIEW_COLUMNS.map((col) => {
                  const highlighted = wholeRow || row.highlightFields.includes(col.key);
                  return (
                    <td
                      key={col.key}
                      className="px-3 py-2 whitespace-nowrap"
                      style={highlighted ? { background: CELL_BG[row.category] } : undefined}
                    >
                      {String(row.data[col.key])}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default function HotelExportForm() {
  const [lastExportAt, setLastExportAt] = useState<string | null>(null);
  const [loadingLast, setLoadingLast] = useState(true);
  const [showOverride, setShowOverride] = useState(false);
  const [sinceOverride, setSinceOverride] = useState("");

  const [previewing, setPreviewing] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [preview, setPreview] = useState<PreviewResult | null>(null);

  const [pulledBy, setPulledBy] = useState("");
  const [pulledByOther, setPulledByOther] = useState("");
  const [purpose, setPurpose] = useState(HOTEL_EXPORT_PURPOSE_DEFAULT);
  const [purposeOther, setPurposeOther] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [result, setResult] = useState<SendResult | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch("/api/admin/hotel-export")
      .then((res) => res.json())
      .then((data) => setLastExportAt(data.lastExportAt ?? null))
      .catch(() => {})
      .finally(() => setLoadingLast(false));
  }, []);

  function onSinceChange(value: string) {
    setSinceOverride(value);
    // A changed date invalidates whatever was previewed - force a fresh
    // Pull before Send to Hotel becomes available again.
    setPreview(null);
    setResult(null);
  }

  async function pull() {
    setPreviewing(true);
    setPreviewError(null);
    setResult(null);
    try {
      const res = await fetch("/api/admin/hotel-export/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ since: sinceOverride || undefined }),
      });
      if (!res.ok) throw new Error("Something went wrong, please try again.");
      const data: PreviewResult = await res.json();
      setPreview(data);
    } catch (err) {
      setPreviewError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setPreviewing(false);
    }
  }

  async function send() {
    if (!preview) return;
    const resolvedPulledBy = pulledBy === "Other" ? pulledByOther.trim() : pulledBy;
    const resolvedPurpose = purpose === "Other" ? purposeOther.trim() : purpose;
    if (!resolvedPulledBy) {
      setSendError("Please say who's pulling this export.");
      return;
    }
    if (!resolvedPurpose) {
      setSendError("Please say what this export is for.");
      return;
    }

    setSending(true);
    setSendError(null);
    setResult(null);
    setCopied(false);
    try {
      const res = await fetch("/api/admin/hotel-export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          since: preview.since ?? undefined,
          pulledBy: resolvedPulledBy,
          purpose: resolvedPurpose,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error?.formErrors?.[0] ?? "Something went wrong, please try again.");
      }
      setResult(data);
      setLastExportAt(data.generatedAt);
      setPreview(null);
      downloadBase64File(data.fileBase64, data.filename);
    } catch (err) {
      setSendError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSending(false);
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
      <Card eyebrow="Step 1" title="Pull">
        <div className="space-y-4">
          <p className="text-sm text-muted">
            {loadingLast
              ? "Loading last export date..."
              : lastExportAt
                ? `Last sent to the hotel ${formatShortDate(lastExportAt)}. Pulling will show what's changed since then.`
                : "This will be the first pull - everything currently active and attending will show as new."}
          </p>

          {!showOverride ? (
            <button
              type="button"
              onClick={() => setShowOverride(true)}
              className="text-sm font-semibold text-accent-dark hover:underline"
            >
              Need a different date range instead?
            </button>
          ) : (
            <div>
              <label className="field-label" htmlFor="since-override">
                Only include changes since
              </label>
              <input
                id="since-override"
                type="date"
                className="field max-w-xs"
                value={sinceOverride}
                onChange={(e) => onSinceChange(e.target.value)}
              />
              <p className="mt-1.5 text-xs text-muted">
                Leave blank and this goes back to the default above.
              </p>
            </div>
          )}

          <Button onClick={pull} disabled={previewing}>
            {previewing ? "Pulling..." : "Pull"}
          </Button>
        </div>
      </Card>

      {previewError && <div className="animate-in rounded-2xl bg-red-50 p-4 text-sm text-red-700">{previewError}</div>}

      {preview && (
        <Card eyebrow="Step 2" title="What will be sent to the hotel">
          <div className="space-y-4">
            <div className="flex flex-wrap gap-4 text-sm">
              <span className="rounded-lg bg-[#e2f5e6] px-3 py-1.5 font-semibold text-[#1f7a3d]">
                {preview.counts.newCount} new
              </span>
              <span className="rounded-lg bg-warning-soft px-3 py-1.5 font-semibold text-warning">
                {preview.counts.editedCount} edited
              </span>
              <span className="rounded-lg bg-[#fde2e4] px-3 py-1.5 font-semibold text-[#b3261e]">
                {preview.counts.cancelledCount} cancelled
              </span>
            </div>

            <PreviewTable preview={preview} />

            <div className="space-y-3 rounded-xl border border-hairline p-3">
              <p className="field-label">Log this pull</p>

              <div>
                <label className="field-label" htmlFor="pulled-by">
                  Who is pulling this?
                </label>
                <select
                  id="pulled-by"
                  className="field"
                  value={pulledBy}
                  onChange={(e) => setPulledBy(e.target.value)}
                >
                  <option value="">Select a name</option>
                  {HOTEL_EXPORT_PULLER_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
                {pulledBy === "Other" && (
                  <input
                    className="field mt-2"
                    placeholder="Enter name"
                    value={pulledByOther}
                    onChange={(e) => setPulledByOther(e.target.value)}
                  />
                )}
              </div>

              <div>
                <label className="field-label" htmlFor="purpose">
                  Purpose
                </label>
                <select
                  id="purpose"
                  className="field"
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                >
                  {HOTEL_EXPORT_PURPOSE_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
                {purpose === "Other" && (
                  <input
                    className="field mt-2"
                    placeholder="What is this export for?"
                    value={purposeOther}
                    onChange={(e) => setPurposeOther(e.target.value)}
                  />
                )}
                <p className="mt-1.5 text-xs text-muted">
                  If you need this information for something other than the hotel roster, use the
                  &quot;View All Data&quot; export on the Dashboard instead.
                </p>
              </div>
            </div>

            {sendError && <div className="animate-in rounded-2xl bg-red-50 p-4 text-sm text-red-700">{sendError}</div>}

            <Button onClick={send} disabled={sending}>
              {sending ? "Sending..." : "Send to Hotel"}
            </Button>
          </div>
        </Card>
      )}

      {result && (
        <Card eyebrow="Sent" title="Summary">
          <div className="space-y-4">
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
              {result.filename} has been downloaded and logged below. Pull again to review before your
              next send.
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}
