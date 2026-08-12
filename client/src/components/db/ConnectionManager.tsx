import { useState } from "react";
import { Plug, Check, Loader2, Plus, Trash2, ShieldCheck, X } from "lucide-react";
import {
  pingConnection,
  profileColors,
  type ConnectionProfile,
} from "@/lib/connections";
import { cn } from "@/lib/utils";

type Props = {
  profiles: ConnectionProfile[];
  activeId: string;
  onSelect: (id: string) => void;
  onChange: (profiles: ConnectionProfile[]) => void;
  onClose: () => void;
};

export function ConnectionManager({ profiles, activeId, onSelect, onChange, onClose }: Props) {
  const [label, setLabel] = useState("");
  const [uri, setUri] = useState("mongodb://localhost:27017");
  const [color, setColor] = useState(profileColors[0]!);
  const [pinging, setPinging] = useState<string | null>(null);
  const [ping, setPing] = useState<Record<string, { ok: boolean; latency: number }>>({});

  const test = async (p: ConnectionProfile) => {
    setPinging(p.id);
    const result = await pingConnection(p.uri);
    setPing((s) => ({ ...s, [p.id]: result }));
    setPinging(null);
  };

  const add = () => {
    if (!label.trim() || !uri.trim()) return;
    onChange([
      ...profiles,
      { id: crypto.randomUUID(), label: label.trim(), uri: uri.trim(), color, readOnly: false },
    ]);
    setLabel("");
    setUri("mongodb://localhost:27017");
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/20 p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[85vh] w-full max-w-lg flex-col rounded-xl border border-border bg-background shadow-lg"
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="flex items-center gap-2 text-sm font-semibold">
            <Plug className="size-4 text-primary" /> Connections
          </h2>
          <button onClick={onClose} aria-label="Close connections">
            <X className="size-4 text-muted-foreground" />
          </button>
        </div>

        <div className="min-h-0 flex-1 space-y-3 overflow-auto p-5">
          {profiles.map((p) => {
            const result = ping[p.id];
            return (
              <div
                key={p.id}
                className={cn(
                  "rounded-xl border p-3 transition-colors",
                  p.id === activeId ? "border-primary bg-surface" : "border-border",
                )}
              >
                <div className="flex items-center gap-3">
                  <span className="size-3 shrink-0 rounded-full" style={{ background: p.color }} />
                  <button onClick={() => onSelect(p.id)} className="min-w-0 flex-1 text-left">
                    <span className="block truncate text-sm font-medium">{p.label}</span>
                    <span className="block truncate font-mono text-[11px] text-muted-foreground">
                      {p.uri}
                    </span>
                  </button>
                  {p.id === activeId && <Check className="size-4 shrink-0 text-primary" />}
                  {profiles.length > 1 && (
                    <button
                      aria-label={`Remove ${p.label}`}
                      onClick={() => onChange(profiles.filter((x) => x.id !== p.id))}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  )}
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => void test(p)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1 text-xs font-medium text-muted-foreground hover:text-foreground"
                  >
                    {pinging === p.id ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <Plug className="size-3.5" />
                    )}
                    Test
                  </button>
                  {result && (
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[11px] font-medium",
                        result.ok ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive",
                      )}
                    >
                      {result.ok ? `Connected · ${result.latency} ms` : "Unreachable"}
                    </span>
                  )}
                  <label className="ml-auto inline-flex cursor-pointer items-center gap-1.5 text-xs text-muted-foreground">
                    <input
                      type="checkbox"
                      checked={p.readOnly}
                      onChange={(e) =>
                        onChange(
                          profiles.map((x) =>
                            x.id === p.id ? { ...x, readOnly: e.target.checked } : x,
                          ),
                        )
                      }
                      className="size-3.5 accent-current"
                    />
                    <ShieldCheck className="size-3.5" />
                    Read-only
                  </label>
                </div>
              </div>
            );
          })}

          <div className="rounded-xl border border-dashed border-border p-3">
            <p className="mb-2 text-xs font-medium text-muted-foreground">Save a new profile</p>
            <div className="space-y-2">
              <input
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="Label (e.g. Staging cluster)"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring/30"
              />
              <input
                value={uri}
                onChange={(e) => setUri(e.target.value)}
                spellCheck={false}
                placeholder="mongodb+srv://..."
                className="w-full rounded-lg border border-border bg-background px-3 py-2 font-mono text-xs outline-none focus:ring-2 focus:ring-ring/30"
              />
              <div className="flex items-center gap-2">
                {profileColors.map((c) => (
                  <button
                    key={c}
                    aria-label={`Use colour ${c}`}
                    onClick={() => setColor(c)}
                    className={cn(
                      "size-5 rounded-full border-2",
                      color === c ? "border-foreground" : "border-transparent",
                    )}
                    style={{ background: c }}
                  />
                ))}
                <button
                  onClick={add}
                  className="ml-auto inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground"
                >
                  <Plus className="size-3.5" /> Save profile
                </button>
              </div>
            </div>
          </div>
          <p className="text-[11px] text-muted-foreground">
            Profiles are stored in this browser only — credentials never leave your device.
          </p>
        </div>
      </div>
    </div>
  );
}
