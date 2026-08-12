import type { Doc } from "./db-data";

export const stageTypes = [
  "$match",
  "$group",
  "$project",
  "$sort",
  "$lookup",
  "$unwind",
  "$limit",
] as const;

export type StageType = (typeof stageTypes)[number];

export type Stage = {
  id: string;
  type: StageType;
  body: string;
  enabled: boolean;
};

export type StageResult = {
  stage: Stage;
  docs: Doc[];
  error?: string;
};

export function defaultBody(type: StageType): string {
  switch (type) {
    case "$match":
      return `{ "status": "completed" }`;
    case "$group":
      return `{ "_id": "$status", "count": { "$sum": 1 } }`;
    case "$project":
      return `{ "_id": 1 }`;
    case "$sort":
      return `{ "_id": 1 }`;
    case "$lookup":
      return `{ "from": "users", "localField": "userId", "foreignField": "_id", "as": "user" }`;
    case "$unwind":
      return `"$items"`;
    case "$limit":
      return `5`;
  }
}

const get = (doc: Doc, path: string): unknown =>
  path
    .split(".")
    .reduce<unknown>((acc, k) => (acc && typeof acc === "object" ? (acc as Doc)[k] : undefined), doc);

const resolve = (doc: Doc, expr: unknown): unknown =>
  typeof expr === "string" && expr.startsWith("$") ? get(doc, expr.slice(1)) : expr;

function matches(doc: Doc, filter: Record<string, unknown>): boolean {
  return Object.entries(filter).every(([field, cond]) => {
    const value = get(doc, field);
    if (cond && typeof cond === "object" && !Array.isArray(cond)) {
      return Object.entries(cond as Record<string, unknown>).every(([op, target]) => {
        switch (op) {
          case "$eq":
            return value === target;
          case "$ne":
            return value !== target;
          case "$gt":
            return Number(value) > Number(target);
          case "$gte":
            return Number(value) >= Number(target);
          case "$lt":
            return Number(value) < Number(target);
          case "$lte":
            return Number(value) <= Number(target);
          case "$in":
            return Array.isArray(target) && target.includes(value as never);
          case "$exists":
            return (value !== undefined) === Boolean(target);
          case "$regex":
            return new RegExp(String(target), "i").test(String(value ?? ""));
          default:
            return true;
        }
      });
    }
    return String(value) === String(cond);
  });
}

function group(docs: Doc[], spec: Record<string, unknown>): Doc[] {
  const buckets = new Map<string, Doc[]>();
  for (const doc of docs) {
    const key = JSON.stringify(resolve(doc, spec["_id"]) ?? null);
    buckets.set(key, [...(buckets.get(key) ?? []), doc]);
  }
  return [...buckets.entries()].map(([key, rows]) => {
    const out: Doc = { _id: JSON.parse(key) as unknown };
    for (const [field, acc] of Object.entries(spec)) {
      if (field === "_id" || !acc || typeof acc !== "object") continue;
      const [op, argRaw] = Object.entries(acc as Record<string, unknown>)[0]!;
      const nums = rows.map((r) => Number(resolve(r, argRaw)) || 0);
      if (op === "$sum") out[field] = typeof argRaw === "number" ? rows.length * argRaw : nums.reduce((a, b) => a + b, 0);
      else if (op === "$avg") out[field] = Number((nums.reduce((a, b) => a + b, 0) / rows.length).toFixed(2));
      else if (op === "$max") out[field] = Math.max(...nums);
      else if (op === "$min") out[field] = Math.min(...nums);
      else if (op === "$count") out[field] = rows.length;
      else if (op === "$first") out[field] = resolve(rows[0]!, argRaw);
      else if (op === "$push") out[field] = rows.map((r) => resolve(r, argRaw));
    }
    return out;
  });
}

/** Runs the pipeline in-memory and returns the document set after every stage. */
export function runPipeline(
  input: Doc[],
  stages: Stage[],
  lookups: Record<string, Doc[]> = {},
): StageResult[] {
  let docs = input;
  const results: StageResult[] = [];

  for (const stage of stages) {
    if (!stage.enabled) {
      results.push({ stage, docs });
      continue;
    }
    try {
      const spec = JSON.parse(stage.body) as unknown;
      switch (stage.type) {
        case "$match":
          docs = docs.filter((d) => matches(d, spec as Record<string, unknown>));
          break;
        case "$group":
          docs = group(docs, spec as Record<string, unknown>);
          break;
        case "$project": {
          const p = spec as Record<string, unknown>;
          const keep = Object.entries(p).filter(([, v]) => v === 1 || v === true).map(([k]) => k);
          const drop = Object.entries(p).filter(([, v]) => v === 0 || v === false).map(([k]) => k);
          docs = docs.map((d) => {
            const out: Doc = {};
            for (const k of Object.keys(d)) {
              if (drop.includes(k)) continue;
              if (keep.length === 0 || keep.includes(k)) out[k] = d[k];
            }
            for (const [k, v] of Object.entries(p)) {
              if (typeof v === "string" && v.startsWith("$")) out[k] = get(d, v.slice(1));
            }
            return out;
          });
          break;
        }
        case "$sort": {
          const entries = Object.entries(spec as Record<string, number>);
          docs = [...docs].sort((a, b) => {
            for (const [f, dir] of entries) {
              const av = get(a, f);
              const bv = get(b, f);
              if (av === bv) continue;
              const cmp =
                typeof av === "number" && typeof bv === "number"
                  ? av - bv
                  : String(av).localeCompare(String(bv));
              return cmp * (dir < 0 ? -1 : 1);
            }
            return 0;
          });
          break;
        }
        case "$limit":
          docs = docs.slice(0, Number(spec) || 0);
          break;
        case "$unwind": {
          const path = String(spec).replace(/^\$/, "");
          docs = docs.flatMap((d) => {
            const arr = get(d, path);
            if (!Array.isArray(arr)) return [d];
            return arr.map((item) => ({ ...d, [path]: item }));
          });
          break;
        }
        case "$lookup": {
          const l = spec as { from: string; localField: string; foreignField: string; as: string };
          const source = lookups[l.from] ?? [];
          docs = docs.map((d) => ({
            ...d,
            [l.as]: source.filter((s) => s[l.foreignField] === get(d, l.localField)),
          }));
          break;
        }
      }
      results.push({ stage, docs });
    } catch (err) {
      results.push({ stage, docs, error: err instanceof Error ? err.message : "Invalid stage" });
    }
  }

  return results;
}

/** Picks a numeric field from grouped output so results can be charted. */
export function chartData(docs: Doc[]): { name: string; value: number }[] {
  if (docs.length === 0) return [];
  const numeric = Object.keys(docs[0]!).find(
    (k) => k !== "_id" && typeof docs[0]![k] === "number",
  );
  if (!numeric) return [];
  return docs.slice(0, 12).map((d) => ({
    name: String(typeof d["_id"] === "object" ? JSON.stringify(d["_id"]) : (d["_id"] ?? "—")),
    value: Number(d[numeric]) || 0,
  }));
}
