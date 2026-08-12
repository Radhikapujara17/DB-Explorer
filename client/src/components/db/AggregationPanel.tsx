import { useMemo, useState } from "react";
import { Plus, Trash2, Eye, EyeOff, Play, ChevronDown } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  chartData,
  defaultBody,
  runPipeline,
  stageTypes,
  type Stage,
  type StageType,
} from "@/lib/aggregation";
import type { Doc } from "@/lib/db-data";
import { cn } from "@/lib/utils";

type Props = { docs: Doc[]; lookups: Record<string, Doc[]> };

export function AggregationPanel({ docs, lookups }: Props) {
  const [stages, setStages] = useState<Stage[]>([
    { id: "s1", type: "$match", body: defaultBody("$match"), enabled: true },
    { id: "s2", type: "$group", body: defaultBody("$group"), enabled: true },
  ]);
  const [inspect, setInspect] = useState(99);
  const [runId, setRunId] = useState(0);

  const results = useMemo(
    () => runPipeline(docs, stages, lookups),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [docs, lookups, runId],
  );

  const current = results[Math.min(inspect, results.length - 1)];
  const chart = chartData(current?.docs ?? []);

  const update = (id: string, patch: Partial<Stage>) =>
    setStages((s) => s.map((x) => (x.id === id ? { ...x, ...patch } : x)));

  const pipelineJson = JSON.stringify(
    stages.filter((s) => s.enabled).map((s) => {
      try {
        return { [s.type]: JSON.parse(s.body) as unknown };
      } catch {
        return { [s.type]: s.body };
      }
    }),
    null,
    2,
  );

  return (
    <div className="grid gap-6 p-4 sm:p-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:p-8">
      <section>
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold">Pipeline stages</h2>
          <button
            onClick={() => setRunId((n) => n + 1)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-foreground px-3 py-1.5 text-xs font-medium text-background"
          >
            <Play className="size-3.5" /> Run pipeline
          </button>
        </div>

        <ol className="space-y-3">
          {stages.map((stage, i) => {
            const result = results[i];
            return (
              <li
                key={stage.id}
                className={cn(
                  "rounded-xl border p-3",
                  inspect === i ? "border-primary" : "border-border",
                )}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-[11px] font-semibold">
                    {i + 1}
                  </span>
                  <select
                    value={stage.type}
                    onChange={(e) =>
                      update(stage.id, {
                        type: e.target.value as StageType,
                        body: defaultBody(e.target.value as StageType),
                      })
                    }
                    className="rounded-lg border border-border bg-background px-2 py-1 font-mono text-xs outline-none"
                  >
                    {stageTypes.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                  <span className="text-xs text-muted-foreground">
                    {result?.error ? (
                      <span className="text-destructive">{result.error}</span>
                    ) : (
                      `${result?.docs.length ?? 0} docs out`
                    )}
                  </span>
                  <div className="ml-auto flex items-center gap-1">
                    <button
                      aria-label={stage.enabled ? "Disable stage" : "Enable stage"}
                      onClick={() => update(stage.id, { enabled: !stage.enabled })}
                      className="rounded p-1.5 text-muted-foreground hover:text-foreground"
                    >
                      {stage.enabled ? <Eye className="size-3.5" /> : <EyeOff className="size-3.5" />}
                    </button>
                    <button
                      aria-label="Inspect stage output"
                      onClick={() => setInspect(i)}
                      className="rounded p-1.5 text-muted-foreground hover:text-foreground"
                    >
                      <ChevronDown className="size-3.5" />
                    </button>
                    <button
                      aria-label="Remove stage"
                      onClick={() => setStages((s) => s.filter((x) => x.id !== stage.id))}
                      className="rounded p-1.5 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </div>
                <textarea
                  value={stage.body}
                  onChange={(e) => update(stage.id, { body: e.target.value })}
                  spellCheck={false}
                  rows={3}
                  className="mt-2 w-full rounded-lg border border-border bg-surface p-3 font-mono text-xs outline-none focus:ring-2 focus:ring-ring/30"
                />
              </li>
            );
          })}
        </ol>

        <button
          onClick={() =>
            setStages((s) => [
              ...s,
              { id: crypto.randomUUID(), type: "$sort", body: defaultBody("$sort"), enabled: true },
            ])
          }
          className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-dashed border-border px-3 py-2 text-xs font-medium text-muted-foreground hover:border-primary hover:text-primary"
        >
          <Plus className="size-3.5" /> Add stage
        </button>

        <details className="mt-4 rounded-xl border border-border p-3">
          <summary className="cursor-pointer text-xs font-medium text-muted-foreground">
            Generated pipeline
          </summary>
          <pre className="mt-2 overflow-auto font-mono text-[11px]">{pipelineJson}</pre>
        </details>
      </section>

      <section className="min-w-0">
        <h2 className="mb-3 text-sm font-semibold">
          Stage inspector · after stage {Math.min(inspect + 1, stages.length || 1)}
        </h2>

        {chart.length > 0 && (
          <div className="mb-4 h-56 rounded-xl border border-border p-3">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chart}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={11} />
                <YAxis stroke="var(--muted-foreground)" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    background: "var(--popover)",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                    fontSize: 12,
                    color: "var(--popover-foreground)",
                  }}
                />
                <Bar dataKey="value" fill="var(--primary)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        <pre className="max-h-[28rem] overflow-auto rounded-xl border border-border bg-surface p-4 font-mono text-[11px] leading-relaxed">
          {JSON.stringify(current?.docs ?? [], null, 2)}
        </pre>
      </section>
    </div>
  );
}
