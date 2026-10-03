"use client";
import { useEffect, useState } from "react";

interface Metrics {
  completedContinuityPlans: number;
  averageReadiness: number | null;
  contributingHouseholds: number;
  suppressed: boolean;
  note: string;
}

export default function MetricsClient() {
  const [state, setState] = useState<{ loading: boolean; error?: string; data?: Metrics }>({
    loading: true,
  });
  useEffect(() => {
    fetch("/api/institutional/metrics")
      .then(async (r) => {
        if (r.status === 403) {
          setState({ loading: false, error: "Platform administrators only." });
          return;
        }
        if (!r.ok) {
          setState({ loading: false, error: "Could not load metrics." });
          return;
        }
        setState({ loading: false, data: (await r.json()) as Metrics });
      })
      .catch(() => setState({ loading: false, error: "Could not load metrics." }));
  }, []);
  if (state.loading) return <p className="ir-sub">Loading…</p>;
  if (state.error || !state.data) {
    return (
      <p className="ir-gap" role="status">
        {state.error ?? "Could not load metrics."} Aggregate metrics require a platform-admin session.
      </p>
    );
  }
  const m = state.data;
  return (
    <div>
      <dl className="ir-kv">
        <div><dt>Completed continuity plans</dt><dd>{m.completedContinuityPlans}</dd></div>
        <div><dt>Average readiness (baseline)</dt><dd>{m.averageReadiness === null ? "suppressed (n<5)" : `${m.averageReadiness}%`}</dd></div>
        <div><dt>Contributing households</dt><dd>{m.contributingHouseholds}</dd></div>
      </dl>
      <p className="ir-hint">{m.note}</p>
    </div>
  );
}
