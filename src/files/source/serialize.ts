/**
 * Renders content as source code for the Source view. Values that are undefined
 * are left out, so Todo fields never reach the page (callers filter them first).
 */
export type Value =
  string | number | boolean | null | undefined | Value[] | { [key: string]: Value };

const pad = (depth: number) => "    ".repeat(depth);
const tsPad = (depth: number) => "  ".repeat(depth);

const entries = (obj: { [key: string]: Value }) =>
  Object.entries(obj).filter(([, v]) => v !== undefined);

/** A Python literal. Objects become keyword arguments when `call` is given. */
export function py(value: Value, depth = 0): string {
  if (value === null || value === undefined) return "None";
  if (typeof value === "boolean") return value ? "True" : "False";
  if (typeof value === "number") return String(value);
  if (typeof value === "string") return JSON.stringify(value);
  if (Array.isArray(value)) {
    if (value.length === 0) return "[]";
    return `[\n${value.map((v) => `${pad(depth + 1)}${py(v, depth + 1)},`).join("\n")}\n${pad(depth)}]`;
  }
  const items = entries(value);
  if (items.length === 0) return "{}";
  return `{\n${items.map(([k, v]) => `${pad(depth + 1)}${JSON.stringify(k)}: ${py(v, depth + 1)},`).join("\n")}\n${pad(depth)}}`;
}

/** A Python call with keyword arguments, e.g. Degree(name="...", ...). */
export function pyCall(name: string, kwargs: { [key: string]: Value }, depth = 0): string {
  const items = entries(kwargs);
  return `${name}(\n${items.map(([k, v]) => `${pad(depth + 1)}${k}=${py(v, depth + 1)},`).join("\n")}\n${pad(depth)})`;
}

const isIdentifier = (k: string) => /^[A-Za-z_$][\w$]*$/.test(k);

/** A JavaScript or TypeScript literal. */
export function js(value: Value, depth = 0): string {
  if (value === null || value === undefined) return "null";
  if (typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) {
    if (value.length === 0) return "[]";
    return `[\n${value.map((v) => `${tsPad(depth + 1)}${js(v, depth + 1)},`).join("\n")}\n${tsPad(depth)}]`;
  }
  const items = entries(value);
  if (items.length === 0) return "{}";
  return `{\n${items
    .map(
      ([k, v]) =>
        `${tsPad(depth + 1)}${isIdentifier(k) ? k : JSON.stringify(k)}: ${js(v, depth + 1)},`,
    )
    .join("\n")}\n${tsPad(depth)}}`;
}

/** "llm-gateway" to "llm_gateway" (Python) or "llmGateway" (JavaScript). */
export const snakeCase = (slug: string) => slug.replace(/-/g, "_");
export const camelCase = (slug: string) =>
  slug.replace(/-(\w)/g, (_, c: string) => c.toUpperCase());
