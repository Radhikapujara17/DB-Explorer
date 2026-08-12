export type Doc = Record<string, unknown>;

export type Collection = {
  name: string;
  label: string;
  count: number;
  storage: string;
  indexes: number;
  fields: string[];
  docs: Doc[];
};

export type Database = {
  name: string;
  collections: Collection[];
};

const orders: Doc[] = [
  {
    _id: "6a70efce41b2c9",
    orderNumber: "ORD-2024-001",
    userId: "u_88213",
    status: "completed",
    items: [{ item: "UltraWide Curved Monitor", qty: 1 }],
    total: 859.49,
    shipping: { city: "San Diego", country: "US" },
    createdAt: "2024-04-02",
  },
  {
    _id: "6a70efce41b2d1",
    orderNumber: "ORD-2024-002",
    userId: "u_10422",
    status: "completed",
    items: [{ item: "Developer Ergonomic Chair", qty: 1 }],
    total: 1098,
    shipping: { city: "London", country: "UK" },
    createdAt: "2024-04-06",
  },
  {
    _id: "6a70efce41b2e9",
    orderNumber: "ORD-2024-003",
    userId: "u_31900",
    status: "processing",
    items: [{ item: "Noise Cancelling Headset", qty: 2 }],
    total: 299,
    shipping: { city: "Berlin", country: "DE" },
    createdAt: "2024-04-11",
  },
  {
    _id: "6a70efce41b2f4",
    orderNumber: "ORD-2024-004",
    userId: "u_55110",
    status: "cancelled",
    items: [{ item: "Mechanical Keyboard", qty: 1 }],
    total: 149.9,
    shipping: { city: "Toronto", country: "CA" },
    createdAt: "2024-04-14",
  },
  {
    _id: "6a70efce41b301",
    orderNumber: "ORD-2024-005",
    userId: "u_77321",
    status: "processing",
    items: [{ item: "4K Webcam", qty: 3 }],
    total: 447.5,
    shipping: { city: "Pune", country: "IN" },
    createdAt: "2024-04-19",
  },
];

const products: Doc[] = [
  {
    _id: "7b11aa02c4419e",
    name: "UltraWide Curved Monitor",
    category: "displays",
    price: 859.49,
    stock: 24,
    active: true,
    updatedAt: "2024-04-01",
  },
  {
    _id: "7b11aa02c441b2",
    name: "Developer Ergonomic Chair",
    category: "furniture",
    price: 1098,
    stock: 7,
    active: true,
    updatedAt: "2024-03-22",
  },
  {
    _id: "7b11aa02c441c8",
    name: "Noise Cancelling Headset",
    category: "audio",
    price: 149.5,
    stock: 132,
    active: true,
    updatedAt: "2024-04-09",
  },
  {
    _id: "7b11aa02c441d3",
    name: "Mechanical Keyboard",
    category: "input",
    price: 149.9,
    stock: 0,
    active: false,
    updatedAt: "2024-02-28",
  },
];

const users: Doc[] = [
  {
    _id: "8c22bb13d5520f",
    fullName: "Sarah Chen",
    email: "sarah.c@aurora.io",
    role: "admin",
    status: "active",
    lastActive: "2 mins ago",
  },
  {
    _id: "8c22bb13d55214",
    fullName: "Marcus Wright",
    email: "m.wright@gmail.com",
    role: "editor",
    status: "active",
    lastActive: "1 hour ago",
  },
  {
    _id: "8c22bb13d55229",
    fullName: "Elena Rodriguez",
    email: "elena@rodriguez.co",
    role: "viewer",
    status: "active",
    lastActive: "Yesterday",
  },
  {
    _id: "8c22bb13d55231",
    fullName: "David Kim",
    email: "dkim@startup.co",
    role: "editor",
    status: "invited",
    lastActive: "3 days ago",
  },
  {
    _id: "8c22bb13d5523a",
    fullName: "Priya Nair",
    email: "priya@nair.dev",
    role: "viewer",
    status: "suspended",
    lastActive: "2 weeks ago",
  },
  {
    _id: "8c22bb13d55248",
    fullName: "Tomas Halvorsen",
    email: "tomas@halvor.no",
    role: "viewer",
    status: "active",
    lastActive: "5 hours ago",
  },
];

