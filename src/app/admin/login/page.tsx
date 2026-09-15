"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { Field } from "@/components/BookingFields";

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error?.formErrors?.[0] ?? "Incorrect password.");
      }
      router.push("/admin");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto max-w-sm px-4 py-14 sm:py-20">
      <div className="space-y-6">
        <div className="animate-in space-y-1">
          <p className="eyebrow">Admin</p>
          <h1 className="text-3xl font-bold tracking-tight">Sign in</h1>
        </div>
        <Card>
          <form onSubmit={onSubmit} className="space-y-4">
            {error && <p className="text-sm text-red-700">{error}</p>}
            <Field label="Password">
              <input
                type="password"
                className="field"
                autoFocus
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </Field>
            <Button type="submit" disabled={submitting || !password} className="w-full">
              {submitting ? "Signing in..." : "Sign in"}
            </Button>
          </form>
        </Card>
      </div>
    </main>
  );
}
