"use client";

import { useState } from "react";
import { guessFirstName, type RosterComparison } from "@/lib/roster-compare";
import Button from "./ui/Button";
import Card from "./ui/Card";
import RosterReminderButton from "./RosterReminderButton";

export default function RosterCheckForm() {
  const [file, setFile] = useState<File | null>(null);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<RosterComparison | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;
    setChecking(true);
    setError(null);
    setResult(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/admin/roster-check", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error?.formErrors?.[0] ?? "Something went wrong, please try again.");
      }
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setChecking(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card eyebrow="Upload" title="Compare against the HR roster">
        <form onSubmit={onSubmit} className="space-y-4">
          <p className="text-sm text-muted">
            Upload the roster export (.xlsx, .csv, or .tsv) with columns for the employee&apos;s name,
            title, employment type, Cuesta email, and location. Only the email column is matched -
            column order doesn&apos;t matter.
          </p>
          <input
            type="file"
            accept=".xlsx,.csv,.tsv"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="field"
          />
          <Button type="submit" disabled={!file || checking}>
            {checking ? "Comparing..." : "Compare"}
          </Button>
        </form>
      </Card>

      {error && <div className="animate-in rounded-2xl bg-red-50 p-4 text-sm text-red-700">{error}</div>}

      {result && (
        <>
          <Card eyebrow="Results" title="Summary" className="text-sm text-muted">
            <p>
              {result.rosterRowCount} people on the roster · {result.missingFromForm.length} haven&apos;t
              submitted the form · {result.submittedNotOnRoster.length} submitted with an email not on
              the roster.
            </p>
          </Card>

          <Card
            eyebrow="On roster"
            title={`Haven't filled out the form (${result.missingFromForm.length})`}
          >
            {result.missingFromForm.length === 0 ? (
              <p className="text-sm text-muted">Everyone on the roster has submitted the form.</p>
            ) : (
              <div className="space-y-4">
                <div className="overflow-x-auto rounded-xl border border-hairline">
                  <table className="w-full min-w-[600px] text-sm">
                    <thead>
                      <tr className="border-b border-hairline bg-background text-left text-xs text-muted uppercase">
                        <th className="px-3 py-2 font-semibold">Name</th>
                        <th className="px-3 py-2 font-semibold">Title</th>
                        <th className="px-3 py-2 font-semibold">Employment type</th>
                        <th className="px-3 py-2 font-semibold">Cuesta email</th>
                        <th className="px-3 py-2 font-semibold">Location</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.missingFromForm.map((r, i) => (
                        <tr key={`${r.cuestaEmail}-${i}`} className="border-b border-hairline last:border-0">
                          <td className="px-3 py-2 font-medium">{r.employeeName}</td>
                          <td className="px-3 py-2">{r.title}</td>
                          <td className="px-3 py-2">{r.employmentType}</td>
                          <td className="px-3 py-2">{r.cuestaEmail}</td>
                          <td className="px-3 py-2">
                            {[r.state, r.country].filter(Boolean).join(", ")}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <RosterReminderButton
                  recipients={result.missingFromForm.map((r) => ({
                    email: r.cuestaEmail,
                    firstName: guessFirstName(r.employeeName),
                  }))}
                />
              </div>
            )}
          </Card>

          <Card
            eyebrow="On form"
            title={`Submitted, but email isn't on the roster (${result.submittedNotOnRoster.length})`}
          >
            {result.submittedNotOnRoster.length === 0 ? (
              <p className="text-sm text-muted">
                Every active booking&apos;s Cuesta email matches someone on the roster.
              </p>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-hairline">
                <table className="w-full min-w-[400px] text-sm">
                  <thead>
                    <tr className="border-b border-hairline bg-background text-left text-xs text-muted uppercase">
                      <th className="px-3 py-2 font-semibold">Name</th>
                      <th className="px-3 py-2 font-semibold">Cuesta email on the booking</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.submittedNotOnRoster.map((b) => (
                      <tr key={b.bookingId} className="border-b border-hairline last:border-0">
                        <td className="px-3 py-2 font-medium">{b.name}</td>
                        <td className="px-3 py-2">{b.cuestaEmail}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
