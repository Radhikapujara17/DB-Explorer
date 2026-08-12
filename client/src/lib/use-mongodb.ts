import { useState, useEffect } from "react";
import type { Database, Doc, Condition } from "./db-data";

export function buildFilterObject(conditions: Condition[]): any {
  const active = conditions.filter((c) => c.field && c.value.trim() !== "");
  if (active.length === 0) return {};

  const filter: any = {};
  active.forEach((c) => {
    const raw = c.value.trim();
    const parsed = Number(raw);
    const value = raw === "true" ? true : raw === "false" ? false : Number.isNaN(parsed) ? raw : parsed;
    
    switch (c.operator) {
      case "eq":
        filter[c.field] = value;
        break;
      case "ne":
        filter[c.field] = { $ne: value };
        break;
      case "contains":
        filter[c.field] = { $regex: String(value), $options: "i" };
        break;
      case "gt":
        filter[c.field] = { $gt: value };
        break;
      case "gte":
        filter[c.field] = { $gte: value };
        break;
      case "lt":
        filter[c.field] = { $lt: value };
        break;
      case "lte":
        filter[c.field] = { $lte: value };
        break;
      case "in":
        filter[c.field] = { $in: raw.split(",").map((t) => {
          const v = t.trim();
          return Number.isNaN(Number(v)) ? v : Number(v);
        }) };
        break;
      case "exists":
        filter[c.field] = { $exists: !["false", "no", "0"].includes(raw.toLowerCase()) };
        break;
    }
  });
  return filter;
}

export function useMongoDB(uri: string) {
  const [databases, setDatabases] = useState<Database[]>([]);
  const [loadingDb, setLoadingDb] = useState(false);

  useEffect(() => {
    if (!uri) return;
    setLoadingDb(true);
    fetch("/api/databases", { headers: { "x-mongo-uri": uri } })
      .then((r) => r.json())
      .then(async (data) => {
        if (!data.success) {
          setLoadingDb(false);
          return;
        }
        const dbs = data.databases || [];
        const fullDbs: Database[] = await Promise.all(
          dbs.map(async (db: any) => {
            try {
              const cRes = await fetch(`/api/collections/${db.name}`, {
                headers: { "x-mongo-uri": uri },
              });
              const cData = await cRes.json();
              return {
                name: db.name,
                collections: (cData.collections || []).map((c: any) => {
                  const storageStr = c.storageSize 
                    ? `${(c.storageSize / 1024).toFixed(2)} KB` 
                    : (c.size ? `${(c.size / 1024).toFixed(2)} KB` : "0 B");
                  return {
                    name: c.name,
                    label: c.name,
                    count: c.count || 0,
                    storage: storageStr,
                    indexes: c.indexesCount || 0,
                    fields: [],
                    docs: [],
                  };
                }),
              };
            } catch {
              return { name: db.name, collections: [] };
            }
          })
        );
        setDatabases(fullDbs.filter(d => d.collections.length > 0));
        setLoadingDb(false);
      })
      .catch(() => setLoadingDb(false));
  }, [uri]);

  return { databases, loadingDb };
}
