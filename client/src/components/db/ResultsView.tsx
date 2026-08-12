import { useState } from "react";
import { Eye, Pencil, Trash2, ChevronRight, Copy, ArrowUp, ArrowDown } from "lucide-react";
import { formatValue, type Doc } from "@/lib/db-data";
import { bsonType, typeColor } from "@/lib/db-schema";
import { cn } from "@/lib/utils";

export type ViewMode = "table" | "cards" | "tree" | "json";
export type Sort = { field: string; direction: 1 | -1 } | null;

type Props = {
  docs: Doc[];
  fields: string[];
  view: ViewMode;
  sort: Sort;
  onSort: (field: string) => void;
  readOnly: boolean;
  onView: (doc: Doc) => void;
  onEdit: (doc: Doc) => void;
  onDelete: (doc: Doc) => void;
};

type ActionProps = Pick<Props, "onView" | "onEdit" | "onDelete" | "readOnly"> & { doc: Doc };

function RowActions({ doc, onView, onEdit, onDelete, readOnly }: ActionProps) {
  const base =
    "rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground";
  return (
    <div className="flex items-center gap-1">
      <button className={base} aria-label="View document" onClick={() => onView(doc)}>
        <Eye className="size-4" />
      </button>
      <button
        className={cn(base, readOnly && "cursor-not-allowed opacity-40")}
        aria-label="Edit document"
        disabled={readOnly}
        onClick={() => onEdit(doc)}
      >
        <Pencil className="size-4" />
      </button>
      <button
        className={cn(
          base,
          "hover:bg-destructive/10 hover:text-destructive",
          readOnly && "cursor-not-allowed opacity-40",
        )}
        aria-label="Delete document"
        disabled={readOnly}
        onClick={() => onDelete(doc)}
      >
        <Trash2 className="size-4" />
      </button>
    </div>
  );
}

function TypeBadge({ value, path }: { value: unknown; path: string }) {
  const t = bsonType(value, path);
  return (
    <span className={cn("rounded px-1.5 py-0.5 text-[10px] font-semibold", typeColor[t])}>{t}</span>
  );
}

function TreeNode({ label, value, path }: { label: string; value: unknown; path: string }) {
  const [open, setOpen] = useState(false);
  const branch = value !== null && typeof value === "object";
  const entries = branch ? Object.entries(value as Record<string, unknown>) : [];

  return (
    <li>
      <div className="group flex items-start gap-2 py-1 text-sm">
        {branch ? (
          <button
            onClick={() => setOpen((o) => !o)}
            aria-label={open ? `Collapse ${label}` : `Expand ${label}`}
            className="mt-0.5 text-muted-foreground"
          >
            <ChevronRight className={cn("size-3.5 transition-transform", open && "rotate-90")} />
          </button>
        ) : (
          <span className="w-3.5" />
        )}
        <span className="min-w-32 font-medium">{label}</span>
        <TypeBadge value={value} path={path} />
        {!branch && (
          <span className="min-w-0 font-mono text-xs break-all">{formatValue(value)}</span>
        )}
        <button
          onClick={() => void navigator.clipboard?.writeText(path)}
          aria-label={`Copy path ${path}`}
          className="ml-auto shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
        >
          <Copy className="size-3.5 text-muted-foreground" />
        </button>
      </div>
      {branch && open && (
        <ul className="ml-4 border-l border-border pl-3">
          {entries.map(([k, v]) => (
            <TreeNode key={k} label={k} value={v} path={`${path}.${k}`} />
          ))}
        </ul>
      )}
    </li>
  );
}

