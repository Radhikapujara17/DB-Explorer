import { EJSON } from 'bson';

export function parseEJSON(jsonString: string): any {
  if (!jsonString || jsonString.trim() === '') return {};
  try {
    return EJSON.parse(jsonString, { relaxed: true });
  } catch (err: any) {
    throw new Error(`Invalid JSON / EJSON syntax: ${err.message}`);
  }
}

export function serializeEJSON(data: any): any {
  // EJSON.serialize returns EJSON object format; stringify returns string representation.
  // Converting back to JS object with preserved EJSON type tags or relaxed representations.
  return EJSON.serialize(data, { relaxed: true });
}

export function stringifyEJSON(data: any): string {
  return EJSON.stringify(data, undefined, 2, { relaxed: true });
}
