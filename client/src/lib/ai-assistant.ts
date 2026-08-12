import { operators } from "./db-data";

export type AiResult = {
  kind: "filter" | "pipeline";
  code: string;
  steps: string[];
  tips: string[];
};

const NUMBER = /(-?\d+(?:\.\d+)?)/;

/**
 * Offline natural-language → MongoDB translator.
 * Interprets the prompt against the collection's real field names.
 */
export function translatePrompt(prompt: string, fields: string[]): AiResult {
  const text = prompt.toLowerCase();
  const steps: string[] = [];
  const filter: Record<string, unknown> = {};

  const findField = (hints: string[]) =>
    fields.find((f) => hints.some((h) => f.toLowerCase().includes(h))) ?? fields[0] ?? "_id";

  // equality on known word values
  for (const field of fields) {
    const re = new RegExp(`${field.toLowerCase()}\\s+(?:is|=|equals?)\\s+([a-z0-9_@.-]+)`);
    const m = text.match(re);
    if (m?.[1]) {
      filter[field] = Number.isNaN(Number(m[1])) ? m[1] : Number(m[1]);
      steps.push(`Keep only documents where ${field} equals "${m[1]}".`);
    }
  }

  for (const word of ["completed", "processing", "cancelled", "active", "invited", "suspended"]) {
    if (text.includes(word) && !Object.keys(filter).length) {
      const field = findField(["status", "state"]);
      filter[field] = word;
      steps.push(`Match documents whose ${field} is "${word}".`);
    }
  }

  const over = text.match(new RegExp(`(?:over|above|greater than|more than)\\s+${NUMBER.source}`));
  if (over?.[1]) {
    const field = findField(["total", "price", "amount", "spend", "stock"]);
    filter[field] = { $gt: Number(over[1]) };
    steps.push(`Require ${field} greater than ${over[1]}.`);
  }

  const under = text.match(new RegExp(`(?:under|below|less than)\\s+${NUMBER.source}`));
  if (under?.[1]) {
    const field = findField(["total", "price", "amount", "spend", "stock"]);
    filter[field] = { $lt: Number(under[1]) };
    steps.push(`Require ${field} less than ${under[1]}.`);
  }

  const year = text.match(/\b(20\d{2})\b/);
  if (year?.[1]) {
    const field = findField(["createdat", "date", "updatedat"]);
    filter[field] = { $regex: `^${year[1]}` };
    steps.push(`Restrict ${field} to the year ${year[1]}.`);
  }

  const contains = text.match(/contains?\s+"?([a-z0-9_@.-]+)"?/);
  if (contains?.[1]) {
    const field = findField(["name", "email", "title"]);
    filter[field] = { $regex: contains[1], $options: "i" };
    steps.push(`Fuzzy-match ${field} against "${contains[1]}".`);
  }

  const wantsGrouping = /\b(count|group|per|by each|total per|breakdown|average|avg|sum)\b/.test(text);
  const sortField = text.match(/sorted by ([a-z_]+)/)?.[1];
  const descending = /\b(desc|descending|highest|top|largest)\b/.test(text);

  if (wantsGrouping) {
    const groupField = findField(["status", "category", "role", "type"]);
    const metric = findField(["total", "price", "amount", "spend"]);
    const pipeline = [
      ...(Object.keys(filter).length ? [{ $match: filter }] : []),
      {
        $group: {
          _id: `$${groupField}`,
          count: { $sum: 1 },
          [`total_${metric}`]: { $sum: `$${metric}` },
        },
      },
      { $sort: { count: -1 } },
    ];
    steps.push(`Group the remaining documents by ${groupField}.`);
    steps.push(`Count documents and sum ${metric} inside each group.`);
    steps.push("Order groups from largest to smallest.");
    return {
      kind: "pipeline",
      code: JSON.stringify(pipeline, null, 2),
      steps,
      tips: [
        `A compound index on { ${groupField}: 1 } lets $match and $group share one scan.`,
        "Place $match as the first stage so fewer documents reach $group.",
      ],
    };
  }

  if (steps.length === 0) {
    steps.push("No recognisable condition found — returning every document in the collection.");
  }
  if (sortField) steps.push(`Sort results by ${sortField} ${descending ? "descending" : "ascending"}.`);

  return {
    kind: "filter",
    code: JSON.stringify(filter, null, 2),
    steps,
    tips: [
      Object.keys(filter).length
        ? `Index the filtered field(s) ${Object.keys(filter).join(", ")} to avoid a collection scan.`
        : "Add at least one condition before running this on a large collection.",
      "Use a projection to return only the fields you actually render.",
    ],
  };
}

/** Plain-English explanation of a raw query object. */
export function explainQuery(raw: string): string[] {
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const entries = Object.entries(parsed);
    if (entries.length === 0) return ["This query has no conditions, so it returns every document."];
    return entries.map(([field, cond]) => {
      if (cond && typeof cond === "object") {
        const [op, value] = Object.entries(cond as Record<string, unknown>)[0]!;
        const label = operators.find((o) => `$${o.value}` === op)?.label ?? op;
        return `${field}: ${label} ${JSON.stringify(value)}`;
      }
      return `${field} must be exactly ${JSON.stringify(cond)}.`;
    });
  } catch {
    return ["That is not valid JSON yet, so it cannot be explained."];
  }
}