export function ResultsView({
  docs,
  fields,
  view,
  sort,
  onSort,
  readOnly,
  onView,
  onEdit,
  onDelete,
}: Props) {
  if (docs.length === 0) {
    return (
      <div className="flex h-full items-center justify-center p-12 text-center">
        <div>
          <p className="text-sm font-medium">No documents match this query</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Try removing a condition or changing its value.
          </p>
        </div>
      </div>
    );
  }

  if (view === "json") {
    return (
      <div className="space-y-4 p-4 sm:p-6 lg:p-8">
        {docs.map((doc, i) => (
          <div key={i} className="rounded-lg border border-border">
            <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-2">
              <span className="font-mono text-xs text-muted-foreground">
                {String(doc["_id"] ?? i)}
              </span>
              <RowActions
                doc={doc}
                onView={onView}
                onEdit={onEdit}
                onDelete={onDelete}
                readOnly={readOnly}
              />
            </div>
            <pre className="overflow-auto p-4 font-mono text-xs leading-relaxed">
              {JSON.stringify(doc, null, 2)}
            </pre>
          </div>
        ))}
      </div>
    );
  }

  if (view === "tree") {
    return (
      <div className="space-y-4 p-4 sm:p-6 lg:p-8">
        {docs.map((doc, i) => (
          <div key={i} className="rounded-lg border border-border">
            <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-2">
              <span className="font-mono text-xs text-muted-foreground">
                {String(doc["_id"] ?? i)}
              </span>
              <RowActions
                doc={doc}
                onView={onView}
                onEdit={onEdit}
                onDelete={onDelete}
                readOnly={readOnly}
              />
            </div>
            <ul className="p-3">
              {Object.entries(doc).map(([k, v]) => (
                <TreeNode key={k} label={k} value={v} path={k} />
              ))}
            </ul>
          </div>
        ))}
      </div>
    );
  }

  if (view === "cards") {
    return (
      <div className="grid gap-4 p-4 sm:p-6 sm:grid-cols-2 lg:p-8 xl:grid-cols-3">
        {docs.map((doc, i) => (
          <article key={i} className="rounded-xl border border-border p-4">
            <div className="mb-3 flex items-center justify-between gap-2">
              <span className="truncate font-mono text-xs text-muted-foreground">
                {String(doc["_id"] ?? i)}
              </span>
              <RowActions
                doc={doc}
                onView={onView}
                onEdit={onEdit}
                onDelete={onDelete}
                readOnly={readOnly}
              />
            </div>
            <dl className="space-y-1.5">
              {fields.slice(1, 6).map((f) => (
                <div key={f} className="flex gap-3 text-sm">
                  <dt className="w-28 shrink-0 text-muted-foreground">{f}</dt>
                  <dd className="min-w-0 truncate font-medium">{formatValue(doc[f])}</dd>
                </div>
              ))}
            </dl>
          </article>
        ))}
      </div>
    );
  }

  return (
    <table className="w-full min-w-[720px] border-collapse text-left">
      <thead className="sticky top-0 border-b border-border bg-background">
        <tr>
          {fields.map((f, i) => (
            <th
              key={f}
              className={cn(
                "py-4 text-[11px] font-bold tracking-wider text-muted-foreground uppercase",
                i === 0 ? "pr-4 pl-4 sm:pr-6 sm:pl-6 lg:pl-8" : "px-6",
              )}
            >
              <button
                onClick={() => onSort(f)}
                className="inline-flex items-center gap-1 transition-colors hover:text-foreground"
              >
                {f}
                {sort?.field === f &&
                  (sort.direction === 1 ? (
                    <ArrowUp className="size-3" />
                  ) : (
                    <ArrowDown className="size-3" />
                  ))}
              </button>
            </th>
          ))}
          <th className="sticky right-0 bg-background px-6 py-4 text-right text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
            Actions
          </th>
        </tr>
      </thead>
      <tbody className="divide-y divide-border">
        {docs.map((doc, i) => (
          <tr key={i} className="group transition-colors hover:bg-surface">
            {fields.map((f, j) => (
              <td
                key={f}
                className={cn(
                  "py-4 text-sm",
                  j === 0
                    ? "pr-4 pl-4 sm:pr-6 sm:pl-6 lg:pl-8 font-mono text-xs text-muted-foreground"
                    : "max-w-[16rem] truncate px-6",
                )}
              >
                {formatValue(doc[f])}
              </td>
            ))}
            <td className="sticky right-0 bg-background px-6 py-4 group-hover:bg-surface">
              <div className="flex justify-end opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                <RowActions
                  doc={doc}
                  onView={onView}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  readOnly={readOnly}
                />
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
