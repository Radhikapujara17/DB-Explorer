import { useState } from "react";
import { Sparkles, Loader2, ArrowRight, Lightbulb } from "lucide-react";
import { translatePrompt, type AiResult } from "@/lib/ai-assistant";
import { cn } from "@/lib/utils";

type Props = {
  fields: string[];
  collectionName: string;
  onApply: (result: AiResult) => void;
};

const samples = [
  "Find active users created in 2024 with total spend over 500 sorted by spend",
  "Show orders where status is processing",
  "Count documents grouped by status",
  "Products with price under 200 that contain monitor",
];

export function AIAssistant({ fields, collectionName, onApply }: Props) {
  const [prompt, setPrompt] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<AiResult | null>(null);

  const run = (text: string) => {
    setPrompt(text);
    setBusy(true);
    setTimeout(() => {
      setResult(translatePrompt(text, fields));
      setBusy(false);
    }, 420);
  };

  return (
    <div className="mx-auto max-w-3xl space-y-5 p-4 sm:p-6 lg:p-8">
      <div>
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          <Sparkles className="size-4 text-primary" /> Ask in plain English
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Describe what you want from <span className="font-mono">{collectionName}</span> and it is
          translated into a MongoDB filter or aggregation pipeline.
        </p>
      </div>

      <div className="rounded-xl border border-border p-3">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) run(prompt);
          }}
          rows={3}
          placeholder="e.g. orders over 500 that are completed, grouped by status"
          className="w-full resize-none bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
        <div className="flex items-center justify-between gap-3 border-t border-border pt-3">
          <span className="text-[11px] text-muted-foreground">Ctrl/⌘ + Enter to generate</span>
          <button
            onClick={() => run(prompt)}
            disabled={!prompt.trim() || busy}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-1.5 text-xs font-medium text-primary-foreground disabled:opacity-50"
          >
            {busy ? <Loader2 className="size-3.5 animate-spin" /> : <Sparkles className="size-3.5" />}
            Generate query
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {samples.map((s) => (
          <button
            key={s}
            onClick={() => run(s)}
            className="rounded-full border border-border px-3 py-1.5 text-left text-xs text-muted-foreground hover:border-primary hover:text-primary"
          >
            {s}
          </button>
        ))}
      </div>

      {result && (
        <div className="space-y-4">
          <div className="rounded-xl border border-border">
            <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
              <span
                className={cn(
                  "rounded px-2 py-0.5 text-[11px] font-semibold",
                  result.kind === "pipeline"
                    ? "bg-warning/10 text-warning"
                    : "bg-success/10 text-success",
                )}
              >
                {result.kind === "pipeline" ? "Aggregation pipeline" : "Find filter"}
              </span>
              <button
                onClick={() => onApply(result)}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-primary"
              >
                Use this query <ArrowRight className="size-3.5" />
              </button>
            </div>
            <pre className="overflow-auto p-4 font-mono text-[11px] leading-relaxed">
              {result.code}
            </pre>
          </div>

          <div className="rounded-xl border border-border p-4">
            <h3 className="mb-2 text-xs font-semibold">How this query works</h3>
            <ol className="space-y-1.5">
              {result.steps.map((s, i) => (
                <li key={i} className="flex gap-2 text-sm">
                  <span className="text-muted-foreground">{i + 1}.</span>
                  <span>{s}</span>
                </li>
              ))}
            </ol>
          </div>

          <div className="rounded-xl border border-border bg-surface p-4">
            <h3 className="mb-2 flex items-center gap-1.5 text-xs font-semibold">
              <Lightbulb className="size-3.5 text-warning" /> Performance notes
            </h3>
            <ul className="space-y-1.5">
              {result.tips.map((t) => (
                <li key={t} className="text-sm text-muted-foreground">
                  • {t}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
