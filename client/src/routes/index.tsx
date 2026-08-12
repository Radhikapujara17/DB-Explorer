import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  Check,
  Download,
  FileJson,
  History,
  Layers,
  Menu,
  Plug,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
  Table2,
  Workflow,
  X,
} from "lucide-react";
import { DbSidebar } from "@/components/db/DbSidebar";
import { QueryPanel } from "@/components/db/QueryPanel";
import { ResultsView, type Sort, type ViewMode } from "@/components/db/ResultsView";
import { ThemeSwitcher } from "@/components/db/ThemeSwitcher";
import { ConnectionManager } from "@/components/db/ConnectionManager";
import { SchemaPanel } from "@/components/db/SchemaPanel";
import { AggregationPanel } from "@/components/db/AggregationPanel";
import { AIAssistant } from "@/components/db/AIAssistant";
import { useTheme } from "@/lib/theme";
import { useConnections } from "@/lib/connections";
import { explainQuery } from "@/lib/ai-assistant";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  applyConditions,
  formatValue,
  toCsv,
  toMongoQuery,
  type Condition,
  type Doc,
} from "@/lib/db-data";
import { useMongoDB, buildFilterObject } from "@/lib/use-mongodb";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Database Explorer — MongoDB Studio & AI Query Assistant" },
      {
        name: "description",
        content:
          "Explore MongoDB visually: connection profiles, schema discovery, index inspector, visual query builder, aggregation pipeline visualizer and an AI natural-language query assistant.",
      },
      { property: "og:title", content: "Database Explorer — MongoDB Studio & AI Query Assistant" },
      {
        property: "og:description",
        content:
          "A friendly MongoDB studio: browse collections, build queries visually or in raw JSON, debug aggregation pipelines stage by stage, and ask questions in plain English.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Explorer,
});

type Tab = { db: string; collection: string };
type Workspace = "documents" | "aggregation" | "schema" | "ai";

const views: { id: ViewMode; label: string }[] = [
  { id: "table", label: "Table" },
  { id: "cards", label: "Cards" },
  { id: "tree", label: "Tree" },
  { id: "json", label: "JSON" },
];

const workspaces: { id: Workspace; label: string; icon: typeof Table2 }[] = [
  { id: "documents", label: "Documents", icon: Table2 },
  { id: "aggregation", label: "Aggregation", icon: Workflow },
  { id: "schema", label: "Schema", icon: Layers },
  { id: "ai", label: "AI assistant", icon: Sparkles },
];

