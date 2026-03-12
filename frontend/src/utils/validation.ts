export function ensureStringQueryParam(name: string, value: unknown): string {
  if (typeof value !== "string") {
    throw new Error(`${name} query parameter must be a string.`);
  }

  const trimmed = value.trim();
  if (!trimmed || trimmed === "null" || trimmed === "undefined") {
    throw new Error(`${name} query parameter is required.`);
  }

  return trimmed;
}

export function ensureValidUuidQueryParam(name: string, value: unknown): string {
  const trimmed = ensureStringQueryParam(name, value);
  const uuidRegex =
    /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

  if (!uuidRegex.test(trimmed)) {
    throw new Error(`${name} query parameter must be a valid UUID.`);
  }

  return trimmed;
}
