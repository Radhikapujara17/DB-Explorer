import { Plus, Play, X } from "lucide-react";
import { operators, type Condition, type OperatorValue } from "@/lib/db-data";
import { cn } from "@/lib/utils";

type Props = {
  collectionName: string;
  fields: string[];
  conditions: Condition[];
  onChange: (conditions: Condition[]) => void;
  advanced: boolean;
  rawQuery: string;
  onRawQueryChange: (value: string) => void;
  projection: string;
  onProjectionChange: (value: string) => void;
  sort: string;
  onSortChange: (value: string) => void;
  onRun: () => void;
};

export function QueryPanel({
  collectionName,
  fields,
  conditions,
  onChange,
  advanced,
  rawQuery,
  onRawQueryChange,
  projection,
  onProjectionChange,
  sort,
  onSortChange,
  onRun,
}: Props) {
  const update = (id: string, patch: Partial<Condition>) =>
    onChange(conditions.map((c) => (c.id === id ? { ...c, ...patch } : c)));

  const chip =
    "flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm";

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      onRun();
    }
  };

  const editor = (
    label: string,
    value: string,
    setValue: (v: string) => void,
    rows: number,
    placeholder: string,
  ) => (
    <div className="min-w-0 flex-1">
      <label className="mb-1.5 block text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
        {label}
      </label>
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={onKeyDown}
        spellCheck={false}
        rows={rows}
        placeholder={placeholder}
        className="w-full rounded-lg border border-border bg-background p-3 font-mono text-xs outline-none focus:ring-2 focus:ring-ring/30"
      />
    </div>
  );

  return (
    <section className="border-b border-border bg-surface/40 px-4 py-5 sm:px-6 lg:px-8 lg:py-6">
      <div>
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <span className="text-sm font-medium">Find documents in</span>
          <span className="rounded bg-primary/10 px-2 py-0.5 text-sm font-semibold text-primary">
            {collectionName}
          </span>
          <span className="text-sm font-medium">where:</span>
        </div>

        {advanced ? (
          <div className="space-y-3">
            <div className="flex flex-col gap-3 lg:flex-row">
              {editor("Filter", rawQuery, onRawQueryChange, 6, "{}")}
              <div className="flex min-w-0 flex-1 flex-col gap-3">
                {editor("Projection", projection, onProjectionChange, 2, `{ "_id": 1 }`)}
                {editor("Sort", sort, onSortChange, 2, `{ "createdAt": -1 }`)}
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-end gap-3">
              <span className="mr-auto text-[11px] text-muted-foreground">
                Ctrl/⌘ + Enter to execute
              </span>
              <button
                onClick={onRun}
                className="inline-flex items-center gap-2 rounded-lg bg-foreground px-6 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90"
              >
                <Play className="size-4" />
                Run query
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-3">
            {conditions.map((c) => (
              <div key={c.id} className="flex flex-wrap items-center gap-2">
                <div className={chip}>
                  <span className="text-xs text-muted-foreground">Field</span>
                  <select
                    value={c.field}
                    onChange={(e) => update(c.id, { field: e.target.value })}
                    className="bg-transparent text-sm font-medium outline-none"
                  >
                    {fields.map((f) => (
                      <option key={f} value={f} className="bg-background text-foreground">
                        {f}
                      </option>
                    ))}
                  </select>
                </div>
                <div className={chip}>
                  <select
                    value={c.operator}
                    onChange={(e) =>
                      update(c.id, { operator: e.target.value as OperatorValue })
                    }
                    className="bg-transparent text-xs text-muted-foreground outline-none"
                  >
                    {operators.map((o) => (
                      <option key={o.value} value={o.value} className="bg-background text-foreground">
                        {o.label}
                      </option>
                    ))}
                  </select>
                  <input
                    value={c.value}
                    onChange={(e) => update(c.id, { value: e.target.value })}
                    onKeyDown={onKeyDown}
                    placeholder={c.operator === "in" ? "a, b, c" : "value"}
                    className="w-28 bg-transparent text-sm font-medium text-primary outline-none placeholder:font-normal placeholder:text-muted-foreground"
                  />
                </div>
                {conditions.length > 1 && (
                  <button
                    onClick={() => onChange(conditions.filter((x) => x.id !== c.id))}
                    aria-label="Remove condition"
                    className="text-muted-foreground transition-colors hover:text-destructive"
                  >
                    <X className="size-4" />
                  </button>
                )}
              </div>
            ))}

            <button
              onClick={() =>
                onChange([
                  ...conditions,
                  {
                    id: crypto.randomUUID(),
                    field: fields[0] ?? "",
                    operator: "eq",
                    value: "",
                  },
                ])
              }
              aria-label="Add condition"
              className={cn(
                "flex size-10 items-center justify-center rounded-lg border border-dashed border-border",
                "text-muted-foreground transition-colors hover:border-primary hover:text-primary",
              )}
            >
              <Plus className="size-4" />
            </button>

            <div className="ml-auto">
              <button
                onClick={onRun}
                className="inline-flex items-center gap-2 rounded-lg bg-foreground px-6 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90"
              >
                <Play className="size-4" />
                Run query
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
