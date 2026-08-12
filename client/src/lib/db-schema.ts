import type { Doc } from "./db-data";

export type BsonType = "objectId" | "string" | "number" | "boolean" | "date" | "array" | "object" | "null";

export type FieldSchema = {
  path: string;
  types: BsonType[];
  present: number;
  total: number;
  nullRatio: number;
  sample: unknown;
};

export type IndexInfo = {
  name: string;
  keys: { field: string; direction: 1 | -1 }[];
  unique: boolean;
  size: string;
  usage: number;
};

const OID = /^[0-9a-f]{12,24}$/i;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}/;

export function bsonType(value: unknown, path = ""): BsonType {
  if (value === null || value === undefined) return "null";
  if (Array.isArray(value)) return "array";
  if (typeof value === "number") return "number";
  if (typeof value === "boolean") return "boolean";
  if (typeof value === "object") return "object";
  const s = String(value);
  if (path === "_id" && OID.test(s)) return "objectId";
  if (ISO_DATE.test(s) && !Number.isNaN(Date.parse(s))) return "date";
  return "string";
}

export const typeColor: Record<BsonType, string> = {
  objectId: "bg-primary/10 text-primary",
  string: "bg-success/10 text-success",
  number: "bg-warning/10 text-warning",
  boolean: "bg-primary/10 text-primary",
  date: "bg-warning/10 text-warning",
  array: "bg-muted text-muted-foreground",
  object: "bg-muted text-muted-foreground",
  null: "bg-destructive/10 text-destructive",
};

/** Samples documents to infer field paths, BSON types and nullability. */
export function inferSchema(docs: Doc[], sampleSize = 100): FieldSchema[] {
  const sample = docs.slice(0, sampleSize);
  const map = new Map<string, FieldSchema>();

  const walk = (obj: Record<string, unknown>, prefix: string) => {
    for (const [k, v] of Object.entries(obj)) {
      const path = prefix ? `${prefix}.${k}` : k;
      const t = bsonType(v, path);
      const entry = map.get(path) ?? {
        path,
        types: [],
        present: 0,
        total: sample.length,
        nullRatio: 0,
        sample: v,
      };
      entry.present += 1;
      if (v !== null && v !== undefined) entry.sample = v;
      if (!entry.types.includes(t)) entry.types.push(t);
      map.set(path, entry);
      if (t === "object") walk(v as Record<string, unknown>, path);
      if (t === "array" && typeof (v as unknown[])[0] === "object" && (v as unknown[])[0] !== null) {
        walk((v as Record<string, unknown>[])[0]!, `${path}[]`);
      }
    }
  };

  sample.forEach((d) => walk(d, ""));

  return [...map.values()].map((f) => ({
    ...f,
    total: sample.length,
    nullRatio: sample.length ? 1 - f.present / sample.length : 0,
  }));
}

/** Deterministic mock index metadata derived from the collection shape. */
export function inferIndexes(collectionName: string, fields: string[], count: number): IndexInfo[] {
  const list: IndexInfo[] = [
    {
      name: "_id_",
      keys: [{ field: "_id", direction: 1 }],
      unique: true,
      size: `${Math.max(4, Math.round(count / 8))} KB`,
      usage: 100,
    },
  ];
  const secondary = fields.filter((f) =>
    ["status", "email", "category", "createdAt", "userId", "name"].includes(f),
  );
  secondary.slice(0, 3).forEach((f, i) => {
    list.push({
      name: `${f}_${i % 2 === 0 ? 1 : -1}`,
      keys: [{ field: f, direction: i % 2 === 0 ? 1 : -1 }],
      unique: f === "email",
      size: `${8 + i * 4} KB`,
      usage: 82 - i * 17,
    });
  });
  if (collectionName === "orders") {
    list.push({
      name: "status_1_createdAt_-1",
      keys: [
        { field: "status", direction: 1 },
        { field: "createdAt", direction: -1 },
      ],
      unique: false,
      size: "16 KB",
      usage: 64,
    });
  }
  return list;
}
