import { inferIndexes, inferSchema, typeColor } from "@/lib/db-schema";
import { formatValue, type Doc } from "@/lib/db-data";
import { cn } from "@/lib/utils";

type Props = { docs: Doc[]; collectionName: string; fields: string[] };

export function SchemaPanel({ docs, collectionName, fields }: Props) {
  const schema = inferSchema(docs);
  const indexes = inferIndexes(collectionName, fields, docs.length);

  return (
    <div className="space-y-8 p-4 sm:p-6 lg:p-8">
      <section>
        <h2 className="mb-1 text-sm font-semibold">Schema auto-discovery</h2>
        <p className="mb-4 text-xs text-muted-foreground">
          Inferred from the first {Math.min(docs.length, 100)} documents — field paths, BSON types
          and how often each field is populated.
        </p>
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead className="border-b border-border bg-surface">
              <tr>
                {["Field path", "Types", "Presence", "Sample"].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-[11px] font-bold tracking-wider text-muted-foreground uppercase"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {schema.map((f) => (
                <tr key={f.path} className="hover:bg-surface">
                  <td className="px-4 py-2.5 font-mono text-xs">{f.path}</td>
                  <td className="px-4 py-2.5">
                    <div className="flex flex-wrap gap-1">
                      {f.types.map((t) => (
                        <span
                          key={t}
                          className={cn(
                            "rounded px-1.5 py-0.5 text-[10px] font-semibold",
                            typeColor[t],
                          )}
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <span className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
                        <span
                          className="block h-full rounded-full bg-primary"
                          style={{ width: `${Math.round((1 - f.nullRatio) * 100)}%` }}
                        />
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {Math.round((1 - f.nullRatio) * 100)}%
                      </span>
                    </div>
                  </td>
                  <td className="max-w-[14rem] truncate px-4 py-2.5 font-mono text-xs text-muted-foreground">
                    {formatValue(f.sample)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="mb-1 text-sm font-semibold">Index inspector</h2>
        <p className="mb-4 text-xs text-muted-foreground">
          Key directions, uniqueness constraints and how often each index is hit.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          {indexes.map((idx) => (
            <div key={idx.name} className="rounded-xl border border-border p-4">
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="truncate font-mono text-xs font-medium">{idx.name}</span>
                {idx.unique && (
                  <span className="shrink-0 rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                    unique
                  </span>
                )}
              </div>
              <div className="mb-3 flex flex-wrap gap-1.5">
                {idx.keys.map((k) => (
                  <span
                    key={k.field}
                    className="rounded border border-border px-1.5 py-0.5 font-mono text-[11px]"
                  >
                    {k.field} {k.direction === 1 ? "↑" : "↓"}
                  </span>
                ))}
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Size {idx.size}</span>
                <span>Usage {idx.usage}%</span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