function collection(
  name: string,
  label: string,
  storage: string,
  indexes: number,
  docs: Doc[],
): Collection {
  return {
    name,
    label,
    count: docs.length,
    storage,
    indexes,
    fields: Object.keys(docs[0] ?? {}),
    docs,
  };
}

export const databases: Database[] = [
  {
    name: "ecommerce_db",
    collections: [
      collection("orders", "Orders", "889 B", 1, orders),
      collection("products", "Products", "1.4 KB", 2, products),
      collection("users", "People", "2.1 KB", 3, users),
    ],
  },
  {
    name: "analytics_db",
    collections: [collection("events", "Events", "12.6 KB", 2, orders)],
  },
  {
    name: "staging_db",
    collections: [collection("users", "People", "640 B", 1, users)],
  },
];

export const operators = [
  { value: "eq", label: "is" },
  { value: "ne", label: "is not" },
  { value: "contains", label: "contains" },
  { value: "gt", label: "is greater than" },
  { value: "gte", label: "is at least" },
  { value: "lt", label: "is less than" },
  { value: "lte", label: "is at most" },
  { value: "in", label: "is one of" },
  { value: "exists", label: "exists" },
] as const;


export type OperatorValue = (typeof operators)[number]["value"];

export type Condition = {
  id: string;
  field: string;
  operator: OperatorValue;
  value: string;
};

export function applyConditions(docs: Doc[], conditions: Condition[]): Doc[] {
  const active = conditions.filter((c) => c.field && c.value.trim() !== "");
  if (active.length === 0) return docs;

  return docs.filter((doc) =>
    active.every((c) => {
      const raw = doc[c.field];
      const text = typeof raw === "object" ? JSON.stringify(raw) : String(raw ?? "");
      const num = Number(raw);
      const target = c.value.trim();

      switch (c.operator) {
        case "eq":
          return text.toLowerCase() === target.toLowerCase();
        case "ne":
          return text.toLowerCase() !== target.toLowerCase();
        case "contains":
          return text.toLowerCase().includes(target.toLowerCase());
        case "gt":
          return !Number.isNaN(num) && num > Number(target);
        case "gte":
          return !Number.isNaN(num) && num >= Number(target);
        case "lt":
          return !Number.isNaN(num) && num < Number(target);
        case "lte":
          return !Number.isNaN(num) && num <= Number(target);
        case "in":
          return target
            .split(",")
            .map((t) => t.trim().toLowerCase())
            .includes(text.toLowerCase());
        case "exists": {
          const wants = !["false", "no", "0"].includes(target.toLowerCase());
          return (raw !== undefined && raw !== null) === wants;
        }
        default:
          return true;
      }
    }),
  );
}

export function toMongoQuery(conditions: Condition[]): string {
  const active = conditions.filter((c) => c.field && c.value.trim() !== "");
  if (active.length === 0) return "{}";

  const parts = active.map((c) => {
    const raw = c.value.trim();
    const parsed = Number(raw);
    const value = raw === "true" || raw === "false" ? raw : Number.isNaN(parsed) ? `"${raw}"` : raw;
    switch (c.operator) {
      case "eq":
        return `  "${c.field}": ${value}`;
      case "ne":
        return `  "${c.field}": { "$ne": ${value} }`;
      case "contains":
        return `  "${c.field}": { "$regex": "${raw}", "$options": "i" }`;
      case "gt":
        return `  "${c.field}": { "$gt": ${value} }`;
      case "gte":
        return `  "${c.field}": { "$gte": ${value} }`;
      case "lt":
        return `  "${c.field}": { "$lt": ${value} }`;
      case "lte":
        return `  "${c.field}": { "$lte": ${value} }`;
      case "in":
        return `  "${c.field}": { "$in": [${raw
          .split(",")
          .map((t) => {
            const v = t.trim();
            return Number.isNaN(Number(v)) ? `"${v}"` : v;
          })
          .join(", ")}] }`;
      case "exists":
        return `  "${c.field}": { "$exists": ${!["false", "no", "0"].includes(raw.toLowerCase())} }`;
      default:
        return "";
    }
  });

  return `{\n${parts.join(",\n")}\n}`;
}

export function formatValue(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

export function toCsv(docs: Doc[], fields: string[]): string {
  const escape = (v: string) => `"${v.replace(/"/g, '""')}"`;
  const head = fields.map(escape).join(",");
  const rows = docs.map((d) => fields.map((f) => escape(formatValue(d[f]))).join(","));
  return [head, ...rows].join("\n");
}