function download(name: string, content: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

function applyProjection(docs: Doc[], projection: string): Doc[] {
  try {
    const spec = JSON.parse(projection) as Record<string, unknown>;
    const keep = Object.entries(spec).filter(([, v]) => v === 1 || v === true).map(([k]) => k);
    const drop = Object.entries(spec).filter(([, v]) => v === 0 || v === false).map(([k]) => k);
    if (keep.length === 0 && drop.length === 0) return docs;
    return docs.map((d) => {
      const out: Doc = {};
      for (const k of Object.keys(d)) {
        if (drop.includes(k)) continue;
        if (keep.length === 0 || keep.includes(k) || k === "_id") out[k] = d[k];
      }
      return out;
    });
  } catch {
    return docs;
  }
}

function Explorer() {
  const [tabs, setTabs] = useState<Tab[]>([{ db: "ecommerce_db", collection: "orders" }]);
  const [active, setActive] = useState<Tab>({ db: "ecommerce_db", collection: "orders" });
  const [workspace, setWorkspace] = useState<Workspace>("documents");
  const [advanced, setAdvanced] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const [connOpen, setConnOpen] = useState(false);
  const isMobile = useIsMobile();
  const { theme, setTheme } = useTheme();
  const { profiles, setProfiles, active: connection, activeId, setActiveId } = useConnections();
  const { databases, loadingDb, refreshDbs } = useMongoDB(connection.uri);
  const [view, setView] = useState<ViewMode>("table");
  const [viewTouched, setViewTouched] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState(10);
  const [panel, setPanel] = useState<"diagnostics" | "history" | null>(null);
  const [history, setHistory] = useState<string[]>([]);
  const [queryTime, setQueryTime] = useState(249);
  const [notice, setNotice] = useState<string | null>(null);
  const [overrides, setOverrides] = useState<Record<string, Doc[]>>({});
  const [conditions, setConditions] = useState<Condition[]>([
    { id: "c1", field: "status", operator: "eq", value: "" },
  ]);
  const [refreshTick, setRefreshTick] = useState(0);
  const [rawQuery, setRawQuery] = useState("{}");
  const [projection, setProjection] = useState("{}");
  const [sortSpec, setSortSpec] = useState("{}");
  const [sort, setSort] = useState<Sort>(null);
  const [applied, setApplied] = useState<Condition[]>([]);
  const [editing, setEditing] = useState<{ doc: Doc; mode: "view" | "edit" | "new" } | null>(null);
  const [draft, setDraft] = useState("");
  const [serverDocs, setServerDocs] = useState<Doc[]>([]);
  const [totalDocs, setTotalDocs] = useState(0);
  const [schemaFields, setSchemaFields] = useState<string[]>([]);

  const readOnly = connection.readOnly;

  useEffect(() => {
    if (!viewTouched) setView(isMobile ? "cards" : "table");
  }, [isMobile, viewTouched]);

  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(null), 2600);
    return () => clearTimeout(t);
  }, [notice]);

  const key = `${active.db}.${active.collection}`;
  const db = databases.find((d) => d.name === active.db);
  const collection = db?.collections.find((c) => c.name === active.collection);
  
  // Real API fetching for documents
  useEffect(() => {
    if (!db || !collection) return;
    const fetchDocs = async () => {
      try {
        let filter = {};
        if (advanced) {
          try { filter = JSON.parse(rawQuery); } catch {}
        } else {
          filter = buildFilterObject(applied);
        }
        if (search.trim()) {
           // simple search logic added to filter if needed, but omitted for simplicity
        }
        
        let projObj = {};
        try { projObj = JSON.parse(projection); } catch {}

        const res = await fetch(`/api/documents/${active.db}/${active.collection}/query`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-mongo-uri": connection.uri },
          body: JSON.stringify({
            filter,
            projection: projObj,
            sort: sort ? { [sort.field]: sort.direction } : {},
            limit: rows,
            skip: (page - 1) * rows
          })
        });
        const data = await res.json();
        if (data.success) {
          setServerDocs(data.documents || []);
          setTotalDocs(data.totalCount || 0);
          setQueryTime(data.executionTimeMs || 20);
        }
      } catch (e) {
        console.error("Failed to fetch documents", e);
      }
    };
    fetchDocs();
  }, [active.db, active.collection, applied, rows, page, sort, advanced, rawQuery, projection, search, connection.uri, db, collection, refreshTick]);

  // Fetch schema fields
  useEffect(() => {
    if (!db || !collection) return;
    const fetchSchema = async () => {
      try {
        const res = await fetch(`/api/schema/${active.db}/${active.collection}/infer`, {
          headers: { "x-mongo-uri": connection.uri }
        });
        const data = await res.json();
        if (data.success && data.fields) {
          setSchemaFields(data.fields.map((f: any) => f.name));
        }
      } catch (e) {
        console.error("Failed to fetch schema", e);
      }
    };
    fetchSchema();
  }, [active.db, active.collection, connection.uri, db, collection]);

  const docs = serverDocs;

  const lookups = useMemo(
    () => db ? Object.fromEntries(db.collections.map((c) => [c.name, c.docs])) : {},
    [db],
  );

  const filtered = docs; // Server already filtered this

  const displayFields = useMemo(() => {
    return schemaFields.length > 0 ? schemaFields : ["_id"];
  }, [schemaFields]);

  const totalPages = Math.max(1, Math.ceil(totalDocs / rows));
  const pageDocs = filtered;

  const guard = (action: () => void) => {
    if (readOnly) {
      setNotice("Read-only guard is on for this connection — writes are blocked.");
      return;
    }
    action();
  };

  const switchTab = (tab: { db: string; collection: string }) => {
    setActive(tab);
    setAdvanced(false);
    setApplied([]);
    setPage(1);
    setSort(null);
    setRawQuery("{}");
    setProjection("{}");
    setSortSpec("{}");
    setConditions([{ id: crypto.randomUUID(), field: "_id", operator: "eq", value: "" }]);
  };

  const openCollection = (dbName: string, collectionName: string) => {
    const tab = { db: dbName, collection: collectionName };
    setTabs((prev) =>
      prev.some((t) => t.db === dbName && t.collection === collectionName) ? prev : [...prev, tab],
    );
    switchTab(tab);
    if (db) {
      const c = db.collections.find((x) => x.name === collectionName);
      if (c && c.fields && c.fields.length > 0) {
         setConditions([{ id: crypto.randomUUID(), field: c.fields[0], operator: "eq", value: "" }]);
      } else {
         setConditions([{ id: crypto.randomUUID(), field: "_id", operator: "eq", value: "" }]);
      }
    }
  };

  const runQuery = () => {
    setApplied(advanced ? [] : conditions);
    setPage(1);
    setQueryTime(Math.round(8 + Math.random() * 60));
    try {
      const parsed = JSON.parse(sortSpec) as Record<string, number>;
      const first = Object.entries(parsed)[0];
      setSort(first ? { field: first[0], direction: first[1] < 0 ? -1 : 1 } : null);
    } catch {
      /* keep current sort when the sort clause is not valid JSON */
    }
    setHistory((h) => [advanced ? rawQuery : toMongoQuery(conditions), ...h].slice(0, 12));
  };

  const toggleSort = (field: string) =>
    setSort((s) =>
      s?.field === field ? { field, direction: s.direction === 1 ? -1 : 1 } : { field, direction: 1 },
    );

  const saveDoc = async () => {
    if (!editing) return;
    try {
      const parsed = JSON.parse(draft) as Doc;
      const url = editing.mode === "new" 
        ? `/api/documents/${active.db}/${active.collection}/insert`
        : `/api/documents/${active.db}/${active.collection}/update`;
        
      const body = editing.mode === "new" 
        ? { document: parsed }
        : { filter: { _id: parsed._id }, update: parsed };
        
      const res = await fetch(url, {
        method: editing.mode === "new" ? "POST" : "PUT",
        headers: { "Content-Type": "application/json", "x-mongo-uri": connection.uri },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (data.success) {
        setNotice("Document saved.");
        setEditing(null);
        setRefreshTick(t => t + 1);
      } else {
        setNotice("Failed to save: " + data.error);
      }
    } catch {
      setNotice("That JSON is not valid yet.");
    }
  };

  const removeDoc = (doc: Doc) =>
    guard(async () => {
      if (!window.confirm("Are you sure you want to delete this document?")) return;
      try {
        const res = await fetch(`/api/documents/${active.db}/${active.collection}/delete`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json", "x-mongo-uri": connection.uri },
          body: JSON.stringify({ filter: { _id: doc._id } })
        });
        const data = await res.json();
        if (data.success) {
          setNotice("Document deleted.");
          setRefreshTick(t => t + 1);
        }
      } catch (e) {
        setNotice("Failed to delete document.");
      }
    });

  const toolButton =
    "inline-flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground";

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background font-sans text-foreground">
      <div className="hidden lg:flex">
        <DbSidebar
          databases={databases}
          activeDb={active.db}
          activeCollection={active.collection}
          onSelect={openCollection}
          onCreateCollection={async (dbName) => {
            const name = window.prompt(`Enter new collection name for ${dbName}:`);
            if (!name) return;
            try {
              const res = await fetch(`/api/collections/${dbName}/create`, {
                method: "POST",
                headers: { "Content-Type": "application/json", "x-mongo-uri": connection.uri },
                body: JSON.stringify({ collectionName: name })
              });
              const data = await res.json();
              if (data.success) {
                setNotice(`Collection ${name} created.`);
                refreshDbs();
              } else {
                setNotice("Failed to create collection.");
              }
            } catch {
              setNotice("Error creating collection.");
            }
          }}
          node={connection.uri.replace(/^mongodb(\+srv)?:\/\//, "")}
          mode={readOnly ? "Read-only guard" : `Read / write · ${queryTime} ms`}
        />
      </div>

      {navOpen && (
        <div
          className="fixed inset-0 z-50 flex bg-foreground/30 lg:hidden"
          onClick={() => setNavOpen(false)}
        >
          <div onClick={(e) => e.stopPropagation()} className="h-full">
            <DbSidebar
              databases={databases}
              activeDb={active.db}
              activeCollection={active.collection}
              onSelect={(d, c) => {
                openCollection(d, c);
                setNavOpen(false);
              }}
              onClose={() => setNavOpen(false)}
              onCreateCollection={async (dbName) => {
                const name = window.prompt(`Enter new collection name for ${dbName}:`);
                if (!name) return;
                try {
                  const res = await fetch(`/api/collections/${dbName}/create`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json", "x-mongo-uri": connection.uri },
                    body: JSON.stringify({ collectionName: name })
                  });
                  const data = await res.json();
                  if (data.success) {
                    setNotice(`Collection ${name} created.`);
                    refreshDbs();
                  } else {
                    setNotice("Failed to create collection.");
                  }
                } catch {
                  setNotice("Error creating collection.");
                }
              }}
              node={connection.uri.replace(/^mongodb(\+srv)?:\/\//, "")}
              mode={readOnly ? "Read-only guard" : `Read / write · ${queryTime} ms`}
            />
          </div>
        </div>
      )}

      <main className="flex min-w-0 flex-1 flex-col">
        <header className="grid shrink-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-border px-4 py-3 sm:px-6 lg:h-16 lg:px-8 lg:py-0">
          <div className="flex min-w-0 items-center gap-2">
            <button
              onClick={() => setNavOpen(true)}
              aria-label="Open collections menu"
              className="shrink-0 rounded-lg border border-border bg-surface p-2 text-muted-foreground lg:hidden"
            >
              <Menu className="size-4" />
            </button>
            <button
              onClick={() => setConnOpen(true)}
              className="flex min-w-0 max-w-md flex-1 items-center gap-2 rounded-full border border-border bg-surface px-3 py-1.5 text-left transition-colors hover:border-primary sm:px-4"
            >
              <span
                className="size-2 shrink-0 rounded-full"
                style={{ background: connection.color }}
              />
              <span className="truncate font-mono text-[11px] text-muted-foreground sm:text-xs">
                {connection.uri}/{active.db}
              </span>
              {readOnly && (
                <span className="hidden shrink-0 items-center gap-1 rounded-full bg-warning/15 px-2 py-0.5 text-[10px] font-semibold text-warning sm:inline-flex">
                  <ShieldCheck className="size-3" /> read-only
                </span>
              )}
              <Plug className="size-3.5 shrink-0 text-muted-foreground" />
            </button>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <ThemeSwitcher theme={theme} onChange={setTheme} />
            <button
              onClick={() =>
                guard(() => {
                  setDraft(JSON.stringify({ _id: crypto.randomUUID().slice(0, 14) }, null, 2));
                  setEditing({ doc: {}, mode: "new" });
                })
              }
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-opacity hover:opacity-90 sm:px-4"
            >
              <Plus className="size-3.5" />
              <span className="hidden sm:inline">New document</span>
              <span className="sm:hidden">New</span>
            </button>
          </div>
        </header>

        <div className="flex shrink-0 items-center gap-1 overflow-x-auto border-b border-border px-4 sm:px-6">
          {workspaces.map((w) => (
            <button
              key={w.id}
              onClick={() => setWorkspace(w.id)}
              className={cn(
                "inline-flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-2.5 text-sm whitespace-nowrap transition-colors",
                workspace === w.id
                  ? "border-primary font-medium"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              <w.icon className="size-3.5" />
              {w.label}
            </button>
          ))}
        </div>

        <div className="flex shrink-0 items-center gap-1 overflow-x-auto border-b border-border bg-surface/40 px-4 sm:px-6">
          {tabs.map((t) => {
            const isActive = t.db === active.db && t.collection === active.collection;
            return (
              <div
                key={`${t.db}.${t.collection}`}
                className={cn(
                  "flex shrink-0 items-center gap-2 border-b-2 px-3 py-2 text-xs whitespace-nowrap transition-colors",
                  isActive
                    ? "border-primary font-medium"
                    : "border-transparent text-muted-foreground hover:text-foreground",
                )}
              >
                <button onClick={() => openCollection(t.db, t.collection)}>
                  {t.collection}
                  <span className="ml-1.5 text-muted-foreground">({t.db})</span>
                </button>
                {tabs.length > 1 && (
                  <button
                    aria-label="Close tab"
                    onClick={() => {
                      const rest = tabs.filter(
                        (x) => !(x.db === t.db && x.collection === t.collection),
                      );
                      setTabs(rest);
                      if (isActive && rest[0]) openCollection(rest[0].db, rest[0].collection);
                    }}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X className="size-3" />
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {workspace === "documents" && collection && (
          <>
            <div className="flex shrink-0 items-center gap-1 border-b border-border px-4 sm:px-6">
              {[
                { id: false, label: "Simple" },
                { id: true, label: "Advanced" },
              ].map((m) => (
                <button
                  key={m.label}
                  onClick={() => {
                    setAdvanced(m.id);
                    if (m.id) setRawQuery(toMongoQuery(conditions));
                  }}
                  className={cn(
                    "border-b-2 px-3 py-2 text-xs font-medium transition-colors",
                    advanced === m.id ? "border-primary" : "border-transparent text-muted-foreground",
                  )}
                >
                  {m.label}
                </button>
              ))}
            </div>

            <QueryPanel
              collectionName={collection.name}
              fields={displayFields}
              conditions={conditions}
              onChange={setConditions}
              advanced={advanced}
              rawQuery={rawQuery}
              onRawQueryChange={setRawQuery}
              projection={projection}
              onProjectionChange={setProjection}
              sort={sortSpec}
              onSortChange={setSortSpec}
              onRun={runQuery}
            />

            <div className="flex shrink-0 flex-wrap items-center gap-x-6 gap-y-2 border-b border-border px-4 py-3 sm:px-6 lg:px-8">
              {[
                { label: "Documents", value: filtered.length.toLocaleString() },
                { label: "Time", value: `${queryTime} ms` },
                { label: "Storage", value: collection.storage },
                { label: "Indexes", value: String(collection.indexes) },
              ].map((s) => (
                <div key={s.label} className="flex items-center gap-2">
                  <span className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
                    {s.label}
                  </span>
                  <span className="text-sm font-semibold">{s.value}</span>
                </div>
              ))}

              <div className="ml-auto flex flex-wrap items-center gap-2">
                <button className={toolButton} onClick={() => setWorkspace("schema")}>
                  <Layers className="size-3.5" /> Schema
                </button>
                <button className={toolButton} onClick={() => setPanel("diagnostics")}>
                  <Activity className="size-3.5" /> Diagnostics
                </button>
                <button className={toolButton} onClick={() => setPanel("history")}>
                  <History className="size-3.5" /> History
                </button>
              </div>
            </div>

            <div className="flex shrink-0 flex-wrap items-center gap-3 border-b border-border px-4 py-3 sm:px-6 lg:px-8">
              <div className="flex rounded-lg border border-border bg-surface p-1">
                {views.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => {
                      setView(v.id);
                      setViewTouched(true);
                    }}
                    className={cn(
                      "rounded px-3 py-1 text-xs font-medium transition-colors",
                      view === v.id
                        ? "bg-background shadow-sm"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {v.label}
                  </button>
                ))}
              </div>

              <div className="relative min-w-0 max-w-sm flex-1">
                <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  placeholder="Search these documents"
                  className="w-full rounded-lg border border-border bg-background py-1.5 pr-3 pl-8 text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring/30"
                />
              </div>

              <div className="ml-auto flex items-center gap-2">
                <button
                  className={toolButton}
                  onClick={() =>
                    download(
                      `${collection.name}.json`,
                      JSON.stringify(filtered, null, 2),
                      "application/json",
                    )
                  }
                >
                  <FileJson className="size-3.5" /> Export JSON
                </button>
                <button
                  className={toolButton}
                  onClick={() =>
                    download(`${collection.name}.csv`, toCsv(filtered, displayFields), "text/csv")
                  }
                >
                  <Download className="size-3.5" /> Export CSV
                </button>
              </div>
            </div>
          </>
        )}

        <div className="min-h-0 flex-1 overflow-auto">
          {workspace === "documents" && collection && (
            <ResultsView
              docs={pageDocs}
              fields={displayFields}
              view={view}
              sort={sort}
              onSort={toggleSort}
              readOnly={readOnly}
              onView={(doc) => {
                setDraft(JSON.stringify(doc, null, 2));
                setEditing({ doc, mode: "view" });
              }}
              onEdit={(doc) =>
                guard(() => {
                  setDraft(JSON.stringify(doc, null, 2));
                  setEditing({ doc, mode: "edit" });
                })
              }
              onDelete={removeDoc}
            />
          )}

          {workspace === "aggregation" && <AggregationPanel docs={docs} lookups={lookups} />}

          {workspace === "schema" && collection && (
            <SchemaPanel
              docs={docs}
              collectionName={collection.name}
              fields={displayFields}
              onBack={() => setWorkspace("documents")}
            />
          )}

          {workspace === "ai" && collection && (
            <AIAssistant
              fields={displayFields}
              collectionName={collection.name}
              onApply={(result) => {
                if (result.kind === "filter") {
                  setWorkspace("documents");
                  setAdvanced(true);
                  setRawQuery(result.code);
                  setNotice("Filter loaded into the advanced editor.");
                } else {
                  setWorkspace("aggregation");
                  setNotice("Open the pipeline builder to tweak the generated stages.");
                }
              }}
            />
          )}
        </div>

        {workspace === "documents" && collection && (
          <footer className="flex shrink-0 flex-wrap items-center justify-between gap-x-4 gap-y-2 border-t border-border bg-surface/40 px-4 py-2.5 sm:px-6 lg:h-12 lg:px-8 lg:py-0">
            <span className="text-xs text-muted-foreground">
              Showing {filtered.length === 0 ? 0 : (page - 1) * rows + 1}–
              {Math.min(page * rows, filtered.length)} of {filtered.length} documents
            </span>
            <div className="flex items-center gap-2">
              <select
                value={rows}
                onChange={(e) => {
                  setRows(Number(e.target.value));
                  setPage(1);
                }}
                className="rounded border border-border bg-background px-2 py-1 text-xs"
              >
                {[10, 25, 50].map((n) => (
                  <option key={n} value={n}>
                    {n} per page
                  </option>
                ))}
              </select>
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
                className="rounded border border-border bg-background px-3 py-1 text-xs font-medium text-muted-foreground disabled:opacity-50"
              >
                Prev
              </button>
              <span className="text-xs text-muted-foreground">
                Page {page} of {totalPages}
              </span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="rounded border border-border bg-background px-3 py-1 text-xs font-medium text-muted-foreground disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </footer>
        )}
      </main>

      {notice && (
        <div className="fixed bottom-6 left-1/2 z-[60] -translate-x-1/2 rounded-lg border border-border bg-popover px-4 py-2 text-sm text-popover-foreground shadow-lg">
          {notice}
        </div>
      )}

      {connOpen && (
        <ConnectionManager
          profiles={profiles}
          activeId={activeId}
          onSelect={setActiveId}
          onChange={setProfiles}
          onClose={() => setConnOpen(false)}
        />
      )}

      {panel && (
        <div
          className="fixed inset-0 z-50 flex justify-end bg-foreground/20"
          onClick={() => setPanel(null)}
        >
          <div
            className="flex h-full w-full max-w-sm flex-col border-l border-border bg-background"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <h2 className="text-sm font-semibold">
                {panel === "diagnostics" ? "Server diagnostics" : "Query history"}
              </h2>
              <button onClick={() => setPanel(null)} aria-label="Close panel">
                <X className="size-4 text-muted-foreground" />
              </button>
            </div>
            <div className="flex-1 overflow-auto p-6 text-sm">
              {panel === "diagnostics" && db && collection && (
                <dl className="space-y-3">
                  {[
                    ["Connection", connection.label],
                    ["Mode", readOnly ? "Read-only guard on" : "Read / write"],
                    ["Last query", `${queryTime} ms`],
                    ["Collections", String(db.collections.length)],
                    ["Storage", collection.storage],
                  ].map(([k, v]) => (
                    <div key={k} className="flex justify-between gap-4 border-b border-border pb-2">
                      <dt className="text-muted-foreground">{k}</dt>
                      <dd className="text-right font-medium">{v}</dd>
                    </div>
                  ))}
                </dl>
              )}
              {panel === "history" &&
                (history.length === 0 ? (
                  <p className="text-muted-foreground">No queries run yet in this session.</p>
                ) : (
                  <ul className="space-y-3">
                    {history.map((q, i) => (
                      <li key={i} className="rounded-lg border border-border p-3">
                        <pre className="font-mono text-[11px] whitespace-pre-wrap">{q}</pre>
                        <ul className="mt-2 space-y-1">
                          {explainQuery(q).map((line, j) => (
                            <li key={j} className="text-xs text-muted-foreground">
                              • {line}
                            </li>
                          ))}
                        </ul>
                        <button
                          onClick={() => {
                            setAdvanced(true);
                            setRawQuery(q);
                            setPanel(null);
                            setWorkspace("documents");
                          }}
                          className="mt-2 text-xs font-medium text-primary"
                        >
                          Load into editor
                        </button>
                      </li>
                    ))}
                  </ul>
                ))}
            </div>
          </div>
        </div>
      )}

      {editing && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/20 p-4 sm:p-6"
          onClick={() => setEditing(null)}
        >
          <div
            className="flex max-h-[80vh] w-full max-w-2xl flex-col rounded-xl border border-border bg-background shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <h2 className="text-sm font-semibold">
                {editing.mode === "new"
                  ? "New document"
                  : editing.mode === "edit"
                    ? "Edit document"
                    : "Document details"}
              </h2>
              <button onClick={() => setEditing(null)} aria-label="Close">
                <X className="size-4 text-muted-foreground" />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-auto p-6">
              {editing.mode === "view" ? (
                <dl className="space-y-2">
                  {Object.entries(editing.doc).map(([k, v]) => (
                    <div key={k} className="flex gap-4 border-b border-border pb-2">
                      <dt className="w-32 shrink-0 text-sm text-muted-foreground">{k}</dt>
                      <dd className="min-w-0 font-mono text-xs break-all">{formatValue(v)}</dd>
                    </div>
                  ))}
                </dl>
              ) : (
                <textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  spellCheck={false}
                  rows={16}
                  className="w-full rounded-lg border border-border bg-surface p-4 font-mono text-xs outline-none focus:ring-2 focus:ring-ring/30"
                />
              )}
            </div>

            <div className="flex justify-end gap-2 border-t border-border px-6 py-4">
              <button
                onClick={() => setEditing(null)}
                className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted-foreground"
              >
                Close
              </button>
              {editing.mode !== "view" && (
                <button
                  onClick={saveDoc}
                  className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
                >
                  <Check className="size-4" />
                  Save
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
