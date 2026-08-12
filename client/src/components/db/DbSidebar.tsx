import { Database as DbIcon, ChevronDown, Search, Table2, Circle, X } from "lucide-react";
import { useState } from "react";
import type { Database } from "@/lib/db-data";
import { cn } from "@/lib/utils";

type Props = {
  databases: Database[];
  activeDb: string;
  activeCollection: string;
  onSelect: (db: string, collection: string) => void;
  onClose?: () => void;
  node?: string;
  mode?: string;
};

export function DbSidebar({
  databases,
  activeDb,
  activeCollection,
  onSelect,
  onClose,
  node,
  mode,
}: Props) {
  const [query, setQuery] = useState("");
  const [openDb, setOpenDb] = useState<string>(activeDb);

  return (
    <aside className="flex h-full w-72 max-w-[85vw] shrink-0 flex-col overflow-y-auto border-r border-border bg-surface lg:w-64">
      <div className="flex flex-col gap-6 p-6">
        <div className="flex items-center gap-2">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary">
            <DbIcon className="size-4 text-primary-foreground" />
          </div>
          <span className="min-w-0 flex-1 truncate text-lg font-semibold tracking-tight">
            Data Explorer
          </span>
          {onClose && (
            <button onClick={onClose} aria-label="Close menu" className="lg:hidden">
              <X className="size-4 text-muted-foreground" />
            </button>
          )}
        </div>


        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search collections"
            className="w-full rounded-md border border-border bg-background py-2 pr-3 pl-8 text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring/30"
          />
        </div>

        <nav>
          <h2 className="mb-3 text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
            Databases
          </h2>
          <ul className="space-y-1">
            {databases.map((db) => {
              const isOpen = openDb === db.name;
              const collections = db.collections.filter((c) =>
                c.name.toLowerCase().includes(query.toLowerCase()),
              );
              return (
                <li key={db.name}>
                  <button
                    onClick={() => setOpenDb(isOpen ? "" : db.name)}
                    className={cn(
                      "flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm transition-colors",
                      isOpen
                        ? "border border-border bg-background font-medium shadow-sm"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <span className="truncate">{db.name}</span>
                    <ChevronDown
                      className={cn("size-4 shrink-0 transition-transform", !isOpen && "-rotate-90")}
                    />
                  </button>

                  {isOpen && (
                    <ul className="mt-2 ml-4 space-y-1 border-l border-border">
                      {collections.map((c) => {
                        const active = activeDb === db.name && activeCollection === c.name;
                        return (
                          <li key={c.name}>
                            <button
                              onClick={() => onSelect(db.name, c.name)}
                              className={cn(
                                "flex w-full items-center gap-2 px-4 py-1.5 text-left text-sm transition-colors",
                                active
                                  ? "font-medium text-primary"
                                  : "text-muted-foreground hover:text-foreground",
                              )}
                            >
                              <Table2 className="size-3.5 shrink-0" />
                              <span className="min-w-0 flex-1 truncate">{c.name}</span>
                              <span className="text-[10px] tabular-nums">{c.count}</span>
                            </button>
                          </li>
                        );
                      })}
                      {collections.length === 0 && (
                        <li className="px-4 py-1.5 text-xs text-muted-foreground">No matches</li>
                      )}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
        </nav>
      </div>

      <div className="mt-auto border-t border-border p-4">
        <div className="rounded-lg border border-border bg-background p-3">
          <p className="mb-1 text-[10px] font-bold text-muted-foreground uppercase">Current node</p>
          <p className="truncate font-mono text-xs">{node ?? "local-standalone-mongo:27017"}</p>
          <p className="mt-2 flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <Circle className="size-2 fill-success text-success" />
            {mode ?? "Read / write"}
          </p>
        </div>
      </div>

    </aside>
  );
}
