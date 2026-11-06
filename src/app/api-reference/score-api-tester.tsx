"use client";

import { useState, type FormEvent } from "react";
import { Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";

export function ScoreApiTester() {
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<{ status: string; body: string } | null>(null);

  async function runRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const endpoint = form.get("endpoint") === "analytics" ? "analytics" : "matches";
    const params = new URLSearchParams({ groupId: String(form.get("groupId")).trim() });
    if (endpoint === "matches") params.set("limit", "5");
    const started = performance.now();
    setPending(true);
    setResult(null);
    try {
      const response = await fetch(`/api/${endpoint}?${params}`, {
        signal: AbortSignal.timeout(15_000),
        cache: "no-store",
      });
      const payload = await response.json();
      if (Array.isArray(payload.matches) && payload.matches.length > 5) {
        payload.totalMatches = payload.matches.length;
        payload.matches = payload.matches.slice(0, 5);
      }
      setResult({
        status: `HTTP ${response.status} · ${Math.round(performance.now() - started)} ms`,
        body: JSON.stringify(payload, null, 2),
      });
    } catch {
      setResult({ status: "Request failed", body: "The response was unavailable or was not JSON." });
    } finally {
      setPending(false);
    }
  }

  return (
    <section aria-labelledby="tester" className="flex flex-col gap-4">
      <h2 id="tester" className="font-medium">Test a read request</h2>
      <form onSubmit={runRequest} className="flex flex-col items-start gap-4">
        <FieldGroup className="grid gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="api-group">Group ID</FieldLabel>
            <Input id="api-group" name="groupId" required pattern="[a-z0-9]{32}" />
          </Field>
          <Field>
            <FieldLabel htmlFor="api-endpoint">Endpoint</FieldLabel>
            <select id="api-endpoint" name="endpoint" className="min-h-9 rounded-lg border border-input bg-background px-3 text-sm">
              <option value="matches">GET /api/matches</option>
              <option value="analytics">GET /api/analytics</option>
            </select>
          </Field>
        </FieldGroup>
        <Button type="submit" disabled={pending}><Play data-icon="inline-start" />{pending ? "Running..." : "Run request"}</Button>
      </form>
      {result && (
        <div className="min-w-0 border-t pt-4">
          <p role="status" className="mb-2 text-sm font-medium">{result.status}</p>
          <pre aria-label="Response preview" tabIndex={0} className="max-h-96 overflow-auto rounded-md bg-muted p-3 text-xs">{result.body}</pre>
        </div>
      )}
    </section>
  );
}
